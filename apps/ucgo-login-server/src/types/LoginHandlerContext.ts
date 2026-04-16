import type { LoginSessionState } from "../state/LoginSessionState.js";
import type { LoginServerConfig } from "../config/config.js";
import type { AuthService } from "../services/AuthService.js";
import type { CharacterService } from "../services/CharacterService.js";
import type { SessionService } from "../services/SessionService.js";

export interface LoginServices {
  auth: AuthService;
  character: CharacterService;
  session: SessionService;
}

/**
 * Context object passed to every packet handler by the dispatcher.
 * Gives handlers access to session state, send/close primitives, and services.
 */
export interface LoginHandlerContext {
  session: LoginSessionState;
  /** Send a response packet to this connection. */
  send(opcode: number, body: Buffer): void;
  /** Gracefully close this connection (sends pending data, then FIN). */
  close(): void;
  services: LoginServices;
  config: LoginServerConfig;
}
