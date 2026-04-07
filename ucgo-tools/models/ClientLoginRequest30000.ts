// CLIENT_LOGIN_REQUEST (0x00030000)
// Research model — partial, high-confidence structure

export interface ClientLoginRequest30000 {
  header: PacketHeader30000;

  body: {
    /**
     * Username extracted from UTF-16LE string
     */
    username: string;

    /**
     * Raw encoded username length byte (0x80 | length)
     */
    usernameLengthByte: number;
    usernameLength: number;

    /**
     * Raw encrypted payload (post-username)
     * Deterministic, Blowfish-aligned
     */
    encryptedPayload: Uint8Array;
  };
}

export interface PacketHeader30000 {
  opcode: 0x00030000;

  sequence: number;     // observed: 1
  sysMessage: number;   // observed: 0

  xorSize: number;
  blowfishSize: number;

  /**
   * Dynamic per-connection value (offset 0x04–0x07)
   */
  sessionSeed: number;
}