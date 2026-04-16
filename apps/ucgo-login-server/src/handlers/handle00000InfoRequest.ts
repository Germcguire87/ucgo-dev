/**
 * Handler for CLIENT_INFO_REQUEST (0x00000000)
 *
 * The info server lives on port 24012; the login server lives on port 24018.
 * With a misconfigured gameclient.cfg (InfoServer pointing at the login server
 * address), the client sends this to us instead.
 *
 * The client REQUIRES a 0x00008000 response before it will send 0x00030000.
 * Without the response it stalls indefinitely on the same connection.
 *
 * Connection lifecycle:
 *   - Info-server connections (1–N before login): client intentionally RSTs
 *     after receiving 0x00008000 — not an error.
 *   - Login connection (final): client receives 0x00008000, stays open, and
 *     then sends 0x00030000 to begin the auth flow on the same connection.
 *
 * TODO: When the info server is implemented on port 24012, remove this handler
 *       from the login server dispatcher. The gameclient.cfg misconfiguration
 *       is in the InfoServer address line.
 *
 * Reference: Opcode0x00.java (UCGOhost info server source)
 */

import {
  Opcode,
  ServerInfoResponse8000Codec,
  type PacketHandler,
  type PacketEnvelope,
} from "ucgo-core";
import type { LoginHandlerContext } from "../types/LoginHandlerContext.js";

export const infoRequestHandler: PacketHandler<Record<string, never>, LoginHandlerContext> = {
  opcode: Opcode.CLIENT_INFO_REQUEST,

  decode(_body: Buffer): Record<string, never> {
    // Client body is empty or ignored — nothing to decode.
    return {};
  },

  async handle(
    _packet: Record<string, never>,
    _envelope: PacketEnvelope,
    ctx: LoginHandlerContext,
  ): Promise<void> {
    const { send } = ctx;

    console.log(`[InfoRequest] CLIENT_INFO_REQUEST — sending Online status`);
    send(Opcode.SERVER_INFO_RESPONSE, ServerInfoResponse8000Codec.encode({ status: 0x00 }));
  },
};
