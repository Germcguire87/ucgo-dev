/**
 * Manages a single client TCP connection for the lifetime of one info session.
 */

import type { Socket } from "node:net";
import { randomUUID } from "node:crypto";
import {
  PacketSession,
  encodeUcgoPacket,
  type PacketDispatcher,
  type PacketEnvelope,
} from "ucgo-core";
import type { InfoServerConfig } from "../config/config.js";
import type { InfoHandlerContext } from "../types/InfoHandlerContext.js";
import { PacketStreamAssembler } from "./PacketStreamAssembler.js";

export class InfoConnection {
  readonly connectionId: string;

  private readonly packetSession: PacketSession;
  private readonly assembler: PacketStreamAssembler;

  constructor(
    private readonly socket: Socket,
    private readonly dispatcher: PacketDispatcher<InfoHandlerContext>,
    private readonly config: InfoServerConfig,
  ) {
    this.connectionId = randomUUID();

    this.packetSession = new PacketSession({
      xorTable:    config.xorTable,
      blowfishKey: config.transportKey,
    });
    // Info server packets are observed with sequence 0.
    this.packetSession.sequence.reset(0);

    this.assembler = new PacketStreamAssembler({
      xorTable:    config.xorTable,
      blowfishKey: config.transportKey,
    });

    socket.on("data",  (chunk: Buffer) => { this.onData(chunk); });
    socket.on("close", ()              => { this.onClose();      });
    socket.on("error", (err: Error)    => { this.onError(err);   });

    console.log(
      `[${this.tag()}] Connected from ${socket.remoteAddress ?? "?"}:${socket.remotePort ?? "?"}`,
    );
  }

  private onData(chunk: Buffer): void {
    let packets: PacketEnvelope[];
    try {
      packets = this.assembler.feed(chunk);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[${this.tag()}] Crypto error in stream: ${msg} - dropping connection.`);
      this.socket.destroy();
      return;
    }

    for (const envelope of packets) {
      const opHex = hex8(envelope.header.opcode);
      console.log(`[${this.tag()}] RX ${opHex} seq=${envelope.header.sequence}`);

      const ctx = this.buildContext();
      this.dispatcher.dispatch(envelope, ctx).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[${this.tag()}] Handler error for ${opHex}: ${msg}`);
      });
    }
  }

  private onClose(): void {
    console.log(`[${this.tag()}] Disconnected.`);
  }

  private onError(err: Error): void {
    console.error(`[${this.tag()}] Socket error: ${err.message}`);
  }

  private send(opcode: number, body: Buffer): void {
    const xorSize      = body.length;
    const blowfishSize = Math.ceil(xorSize / 8) * 8;

    const envelope: PacketEnvelope = {
      header: {
        opcode,
        sequence:    this.packetSession.sequence.next(),
        sysMessage:  0,
        xorIndex:    0, // overwritten with a random value by encodeUcgoPacket
        xorSize,
        blowfishSize,
      },
      body,
    };

    const wire = encodeUcgoPacket(envelope, this.packetSession.cryptoOptions);
    this.socket.write(wire);

    console.log(`[${this.tag()}] TX ${hex8(opcode)} seq=${envelope.header.sequence} (${wire.length} bytes)`);
  }

  private close(): void {
    this.socket.end();
  }

  private buildContext(): InfoHandlerContext {
    return {
      send:   (opcode, body) => { this.send(opcode, body); },
      close:  ()             => { this.close(); },
      config: this.config,
    };
  }

  /** Short connection ID prefix for log lines. */
  private tag(): string {
    return `conn:${this.connectionId.slice(0, 8)}`;
  }
}

function hex8(n: number): string {
  return `0x${n.toString(16).toUpperCase().padStart(8, "0")}`;
}
