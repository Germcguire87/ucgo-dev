/**
 * Handler for CLIENT_GAME_SERVER_REQUEST (0x00030005)
 *
 * Sent by the client when the player selects a character and clicks Play.
 * This is the final exchange before the client connects to the game server.
 *
 * Server behaviour:
 *   1. Validate session is authenticated
 *   2. Validate the echoed account ID matches session
 *   3. Validate the character belongs to this account
 *   4. Store selected character in session state
 *   5. Send 0x00038005 with game server IP + port
 *
 * After receiving 0x00038005, the client opens a new TCP connection to
 * the game server at the provided address and port (24010).
 */

import {
  Opcode,
  ClientGameServerRequest30005Codec,
  ServerGameServerInfo38005Codec,
  type PacketHandler,
  type PacketEnvelope,
  type ClientGameServerRequest30005,
} from "ucgo-core";
import type { LoginHandlerContext } from "../types/LoginHandlerContext.js";

export const gameServerRequestHandler: PacketHandler<
  ClientGameServerRequest30005,
  LoginHandlerContext
> = {
  opcode: Opcode.CLIENT_GAME_SERVER_REQUEST,

  decode(body: Buffer): ClientGameServerRequest30005 {
    return ClientGameServerRequest30005Codec.decode(body);
  },

  async handle(
    packet: ClientGameServerRequest30005,
    _envelope: PacketEnvelope,
    ctx: LoginHandlerContext,
  ): Promise<void> {
    const { session, services, config, send } = ctx;
    const charHex  = `0x${packet.characterId.toString(16).toUpperCase().padStart(8, "0")}`;
    const acctHex  = `0x${packet.accountId.toString(16).toUpperCase().padStart(8, "0")}`;

    if (!session.authenticated || session.accountId === undefined) {
      console.warn(`[GameServerReq] Request on unauthenticated session — ignored.`);
      return;
    }

    console.log(`[GameServerReq] accountId=${acctHex} characterId=${charHex}`);

    if (packet.accountId !== session.accountId) {
      console.warn(
        `[GameServerReq] Account mismatch: packet=${acctHex} ` +
        `session=0x${session.accountId.toString(16).toUpperCase().padStart(8, "0")} — ignored.`,
      );
      return;
    }

    if (!services.character.isOwnedByAccount(packet.characterId, session.accountId)) {
      console.warn(`[GameServerReq] Char ${charHex} not owned by account ${acctHex} — ignored.`);
      return;
    }

    session.selectedCharacterId = packet.characterId;

    console.log(
      `[GameServerReq] Handoff → ${config.gameServerIp}:${config.gameServerPort} ` +
      `for char ${charHex}`,
    );

    const ip = config.gameServerIp;
    send(Opcode.SERVER_GAME_SERVER_INFO, ServerGameServerInfo38005Codec.encode({
      resultCode:     0x00000001,
      ipLengthMarker: 0x80 | ip.length,
      gameServerIp:   ip,
      gameServerPort: config.gameServerPort,
      unknown:        0x00000000,
    }));
  },
};
