import type { InfoServerConfig } from "../config/config.js";

/**
 * Context object passed to every packet handler by the dispatcher.
 * Gives handlers access to send/close primitives and config.
 */
export interface InfoHandlerContext {
  /** Send a response packet to this connection. */
  send(opcode: number, body: Buffer): void;
  /** Gracefully close this connection (sends pending data, then FIN). */
  close(): void;
  config: InfoServerConfig;
}
