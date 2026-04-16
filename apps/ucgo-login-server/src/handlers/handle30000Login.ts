/**
 * Handler for CLIENT_LOGIN_REQUEST (0x00030000)
 *
 * Flow:
 *   1. Check maintenance mode
 *   2. Decrypt inner password with loginPasswordCrypto
 *   3. Authenticate via AuthService (validates version, credentials, session uniqueness)
 *   4. On failure: send 0x00038000 with error code, close
 *   5. On success:
 *      a. Mark session authenticated
 *      b. Register active session in SessionService
 *      c. Send 0x00038000 SUCCESS
 *      d. Send 0x00038001 character slot list
 *      e. Send 0x00038002 for each character
 */

import {
  Opcode,
  ClientLoginRequest30000Codec,
  ServerLoginResponse38000Codec,
  ServerCharacterSlotList38001Codec,
  ServerCharacterData38002Codec,
  LoginResultCode,
  decryptLoginPassword,
  type PacketHandler,
  type PacketEnvelope,
  type ClientLoginRequest30000,
} from "ucgo-core";
import type { LoginHandlerContext } from "../types/LoginHandlerContext.js";

export const loginHandler: PacketHandler<ClientLoginRequest30000, LoginHandlerContext> = {
  opcode: Opcode.CLIENT_LOGIN_REQUEST,

  decode(body: Buffer): ClientLoginRequest30000 {
    return ClientLoginRequest30000Codec.decode(body);
  },

  async handle(
    packet: ClientLoginRequest30000,
    _envelope: PacketEnvelope,
    ctx: LoginHandlerContext,
  ): Promise<void> {
    const { session, services, config, send, close } = ctx;
    const verHex = `0x${packet.clientVersion.toString(16).toUpperCase().padStart(8, "0")}`;
    console.log(`[Login] 0x30000 username="${packet.username}" clientVersion=${verHex}`);

    // Maintenance mode short-circuit — reject everyone before touching auth
    if (config.maintenanceMode) {
      console.log(`[Login] Rejecting "${packet.username}" — maintenance mode`);
      send(Opcode.SERVER_LOGIN_RESPONSE, ServerLoginResponse38000Codec.encode({
        resultCode:    LoginResultCode.MAINTENANCE,
        securityToken: 0xffffffff,
        accountId:     0xffffffff,
        ucgmTag:       0xffffffff,
      }));
      close();
      return;
    }

    // Decrypt the inner blowfish payload to recover the plaintext password
    const password = decryptLoginPassword(packet.encryptedPassword, packet.username);

    const result = services.auth.authenticate(
      packet.username,
      password,
      packet.clientVersion,
      config.acceptedClientVersion,
    );

    if (result.resultCode !== LoginResultCode.SUCCESS) {
      const codeHex = `0x${result.resultCode.toString(16).toUpperCase()}`;
      console.log(`[Login] Auth failed for "${packet.username}" — result code ${codeHex}`);
      send(Opcode.SERVER_LOGIN_RESPONSE, ServerLoginResponse38000Codec.encode({
        resultCode:    result.resultCode,
        securityToken: 0xffffffff,
        accountId:     0xffffffff,
        ucgmTag:       0xffffffff,
      }));
      close();
      return;
    }

    // TypeScript: result.account is guaranteed non-undefined when SUCCESS, but
    // we check defensively to avoid a type assertion.
    const account = result.account;
    if (account === undefined) {
      console.error(`[Login] Internal error: SUCCESS but account is undefined`);
      close();
      return;
    }

    // Mark session authenticated
    session.authenticated = true;
    session.username      = account.username;
    session.accountId     = account.accountId;
    session.ucgmTag       = account.ucgmTag;
    services.session.activate(account.accountId, session.connectionId);

    const acctHex = `0x${account.accountId.toString(16).toUpperCase().padStart(8, "0")}`;
    console.log(`[Login] Auth success for "${account.username}" accountId=${acctHex}`);

    // ── 1. Login response ─────────────────────────────────────────────────
    send(Opcode.SERVER_LOGIN_RESPONSE, ServerLoginResponse38000Codec.encode({
      resultCode:    LoginResultCode.SUCCESS,
      securityToken: 0x12345678,  // UCGOhost hardcodes this; purpose unknown
      accountId:     account.accountId,
      ucgmTag:       account.ucgmTag,
    }));

    // ── 2. Character slot list ────────────────────────────────────────────
    const chars       = services.character.getCharactersForAccount(account.accountId);
    const slotRecords = services.character.buildSlotRecords(chars, account.accountId);

    send(Opcode.SERVER_CHARACTER_SLOT_LIST, ServerCharacterSlotList38001Codec.encode({
      accountId:   account.accountId,
      unknown:     0x00,
      countMarker: 0x80 | chars.length,
      slots:       slotRecords,
    }));

    console.log(`[Login] Sent slot list: ${chars.length} character(s)`);

    // ── 3. Character data (one packet per character) ──────────────────────
    for (const char of chars) {
      const charData = services.character.buildCharacterData(char, account.accountId);
      send(Opcode.SERVER_CHARACTER_DATA, ServerCharacterData38002Codec.encode(charData));
      const charHex = `0x${char.characterId.toString(16).toUpperCase().padStart(8, "0")}`;
      console.log(`[Login] Sent char data: "${char.name}" ${charHex}`);
    }
  },
};
