# ucgo-core

The shared protocol library for the UCGO server stack. It has no knowledge of accounts, databases, sessions, or business rules. Its single responsibility is:

> Given bytes → typed packets. Given typed packets → bytes.

Every server in this project (`ucgo-login-server`, `ucgo-info-server`, and any future game server) depends on this package.

---

## What's Inside

| Module | Description |
|--------|-------------|
| `binary/` | `BinaryReader` and `BinaryWriter` — cursor-based primitives for all codec work |
| `crypto/` | Non-standard Blowfish, XOR table, transport layer crypto, login password crypto |
| `packet/` | Packet header parsing, envelope type, encode/decode pipeline |
| `protocol/` | Opcode constants, direction enum, header constants |
| `session/` | Sequence counter, `PacketSession` (crypto context + counter per connection) |
| `dispatch/` | `PacketHandler` interface, `PacketRegistry`, `PacketDispatcher` |
| `models/` | Typed interfaces + codecs for each implemented opcode |
| `utils/` | Hex formatting, assertion helpers, typed error classes |

---

## Installation

This package is consumed as a local file dependency:

```json
{
  "dependencies": {
    "ucgo-core": "file:../../ucgo-core"
  }
}
```

After adding the dependency:

```bash
npm install
```

---

## Prerequisites

ucgo-core itself has no runtime dependencies beyond Node.js. However, the transport crypto requires a `xortable.dat` file (131,072 bytes) at runtime. The canonical copy lives in `ucgo-tools/packet-decoder/data/xortable.dat`.

Load it once at server startup and pass it into `PacketSession`:

```ts
import { loadXorTable } from "ucgo-core";

const xorTable = await loadXorTable("/path/to/xortable.dat");
```

---

## Transport Keys

The Blowfish transport key depends on which client variant is connecting:

| Client Variant | Blowfish Key |
|---------------|--------------|
| UCGOhost | `QQzXzQnpzTpnXz` |
| Original client | `chrTCPPassword` |

UCGOhost is the primary target for this implementation.

---

## Crypto Pipeline

All UCGO packets are double-encrypted on the wire:

**Incoming (decrypt order):**
1. Blowfish ECB decrypt (entire packet)
2. Read `xorIndex` from header bytes `[4:6]`
3. Derive 4-byte XOR key from `xortable.dat`
4. XOR header (64 bytes) + body (`xorSize` bytes)

**Outgoing (encrypt order):**
1. Generate random `xorIndex` (0–65535)
2. Derive XOR key, apply to header + body
3. Blowfish ECB encrypt (entire packet)

The Blowfish implementation is non-standard (see `ucgo-protocol/docs/protocol/login/CRYPTO_REFERENCE.md`):
- Key schedule accumulator is NOT reset between P-box entries
- Block I/O is little-endian, not big-endian

---

## Using the Dispatcher

```ts
import {
  PacketRegistry,
  PacketDispatcher,
  type PacketHandler,
  type PacketEnvelope,
} from "ucgo-core";

// 1. Define your handler context
interface MyContext {
  send: (opcode: number, body: Buffer) => void;
}

// 2. Implement a handler
const myHandler: PacketHandler<MyPacket, MyContext> = {
  opcode: 0x00030000,
  decode(body: Buffer): MyPacket { /* ... */ },
  async handle(packet, _envelope, ctx): Promise<void> { /* ... */ },
};

// 3. Register and dispatch
const registry = new PacketRegistry<MyContext>();
registry.register(myHandler);

const dispatcher = new PacketDispatcher(registry);
await dispatcher.dispatch(envelope, context);
```

---

## Opcode Support Matrix

This table shows which opcodes have typed models and codecs implemented in ucgo-core.

### Info Server

| Opcode | Name | Direction | Codec |
|--------|------|-----------|-------|
| `0x00000000` | `CLIENT_INFO_REQUEST` | Client → Info | — (empty body) |
| `0x00008000` | `SERVER_INFO_RESPONSE` | Info → Client | `ServerInfoResponse8000Codec` |

### Login Server — Client → Server

| Opcode | Name | Codec | Status |
|--------|------|-------|--------|
| `0x00030000` | `CLIENT_LOGIN_REQUEST` | `ClientLoginRequest30000Codec` | Implemented |
| `0x00030001` | `CLIENT_ACCOUNT_ECHO` | `ClientAccountEcho30001Codec` | Implemented |
| `0x00030002` | `CLIENT_REQUEST_CHARACTER_DATA` | `ClientRequestCharacterData30002Codec` | Implemented |
| `0x00030003` | `CLIENT_CREATE_CHARACTER` | — | Not yet implemented |
| `0x00030004` | `CLIENT_DELETE_CHARACTER` | — | Not yet implemented |
| `0x00030005` | `CLIENT_GAME_SERVER_REQUEST` | `ClientGameServerRequest30005Codec` | Implemented |

### Login Server — Server → Client

| Opcode | Name | Codec | Status |
|--------|------|-------|--------|
| `0x00038000` | `SERVER_LOGIN_RESPONSE` | `ServerLoginResponse38000Codec` | Implemented |
| `0x00038001` | `SERVER_CHARACTER_SLOT_LIST` | `ServerCharacterSlotList38001Codec` | Implemented |
| `0x00038002` | `SERVER_CHARACTER_DATA` | `ServerCharacterData38002Codec` | Implemented |
| `0x00038003` | `SERVER_CREATE_CHARACTER_RESPONSE` | — | Not yet implemented |
| `0x00038004` | `SERVER_DELETE_CHARACTER_RESPONSE` | — | Not yet implemented |
| `0x00038005` | `SERVER_GAME_SERVER_INFO` | `ServerGameServerInfo38005Codec` | Implemented |

---

## What ucgo-core Explicitly Does NOT Do

- No database access
- No account or character lookups
- No session storage
- No TCP socket handling
- No business logic (auth decisions, GM checks, etc.)
- No knowledge of which server is running

Those responsibilities live in the server packages that depend on this library.
