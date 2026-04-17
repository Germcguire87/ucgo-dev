/**
 * Handler for CLIENT_GAME_SERVER_REQUEST (0x00030005)
 *
 * Sent by the client when the player selects a character and clicks Play.
 * This is the final exchange before the client connects to the game server.
 *
 * Server behaviour:
 *   1. Validate session is authenticated
 *   2. Validate the echoed account ID matches session
 *   3. Send 0x00038005 with game server IP + port
 *
 * The packet contains a securityToken (echoed from 0x00038000) and the
 * accountId. There is no characterId — the selected character is tracked
 * server-side from the prior 0x00030002 exchange.
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
    const { session, config, send } = ctx;
    const acctHex = `0x${packet.accountId.toString(16).toUpperCase().padStart(8, "0")}`;

    if (!session.authenticated || session.accountId === undefined) {
      console.warn(`[GameServerReq] Request on unauthenticated session — ignored.`);
      return;
    }

    console.log(`[GameServerReq] accountId=${acctHex} securityToken=0x${packet.securityToken.toString(16).toUpperCase().padStart(8, "0")}`);

    if (packet.accountId !== session.accountId) {
      console.warn(
        `[GameServerReq] Account mismatch: packet=${acctHex} ` +
        `session=0x${session.accountId.toString(16).toUpperCase().padStart(8, "0")} — ignored.`,
      );
      return;
    }

    const ip = config.gameServerIp;
    console.log(
      `[GameServerReq] Handoff → ${ip}:${config.gameServerPort} for account ${acctHex}`,
    );

    send(Opcode.SERVER_GAME_SERVER_INFO, ServerGameServerInfo38005Codec.encode({
      resultCode:     0x00000001,
      ipLengthMarker: 0x80 | ip.length,
      gameServerIp:   ip,
      gameServerPort: config.gameServerPort,
      unknown:        0x00000000,
    }));
  },
};
