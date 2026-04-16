import * as net from "node:net";
import type { PacketDispatcher } from "ucgo-core";
import type { InfoHandlerContext } from "../types/InfoHandlerContext.js";
import type { InfoServerConfig } from "../config/config.js";
import { InfoConnection } from "./InfoConnection.js";

export class InfoTcpServer {
  private readonly server: net.Server;

  constructor(
    private readonly dispatcher: PacketDispatcher<InfoHandlerContext>,
    private readonly config: InfoServerConfig,
  ) {
    this.server = net.createServer((socket) => {
      // InfoConnection wires itself to socket events - no reference needed here
      new InfoConnection(socket, dispatcher, config);
    });

    this.server.on("error", (err) => {
      console.error(`[InfoTcpServer] Server error: ${err.message}`);
    });
  }

  listen(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.config.port, this.config.host, () => {
        console.log(`[InfoTcpServer] Listening on ${this.config.host}:${this.config.port}`);
        resolve();
      });
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err !== undefined) reject(err);
        else resolve();
      });
    });
  }
}
