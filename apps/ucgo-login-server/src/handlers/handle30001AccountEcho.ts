/**
 * Handler for CLIENT_ACCOUNT_ECHO (0x00030001)
 *
 * The client sends this in the same TCP burst as 0x00030000. It echoes
 * the account ID from a *prior* session (0x00000000 on first login).
 *
 * Server behaviour:
 *   - accountId == 0: first-time login, nothing to validate — accept silently
 *   - session not yet authenticated: burst arrived before handler processed
 *     0x00030000 — also accept (ordering is deterministic within one connection)
 *   - authenticated + mismatch: suspicious — log and close
 *   - authenticated + match: confirm and continue
 */

import {
  Opcode,
  ClientAccountEcho30001Codec,
  type PacketHandler,
  type PacketEnvelope,
  type ClientAccountEcho30001,
} from "ucgo-core";
import type { LoginHandlerContext } from "../types/LoginHandlerContext.js";

export const accountEchoHandler: PacketHandler<ClientAccountEcho30001, LoginHandlerContext> = {
  opcode: Opcode.CLIENT_ACCOUNT_ECHO,

  decode(body: Buffer): ClientAccountEcho30001 {
    return ClientAccountEcho30001Codec.decode(body);
  },

  async handle(
    packet: ClientAccountEcho30001,
    _envelope: PacketEnvelope,
    ctx: LoginHandlerContext,
  ): Promise<void> {
    const { session, close } = ctx;

    // First login — client has no prior account ID to echo
    if (packet.accountId === 0) {
      console.log(`[AccountEcho] First-time login (accountId=0)`);
      return;
    }

    // If session is now authenticated, validate the echo
    if (session.authenticated && session.accountId !== undefined) {
      if (packet.accountId !== session.accountId) {
        console.warn(
          `[AccountEcho] MISMATCH: echoed 0x${packet.accountId.toString(16).toUpperCase()} ` +
          `vs session 0x${session.accountId.toString(16).toUpperCase()} — closing.`,
        );
        close();
      } else {
        console.log(
          `[AccountEcho] Confirmed accountId=0x${packet.accountId.toString(16).toUpperCase()}`,
        );
      }
    } else {
      // Burst ordering: echo arrived, but auth handler hasn't run yet.
      // (In practice, handlers run serially — this branch shouldn't trigger.)
      console.log(
        `[AccountEcho] Pre-auth echo 0x${packet.accountId.toString(16).toUpperCase()} — accepted`,
      );
    }
  },
};
