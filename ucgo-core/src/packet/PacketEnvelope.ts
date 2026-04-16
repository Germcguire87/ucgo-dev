import type { PacketHeader } from "./PacketHeader.js";

export interface PacketEnvelope {
  header: PacketHeader;
  /** Decrypted body — exactly xorSize bytes. */
  body: Buffer;
}
