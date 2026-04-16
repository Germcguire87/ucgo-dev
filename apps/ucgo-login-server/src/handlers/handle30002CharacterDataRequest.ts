/**
 * Handler for CLIENT_REQUEST_CHARACTER_DATA (0x00030002)
 *
 * The client sends this speculatively for characters it remembers from a
 * prior session, in the same burst as 0x00030000 and 0x00030001.
 *
 * Server behaviour:
 *   - Session not authenticated: silently ignore (character select not open yet)
 *   - Character not owned by account: silently ignore (stale client state)
 *   - Valid request: send 0x00038002
 *
 * Note: The login handler already sends 0x00038002 for all account characters
 * immediately after the slot list. This handler exists for clients that
 * explicitly request individual character data (e.g. post-creation).
 */

import {
  Opcode,
  ClientRequestCharacterData30002Codec,
  ServerCharacterData38002Codec,
  type PacketHandler,
  type PacketEnvelope,
  type ClientRequestCharacterData30002,
} from "ucgo-core";
import type { LoginHandlerContext } from "../types/LoginHandlerContext.js";

export const characterDataRequestHandler: PacketHandler<
  ClientRequestCharacterData30002,
  LoginHandlerContext
> = {
  opcode: Opcode.CLIENT_REQUEST_CHARACTER_DATA,

  decode(body: Buffer): ClientRequestCharacterData30002 {
    return ClientRequestCharacterData30002Codec.decode(body);
  },

  async handle(
    packet: ClientRequestCharacterData30002,
    _envelope: PacketEnvelope,
    ctx: LoginHandlerContext,
  ): Promise<void> {
    const { session, services, send } = ctx;
    const charHex = `0x${packet.characterId.toString(16).toUpperCase().padStart(8, "0")}`;

    if (!session.authenticated || session.accountId === undefined) {
      console.warn(`[CharDataReq] Request for ${charHex} on unauthenticated session — ignored.`);
      return;
    }

    console.log(
      `[CharDataReq] Request for char ${charHex} ` +
      `from account 0x${session.accountId.toString(16).toUpperCase().padStart(8, "0")}`,
    );

    if (!services.character.isOwnedByAccount(packet.characterId, session.accountId)) {
      console.warn(`[CharDataReq] Char ${charHex} not owned by this account — ignored.`);
      return;
    }

    const char = services.character.getCharacterById(packet.characterId);
    if (char === undefined) {
      console.warn(`[CharDataReq] Char ${charHex} not found — ignored.`);
      return;
    }

    const charData = services.character.buildCharacterData(char, session.accountId);
    send(Opcode.SERVER_CHARACTER_DATA, ServerCharacterData38002Codec.encode(charData));
    console.log(`[CharDataReq] Sent char data for "${char.name}" ${charHex}`);
  },
};
