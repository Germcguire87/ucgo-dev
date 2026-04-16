# ucgo-core — Implementation Plan

## What This Package Is

`ucgo-core` contains the generic, reusable building blocks for the UCGO protocol. It has no knowledge of accounts, databases, or business rules. Its single responsibility is:

> Given bytes → typed packets. Given typed packets → bytes.

Everything a login server, game server, or any other UCGO service needs to speak the protocol lives here.

---

## Source of Truth

All implementation must stay consistent with:

- `ucgo-protocol/docs/protocol/login/` — per-opcode field specs
- `ucgo-protocol/docs/protocol/login/CRYPTO_REFERENCE.md` — crypto algorithm spec with test vectors
- `ucgo-tools/packet-decoder/src/ucgoBlowfish.ts` — working reference Blowfish implementation
- `ucgo-tools/packet-decoder/src/ucgoCrypto.ts` — working reference decrypt pipeline
- `ucgo-tools/packet-decoder/data/xortable.dat` — required runtime data file (131,072 bytes)

The packet-decoder **is the ground truth**. If ucgo-core diverges from it in behavior, ucgo-core is wrong.

---

## Directory Layout

```
ucgo-core/src/
  binary/
    BinaryReader.ts           # Read primitive types from a Buffer
    BinaryWriter.ts           # Build a Buffer from primitive types

  crypto/
    UcgoBlowfish.ts           # Non-standard Blowfish (ported from ucgo-tools)
    xorTable.ts               # Load xortable.dat; derive 4-byte XOR key
    transportCrypto.ts        # Outer encrypt/decrypt pipeline for all packets
    loginPasswordCrypto.ts    # Inner encrypt/decrypt for 0x00030000 password field

  packet/
    PacketHeader.ts           # 64-byte header interface + parse/write/validate
    PacketEnvelope.ts         # { header, body } container
    decodePacket.ts           # raw wire bytes → PacketEnvelope
    encodePacket.ts           # PacketEnvelope → raw wire bytes

  protocol/
    opcodes.ts                # Opcode constants (LOGIN_REQUEST = 0x00030000, etc.)
    directions.ts             # PacketDirection enum
    headerConstants.ts        # HEADER_SIZE, MAGIC_HEAD, MAGIC_TAIL, etc.

  session/
    SequenceCounter.ts        # Monotonic per-session sequence number
    PacketSession.ts          # Session state: crypto context + sequence counter

  dispatch/
    PacketHandler.ts          # interface PacketHandler<TPacket, TContext>
    PacketRegistry.ts         # Map<opcode, handler factory>
    PacketDispatcher.ts       # Dispatches decoded envelopes to registered handlers

  models/
    login/
      ClientLoginRequest30000.ts        # 0x00030000 interface + codec
      ClientAccountEcho30001.ts         # 0x00030001 interface + codec
      ClientRequestCharacterData30002.ts # 0x00030002 interface + codec
      ServerLoginResponse38000.ts       # 0x00038000 interface + codec
      ServerCharacterSlotList38001.ts   # 0x00038001 interface + codec
      ServerCharacterData38002.ts       # 0x00038002 interface + codec
      ServerGameServerInfo38005.ts      # 0x00038005 interface + codec

  utils/
    hex.ts                    # formatHex, hexDump
    assert.ts                 # assertBuffer, assertMinLength, etc.
    errors.ts                 # UcgoDecodeError, UcgoCryptoError, etc.

  index.ts                    # Public barrel export
```

---

## Milestone 1: Binary Primitives

**Files:** `src/binary/BinaryReader.ts`, `src/binary/BinaryWriter.ts`

These are the foundation for every packet codec. Nothing else gets built until these are solid and tested.

### BinaryReader

Wraps a `Buffer` with a cursor. All reads advance the cursor.

```ts
class BinaryReader {
  constructor(buf: Buffer)

  // position
  tell(): number
  seek(offset: number): void
  skip(n: number): void
  remaining(): number

  // little-endian
  readUInt16LE(): number
  readUInt32LE(): number

  // big-endian
  readUInt16BE(): number
  readUInt32BE(): number
  readInt32BE(): number

  // raw bytes
  readBytes(n: number): Buffer
  readSlice(n: number): Buffer   // zero-copy subarray

  // strings
  readAscii(n: number): string
  readUtf16LE(charCount: number): string   // reads charCount * 2 bytes
}
```

### BinaryWriter

Accumulates writes, produces a `Buffer` on flush.

```ts
class BinaryWriter {
  // little-endian
  writeUInt16LE(v: number): this
  writeUInt32LE(v: number): this

  // big-endian
  writeUInt16BE(v: number): this
  writeUInt32BE(v: number): this
  writeInt32BE(v: number): this

  // raw bytes
  writeBytes(buf: Buffer | Uint8Array): this
  writePadding(n: number, fill?: number): this   // default fill: 0x00

  // strings
  writeAscii(s: string): this
  writeUtf16LE(s: string): this

  // output
  size(): number
  toBuffer(): Buffer
}
```

### Test Vectors

Round-trip every type: write a value, read it back, assert equality.  
Pay special attention to BE vs LE fields — the header mixes both.

---

## Milestone 2: Packet Header + Envelope

**Files:** `src/packet/PacketHeader.ts`, `src/packet/PacketEnvelope.ts`, `src/protocol/headerConstants.ts`

### Header Constants (`headerConstants.ts`)

```ts
export const HEADER_SIZE = 64;
export const MAGIC_HEAD = "head";   // 0x68656164
export const MAGIC_TAIL = "tail";   // 0x7461696C
export const BODY_OFFSET = 64;
```

### PacketHeader Interface

```ts
interface PacketHeader {
  xorIndex:      number;   // uint16 LE @ 0x04 — selects XOR key from xortable.dat
  sysMessage:    number;   // uint32 LE @ 0x08 — always 0x00000000 observed
  sequence:      number;   // uint32 LE @ 0x0C — 1-indexed per session
  xorSize:       number;   // uint32 LE @ 0x10 — bytes covered by XOR
  blowfishSize:  number;   // uint32 LE @ 0x14 — xorSize rounded to 8-byte boundary
  opcode:        number;   // uint32 LE @ 0x18
}
```

`magicHead` and `magicTail` are not stored in the interface — they are constants and are written/validated by the codec, not stored per-packet.

### Functions

```ts
function parseHeader(buf: Buffer): PacketHeader
function writeHeader(header: PacketHeader): Buffer     // always 64 bytes
function validateHeader(header: PacketHeader): void    // throws UcgoDecodeError
```

`validateHeader` checks:
- `blowfishSize % 8 === 0`
- `xorSize <= blowfishSize`
- `blowfishSize <= MAX_PACKET_BODY_SIZE`

### PacketEnvelope

```ts
interface PacketEnvelope {
  header: PacketHeader;
  body:   Buffer;         // decrypted, xorSize bytes
}
```

---

## Milestone 3: Transport Crypto

**Files:** `src/crypto/UcgoBlowfish.ts`, `src/crypto/xorTable.ts`, `src/crypto/transportCrypto.ts`, `src/crypto/loginPasswordCrypto.ts`

This is the first critical milestone. Get this wrong and every packet is garbage.

### UcgoBlowfish (`UcgoBlowfish.ts`)

Port directly from `ucgo-tools/packet-decoder/src/ucgoBlowfish.ts`.  
Do **not** rewrite from scratch — the reference is proven against real captures.

Two non-standard deviations from RFC Blowfish (see `CRYPTO_REFERENCE.md`):
1. Key schedule accumulator is NOT reset between P-box entries
2. Block I/O is little-endian, not big-endian

```ts
class UcgoBlowfish {
  constructor(key: Buffer | string)
  encrypt(data: Buffer): Buffer   // ECB, in-place-safe
  decrypt(data: Buffer): Buffer   // ECB, in-place-safe
}
```

Input length must be a multiple of 8. Throw `UcgoCryptoError` otherwise.

### XOR Table (`xorTable.ts`)

```ts
type XorTable = Buffer;   // must be exactly 131,072 bytes

function loadXorTable(filePath: string): Promise<XorTable>
function deriveXorKey(index: number, table: XorTable): Buffer  // 4 bytes
```

Key derivation (from `ucgoCrypto.ts`):
```
key[0] = table[index * 2]
key[1] = table[index * 2 + 1]
key[2] = index & 0xFF
key[3] = (index >> 8) & 0xFF
```

### Transport Crypto (`transportCrypto.ts`)

```ts
interface TransportCryptoOptions {
  xorTable:     XorTable;
  blowfishKey:  Buffer | string;
}

// Incoming wire bytes → decrypted { header, body }
function decryptTransportPacket(
  input: Buffer,
  offset: number,
  opts: TransportCryptoOptions
): DecryptedTransportResult

interface DecryptedTransportResult {
  header:        Buffer;  // 64 bytes, fully decrypted
  body:          Buffer;  // xorSize bytes, fully decrypted
  xorSize:       number;
  blowfishSize:  number;
}

// Outgoing PacketEnvelope → wire bytes (random XOR index each call)
function encryptTransportPacket(
  header: PacketHeader,
  body: Buffer,
  opts: TransportCryptoOptions
): Buffer
```

**Decrypt order:**
1. `UcgoBlowfish.decrypt(entire_packet)`
2. Read `xorIndex` from decrypted header `[4:6]`
3. `deriveXorKey(xorIndex, table)`
4. XOR header (64 bytes) + body (xorSize bytes)

**Encrypt order:**
1. Generate random `xorIndex` (0–65535)
2. `deriveXorKey(xorIndex, table)`
3. XOR header + body
4. Write `xorIndex` into header bytes `[4:5]` (LE uint16)
5. `UcgoBlowfish.encrypt(entire_packet)`

### Login Password Crypto (`loginPasswordCrypto.ts`)

Used only for encoding/decoding the password field inside `0x00030000`.

```ts
// Key = username.encode('UTF-16LE') + '\x00\x00'
// Plaintext = password.encode('UTF-16LE'), padded to 8-byte boundary

function encryptLoginPassword(password: string, username: string): Buffer
function decryptLoginPassword(ciphertext: Buffer, username: string): string
```

### Test Vectors (from `CRYPTO_REFERENCE.md`)

Must pass before proceeding to Milestone 4:

| Username     | Password   | First 8 bytes of ciphertext |
|--------------|------------|------------------------------|
| `testuser`   | `a`        | `F1 72 3D 76 FD C3 3C 4A`   |
| `testuser`   | `password` | `13 77 98 C4 1D 8E D6 E0`   |
| `testuser`   | `ZZZZZZZZ` | `4F 1F BE 62 9A 9D 91 C0`   |
| `testuser`   | `1234567`  | `16 3F 79 55 B1 42 2A B5`   |
| `anewaccount`| `abc123`   | `9D 72 FD 8A 71 D4 8A 44`   |

---

## Milestone 4: Packet Codec

**Files:** `src/packet/decodePacket.ts`, `src/packet/encodePacket.ts`

This is the boundary between raw TCP bytes and typed protocol packets.

```ts
interface DecodeContext {
  xorTable:     XorTable;
  blowfishKey:  Buffer | string;
}

interface EncodeContext {
  xorTable:     XorTable;
  blowfishKey:  Buffer | string;
  sequence:     number;
}

function decodeUcgoPacket(rawWireBytes: Buffer, ctx: DecodeContext): PacketEnvelope
function encodeUcgoPacket(envelope: PacketEnvelope, ctx: EncodeContext): Buffer
```

`decodeUcgoPacket`:
1. `decryptTransportPacket(rawWireBytes, 0, ctx)`
2. `parseHeader(decrypted.header)` → `PacketHeader`
3. `validateHeader(header)`
4. Return `{ header, body: decrypted.body }`

`encodeUcgoPacket`:
1. Compute `xorSize = envelope.body.length`
2. Compute `blowfishSize = Math.ceil(xorSize / 8) * 8`
3. Assemble complete `PacketHeader` (caller provides opcode + sequence via ctx)
4. `encryptTransportPacket(header, body, ctx)` → wire bytes

---

## Milestone 5: Typed Login Packet Models

**Files:** `src/models/login/*.ts`, `src/protocol/opcodes.ts`, `src/protocol/directions.ts`

### Opcodes (`opcodes.ts`)

```ts
export const Opcode = {
  // Client → Login Server
  CLIENT_LOGIN_REQUEST:            0x00030000,
  CLIENT_ACCOUNT_ECHO:             0x00030001,
  CLIENT_REQUEST_CHARACTER_DATA:   0x00030002,
  CLIENT_CREATE_CHARACTER:         0x00030003,
  CLIENT_DELETE_CHARACTER:         0x00030004,
  CLIENT_GAME_SERVER_REQUEST:      0x00030005,

  // Login Server → Client
  SERVER_LOGIN_RESPONSE:           0x00038000,
  SERVER_CHARACTER_SLOT_LIST:      0x00038001,
  SERVER_CHARACTER_DATA:           0x00038002,
  SERVER_CREATE_CHARACTER_RESPONSE:0x00038003,
  SERVER_DELETE_CHARACTER_RESPONSE:0x00038004,
  SERVER_GAME_SERVER_INFO:         0x00038005,
} as const;
```

### Codec Pattern

Each model file exports an interface + a codec object:

```ts
// interface
export interface ClientLoginRequest30000 {
  usernameLengthMarker: number;  // 0x80 | charCount
  username:             string;  // UTF-16LE decoded
  clientVersion:        number;  // BE uint32, always 0x000010A9 observed
  payloadSizeMarker:    number;  // 0x80 | ciphertext.length
  encryptedPassword:    Buffer;  // UCGOblowfish ciphertext
}

// codec
export const ClientLoginRequest30000Codec = {
  decode(body: Buffer): ClientLoginRequest30000,
  encode(model: ClientLoginRequest30000): Buffer,
};
```

### Packets to Implement

All body offsets are relative to start of body buffer (header already stripped).

#### `ClientLoginRequest30000` — `0x00030000`

| Offset  | Size            | Field                 | Encoding             |
|---------|-----------------|-----------------------|----------------------|
| 0       | 1               | `usernameLengthMarker`| `0x80 \| charCount`  |
| 1       | `charCount * 2` | `username`            | UTF-16LE             |
| var     | 2               | null terminator       | `00 00`              |
| var     | 4               | `clientVersion`       | BE uint32            |
| var     | 1               | `payloadSizeMarker`   | `0x80 \| byteLen`    |
| var     | `byteLen`       | `encryptedPassword`   | raw bytes            |

#### `ClientAccountEcho30001` — `0x00030001`

| Offset | Size | Field       | Encoding  |
|--------|------|-------------|-----------|
| 0      | 4    | unknown     | BE uint32 (always `0x00000000`) |
| 4      | 4    | `accountId` | BE uint32 |
| 8      | 1    | terminator  | `0x00`    |

#### `ClientRequestCharacterData30002` — `0x00030002`

Structure partially documented. Implement from captures in `ucgo-protocol/captures/parsed/login/`.

#### `ServerLoginResponse38000` — `0x00038000`

| Offset | Size | Field           | Encoding  |
|--------|------|-----------------|-----------|
| 0      | 4    | `resultCode`    | BE uint32 |
| 4      | 4    | `securityToken` | BE uint32 (`0x12345678` in UCGOhost) |
| 8      | 4    | `accountId`     | BE uint32 |
| 12     | 4    | `ucgmTag`       | BE uint32 (`0x0A` = normal account) |

Result codes: `0x01` success, `0x09` bad creds, `0x0B` maintenance, `0x0C` wrong version, `0x15` already logged in.

#### `ServerCharacterSlotList38001` — `0x00038001`

See `0x00038001-SERVER_CHARACTER_SLOT_LIST.md` for full field spec.

#### `ServerCharacterData38002` — `0x00038002`

See `0x00038002-SERVER_CHARACTER_DATA.md` for full field spec (~597 bytes per character).

#### `ServerGameServerInfo38005` — `0x00038005`

See `0x00038005-SERVER_GAME_SERVER_INFO.md`. Contains IP address + port for game server handoff.

---

## Milestone 6: Dispatcher

**Files:** `src/dispatch/PacketHandler.ts`, `src/dispatch/PacketRegistry.ts`, `src/dispatch/PacketDispatcher.ts`

The dispatcher keeps the login server clean. ucgo-core defines the interfaces; each server registers its own handlers.

### PacketHandler Interface

```ts
interface PacketHandler<TPacket, TContext> {
  opcode: number;
  decode(body: Buffer): TPacket;
  handle(packet: TPacket, context: TContext): Promise<void>;
}
```

### PacketRegistry

```ts
class PacketRegistry<TContext> {
  register<TPacket>(handler: PacketHandler<TPacket, TContext>): void
  has(opcode: number): boolean
  get(opcode: number): PacketHandler<unknown, TContext> | undefined
}
```

### PacketDispatcher

```ts
class PacketDispatcher<TContext> {
  constructor(registry: PacketRegistry<TContext>)

  async dispatch(envelope: PacketEnvelope, context: TContext): Promise<void>
}
```

`dispatch` steps:
1. Look up handler by `envelope.header.opcode`
2. If not found, throw `UnknownOpcodeError` (or log and skip — decide per use case)
3. `handler.decode(envelope.body)`
4. `handler.handle(packet, context)`

---

## Execution Order

```
M1 → M2 → M3 (with test vectors) → M4 → M5 → M6
```

Do not start M2 until BinaryReader + BinaryWriter tests pass.  
Do not start M4 until transport crypto passes all test vectors.  
Models (M5) depend on BinaryReader/Writer from M1 — no crypto dependency.  
Dispatcher (M6) depends only on the envelope type from M2.

---

## Transport Keys

| Variant          | Blowfish key       |
|------------------|--------------------|
| Original client  | `chrTCPPassword`   |
| UCGOhost client  | `QQzXzQnpzTpnXz`   |

The login server must use whichever key matches the connecting client variant. For now, target UCGOhost (`QQzXzQnpzTpnXz`) as that is what the captures were taken from.

---

## Known Gaps

| Area                              | Status  | Notes                                              |
|-----------------------------------|---------|----------------------------------------------------|
| `0x00030002` body structure       | Partial | Cross-reference captures to fill in                |
| `0x00038005` full field layout    | Partial | IP + port confirmed; full structure needs captures |
| `0x00030003` / `0x00038003`       | Partial | Character creation — not needed for first login success |
| Game server protocol              | None    | Out of scope for ucgo-core v0.1                    |

---

## What ucgo-core Explicitly Does NOT Do

- No database access
- No account lookups
- No session storage
- No TCP socket handling
- No business logic (auth decisions, GM checks, etc.)
- No knowledge of server state

Those live in `ucgo-login-server` and future packages that depend on `ucgo-core`.
