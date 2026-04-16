# ucgo-login-server

The authentication and character management server for the UCGO protocol. Clients connect here after pinging the info server, authenticate with username and password, receive their character data, and are handed off to the game server.

**Default port:** `24018`

---

## Overview

```
Client                          Login Server (port 24018)
  |                                       |
  |-- CLIENT_LOGIN_REQUEST (0x30000) ---> |  username + encrypted password
  |-- CLIENT_ACCOUNT_ECHO (0x30001) ---> |  echoes stored account ID
  |-- CLIENT_REQUEST_CHARACTER_DATA ---> |  requests known character data
  |                                       |
  |<-- SERVER_LOGIN_RESPONSE (0x38000) -- |  success or error code
  |<-- SERVER_CHARACTER_SLOT_LIST ------  |  list of character slots
  |<-- SERVER_CHARACTER_DATA (×0–2) ----  |  full data per character
  |                                       |
  |  (optional: character create/delete)  |
  |                                       |
  |-- CLIENT_GAME_SERVER_REQUEST -------> |  select character
  |<-- SERVER_GAME_SERVER_INFO ---------- |  game server IP + port
  |
  |-- connects to Game Server (port 24010)
```

The three initial client packets (`0x30000`, `0x30001`, `0x30002`) are sent as a burst before the server responds. The server processes them in order.

---

## Prerequisites

- Node.js 18+
- `xortable.dat` (131,072 bytes) — the XOR key table required for transport crypto

The server defaults to looking for `xortable.dat` at `ucgo-tools/packet-decoder/data/xortable.dat` relative to the project root. Override with the `UCGO_XORTABLE` environment variable.

---

## Running

```bash
npm install
npm start
```

To point at a different XOR table:

```bash
UCGO_XORTABLE=/path/to/xortable.dat npm start
```

---

## Configuration

Configuration is set in `src/bootstrap/createServer.ts`. The relevant options are:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `host` | string | `0.0.0.0` | Interface to bind |
| `port` | number | `24018` | TCP port to listen on |
| `transportKey` | string | `QQzXzQnpzTpnXz` | Blowfish key for transport crypto (UCGOhost clients) |
| `acceptedClientVersion` | number | `0x000010A9` | Clients reporting a different version receive `WRONG_VERSION` |
| `gameServerIp` | string | `127.0.0.1` | IP address sent to the client in the game server handoff |
| `gameServerPort` | number | `24010` | Port sent in the game server handoff |
| `maintenanceMode` | boolean | `false` | When `true`, all login attempts receive `MAINTENANCE` and are rejected |

---

## Seed Accounts

The server ships with an in-memory account and character store for development and testing. All accounts use the password `password`.

| Username | Account ID | Characters |
|----------|------------|------------|
| `nochar` | `0x00000001` | 0 — exercises the empty slot list path |
| `onechar` | `0x00000002` | 1 — "Solo Pilot" (female, Zeon) |
| `twochars` | `0x00000003` | 2 — "Alpha" (male, EF) and "Beta" (female, Zeon) |

To connect real account and character storage, implement the `AccountRepository` and `CharacterRepository` interfaces and replace the in-memory versions in `createServer.ts`.

---

## Authentication Flow

1. **Version check** — client version must match `acceptedClientVersion`
2. **Credential check** — username lookup, then plaintext password comparison (post-decryption)
3. **Session check** — account must not already have an active session

### Result Codes

| Code | Name | Meaning |
|------|------|---------|
| `0x01` | `SUCCESS` | Authenticated; character data follows |
| `0x09` | `BAD_CREDENTIALS` | Unknown username or wrong password |
| `0x0B` | `MAINTENANCE` | Server is in maintenance mode |
| `0x0C` | `WRONG_VERSION` | Client version mismatch |
| `0x15` | `ALREADY_LOGGED_IN` | Account already has an active session |

All non-success responses close the connection immediately.

---

## Opcode Support Matrix

### Client → Server

| Opcode | Name | Status | Notes |
|--------|------|--------|-------|
| `0x00030000` | `CLIENT_LOGIN_REQUEST` | Implemented | Decrypts Blowfish password, authenticates, sends 38000/38001/38002 burst |
| `0x00030001` | `CLIENT_ACCOUNT_ECHO` | Implemented | Validates echoed account ID matches authenticated session |
| `0x00030002` | `CLIENT_REQUEST_CHARACTER_DATA` | Implemented | Validates character ownership, responds with 38002 |
| `0x00030003` | `CLIENT_CREATE_CHARACTER` | Not implemented | |
| `0x00030004` | `CLIENT_DELETE_CHARACTER` | Not implemented | |
| `0x00030005` | `CLIENT_GAME_SERVER_REQUEST` | Implemented | Validates account + character ownership, sends game server IP:port |

### Server → Client

| Opcode | Name | Status | Notes |
|--------|------|--------|-------|
| `0x00038000` | `SERVER_LOGIN_RESPONSE` | Implemented | All 5 result codes supported |
| `0x00038001` | `SERVER_CHARACTER_SLOT_LIST` | Implemented | Sends 0–2 slot records |
| `0x00038002` | `SERVER_CHARACTER_DATA` | Implemented | Full ~597-byte character payload per character |
| `0x00038003` | `SERVER_CREATE_CHARACTER_RESPONSE` | Not implemented | |
| `0x00038004` | `SERVER_DELETE_CHARACTER_RESPONSE` | Not implemented | |
| `0x00038005` | `SERVER_GAME_SERVER_INFO` | Implemented | Returns configured `gameServerIp` + `gameServerPort` |

The complete happy path — from initial connection through to game server handoff — is fully implemented. Character creation and deletion are the only unimplemented branches.

---

## Project Structure

```
src/
  bootstrap/
    createServer.ts         # Wires all dependencies together
    createDispatcher.ts     # Registers opcode handlers
  handlers/
    handle30000Login.ts            # Auth burst entry point
    handle30001AccountEcho.ts      # Account ID validation
    handle30002CharacterDataRequest.ts  # Per-character data on demand
    handle30005GameServerRequest.ts     # Game server handoff
  services/
    AuthService.ts          # Credential + version + session validation
    CharacterService.ts     # Builds slot records and character data packets
    SessionService.ts       # Tracks active sessions (prevents double-login)
  repositories/
    AccountRepository.ts         # Interface
    CharacterRepository.ts       # Interface
    InMemoryAccountRepository.ts # Development seed data
    InMemoryCharacterRepository.ts
  state/
    LoginSessionState.ts    # Per-connection state (auth status, account ID, selected character)
  net/
    LoginTcpServer.ts       # TCP listener
    LoginConnection.ts      # Per-connection lifecycle
    PacketStreamAssembler.ts # Reassembles framed packets from TCP stream
  types/
    LoginHandlerContext.ts  # Handler context (send, close, session, services, config)
  config/
    config.ts               # LoginServerConfig interface
  index.ts                  # Entry point
```

---

## Dependencies

| Package | Role |
|---------|------|
| `ucgo-core` | Protocol codecs, crypto, dispatcher |
| `tsx` | TypeScript execution (dev) |
| `typescript` | Type checking |
