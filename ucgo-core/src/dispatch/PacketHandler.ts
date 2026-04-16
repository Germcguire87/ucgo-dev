import type { PacketEnvelope } from "../packet/PacketEnvelope.js";

/**
 * A handler for a specific opcode.
 *
 * TPacket  — the typed model decoded from the envelope body
 * TContext — session/connection context provided by the server at dispatch time
 */
export interface PacketHandler<TPacket, TContext> {
  readonly opcode: number;
  decode(body: Buffer): TPacket;
  handle(packet: TPacket, envelope: PacketEnvelope, context: TContext): Promise<void>;
}
