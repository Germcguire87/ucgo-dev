// SERVER_LOGIN_RESPONSE (0x00038000)
// Research model — high confidence on result + session token correlation

export interface ServerLoginResponse38000 {
  header: PacketHeader38000;

  body: {
    /**
     * Login result code
     * 1 = success
     * 9 = failure
     */
    resultCode: LoginResultCode38000;

    /**
     * Field A
     * - failure: 0xFFFFFFFF
     * - success: populated (likely account-related)
     */
    fieldA: number;

    /**
     * Field B
     * - failure: 0xFFFFFFFF
     * - success: reused in later packets
     * → strongly believed to be session token
     */
    sessionToken: number;

    /**
     * Field C
     * - failure: 0
     * - success: non-zero (0x0A observed)
     * Likely flags / state / stage indicator
     */
    fieldC: number;
  };
}

export interface PacketHeader38000 {
  opcode: 0x00038000;

  sequence: number;     // observed: 1
  sysMessage: number;   // observed: 0

  xorSize: number;      // observed: 16
  blowfishSize: number; // observed: 16

  /**
   * Dynamic per-connection value
   */
  sessionSeed: number;
}

export enum LoginResultCode38000 {
  Success = 1,
  Failure = 9,
}