import type { XorTable } from "ucgo-core";

export interface LoginServerConfig {
  host: string;
  port: number;
  /** Loaded XOR table (131,072 bytes). Loaded once at startup. */
  xorTable: XorTable;
  /** UCGOblowfish transport key. Use "QQzXzQnpzTpnXz" for UCGOhost clients. */
  transportKey: string;
  /** 0x000010A9 — only known observed value. Clients with mismatched versions get WRONG_VERSION. */
  acceptedClientVersion: number;
  /** IP address sent to the client in the game server handoff packet. */
  gameServerIp: string;
  /** Port sent to the client in the game server handoff packet. */
  gameServerPort: number;
  /** When true, all login attempts get MAINTENANCE result code. */
  maintenanceMode: boolean;
}
