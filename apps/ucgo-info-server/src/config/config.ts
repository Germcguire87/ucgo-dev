import type { XorTable } from "ucgo-core";

export interface InfoServerConfig {
  host: string;
  port: number;
  /** Loaded XOR table (131,072 bytes). Loaded once at startup. */
  xorTable: XorTable;
  /** UCGOblowfish transport key. Use "QQzXzQnpzTpnXz" for UCGOhost clients. */
  transportKey: string;
}
