/**
 * Handler for CLIENT_INFO_REQUEST (0x00000000)
 *
 * Info server runs on port 24012 and responds with SERVER_INFO_RESPONSE (0x00008000).
 * The client expects an 8-byte zero body when online.
 */

import {
  Opcode,
  ServerInfoResponse8000Codec,
  type PacketHandler,
  type PacketEnvelope,
} from "ucgo-core";
import type { InfoHandlerContext } from "../types/InfoHandlerContext.js";

export const infoRequestHandler: PacketHandler<Record<string, never>, InfoHandlerContext> = {
  opcode: Opcode.CLIENT_INFO_REQUEST,

  decode(_body: Buffer): Record<string, never> {
    // Client body is empty or ignored - nothing to decode.
    return {};
  },

  async handle(
    _packet: Record<string, never>,
    _envelope: PacketEnvelope,
    ctx: InfoHandlerContext,
  ): Promise<void> {
    const { send } = ctx;

    console.log("[InfoRequest] CLIENT_INFO_REQUEST - sending Online status");
    send(Opcode.SERVER_INFO_RESPONSE, ServerInfoResponse8000Codec.encode({ status: 0x00 }));
  },
};
