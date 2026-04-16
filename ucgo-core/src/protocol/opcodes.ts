export const Opcode = {
  // ── Info Server ──────────────────────────────────────────────────────────────
  CLIENT_INFO_REQUEST:               0x00000000,
  SERVER_INFO_RESPONSE:              0x00008000,

  // ── Client → Login Server ────────────────────────────────────────────────────
  CLIENT_LOGIN_REQUEST:              0x00030000,
  CLIENT_ACCOUNT_ECHO:               0x00030001,
  CLIENT_REQUEST_CHARACTER_DATA:     0x00030002,
  CLIENT_CREATE_CHARACTER:           0x00030003,
  CLIENT_DELETE_CHARACTER:           0x00030004,
  CLIENT_GAME_SERVER_REQUEST:        0x00030005,

  // ── Login Server → Client ────────────────────────────────────────────────────
  SERVER_LOGIN_RESPONSE:             0x00038000,
  SERVER_CHARACTER_SLOT_LIST:        0x00038001,
  SERVER_CHARACTER_DATA:             0x00038002,
  SERVER_CREATE_CHARACTER_RESPONSE:  0x00038003,
  SERVER_DELETE_CHARACTER_RESPONSE:  0x00038004,
  SERVER_GAME_SERVER_INFO:           0x00038005,
} as const;

export type Opcode = (typeof Opcode)[keyof typeof Opcode];
