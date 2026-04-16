# UCGO-DEV

## Overview

UCGO-DEV is a reverse engineering and server implementation project focused on understanding and rebuilding the network protocol and server architecture of **Universal Century Gundam Online (UCGO)**.

The long-term goal is to move beyond fragile, legacy private server implementations and establish a clean, well-documented, and community-friendly foundation — similar in spirit to **SWG Core 3** — that enables modern server development, collaboration, and extensibility.

---

## Goals

* Reverse engineer the UCGO network protocol with high accuracy
* Document packet structures in a clear, reproducible format
* Build tooling to parse, analyze, and generate protocol data
* Enable development of a clean, modern server implementation
* Reduce reliance on legacy, opaque server codebases
* Create a foundation others can understand and contribute to

---

## Project Philosophy

This project is built on a few core principles:

* **Evidence over assumptions**
  All findings should be backed by repeatable capture analysis.

* **Specification over guesswork**
  Documentation should read like a protocol spec, not notes.

* **Separation of concerns**
  Reverse engineering, tooling, and server implementation are distinct layers.

* **Clarity over cleverness**
  The goal is long-term maintainability, not short-term hacks.

---

## Repository Structure

### `ucgo-protocol/`

The **research and documentation hub**.

Contains raw and transformed network captures, extracted packet data, and protocol documentation under `docs/protocol/`. This is the source of truth for all protocol understanding — codec implementations must match what is documented here.

---

### `ucgo-tools/`

The **tooling layer** used to support reverse engineering and testing.

Contains:

* `packet-decoder/` — decrypts and parses raw UCGO captures; the ground truth implementation for crypto
* `script-runner/` — utility scripts for protocol analysis
* `test-harness/` — tools for replaying and validating packet sequences

---

### `ucgo-core/`

The **shared protocol library** consumed by all server implementations.

Provides typed packet codecs, the transport crypto pipeline (Blowfish + XOR), binary read/write primitives, and the packet dispatcher framework. It has no knowledge of accounts, sessions, or business logic.

See [`ucgo-core/README.md`](ucgo-core/README.md) for full API documentation.

---

### `apps/`

The **server implementations**.

| Server | Port | Description |
|--------|------|-------------|
| [`ucgo-info-server`](apps/ucgo-info-server/README.md) | `24012` | Pre-login status ping — responds online/offline before the client attempts auth |
| [`ucgo-login-server`](apps/ucgo-login-server/README.md) | `24018` | Authentication, character data delivery, and game server handoff |

---

## Current Status

### Login Protocol — Implementation Complete (Happy Path)

The full client ↔ login server handshake is documented and implemented end-to-end. A client can authenticate, receive character data, and be handed off to the game server.

#### Info Server

| Opcode | Name | Direction | Protocol Doc | Server Implementation |
|--------|------|-----------|:------------:|:---------------------:|
| `0x00000000` | `CLIENT_INFO_REQUEST` | Client → Info | Complete | Implemented |
| `0x00008000` | `SERVER_INFO_RESPONSE` | Info → Client | Complete | Implemented |

#### Login Server

| Opcode | Name | Direction | Protocol Doc | Server Implementation |
|--------|------|-----------|:------------:|:---------------------:|
| `0x00030000` | `CLIENT_LOGIN_REQUEST` | Client → Login | Complete | Implemented |
| `0x00030001` | `CLIENT_ACCOUNT_ECHO` | Client → Login | Complete | Implemented |
| `0x00030002` | `CLIENT_REQUEST_CHARACTER_DATA` | Client → Login | Complete | Implemented |
| `0x00030003` | `CLIENT_CREATE_CHARACTER` | Client → Login | Complete | Not yet implemented |
| `0x00030004` | `CLIENT_DELETE_CHARACTER` | Client → Login | Complete | Not yet implemented |
| `0x00030005` | `CLIENT_GAME_SERVER_REQUEST` | Client → Login | Complete | Implemented |
| `0x00038000` | `SERVER_LOGIN_RESPONSE` | Login → Client | Complete | Implemented |
| `0x00038001` | `SERVER_CHARACTER_SLOT_LIST` | Login → Client | Complete | Implemented |
| `0x00038002` | `SERVER_CHARACTER_DATA` | Login → Client | Complete | Implemented |
| `0x00038003` | `SERVER_CREATE_CHARACTER_RESPONSE` | Login → Client | Complete | Not yet implemented |
| `0x00038004` | `SERVER_DELETE_CHARACTER_RESPONSE` | Login → Client | Complete | Not yet implemented |
| `0x00038005` | `SERVER_GAME_SERVER_INFO` | Login → Client | Complete | Implemented |

Crypto (non-standard Blowfish + XOR table) is fully documented and implemented. The transport pipeline and login password decryption are verified against known test vectors.

---

## Direction

Near-term:

* Implement character creation (`0x00030003` / `0x00038003`) and deletion (`0x00030004` / `0x00038004`) in the login server
* Replace in-memory repositories with persistent storage

Mid-term:

* Begin documenting the game server protocol (post-login handoff on port `24010`)
* Scaffold `ucgo-game-server` using the same `ucgo-core` foundation

Long-term:

* Deliver a complete, extensible UCGO server stack
* Enable community collaboration and contribution
* Replace reliance on legacy private server implementations

---

## Disclaimer

This project is a reverse engineering effort for educational and preservation purposes.
It is not affiliated with or endorsed by the original developers or publishers of UCGO.

---

## Contributing

Contributions are welcome — protocol findings, tooling improvements, and capture analysis all help.

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to get started and what to expect from the review process.

Please read the [Code of Conduct](CODE_OF_CONDUCT.md) before participating.
