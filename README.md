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
| `ucgo-game-server` _(planned)_ | `24010` | Game world bootstrap, world state, and ongoing gameplay |

---

## Current Status

### Login protocol — complete (happy path)

The full client ↔ login server exchange is documented and implemented end-to-end. A client can authenticate, receive character slot and character data, and be handed off to the game server. Crypto (non-standard Blowfish + XOR table) is fully documented and verified against known test vectors.

See [`ucgo-protocol/docs/protocol/login/`](ucgo-protocol/docs/protocol/login/) for packet-level documentation.

### Game protocol — bootstrap chain documented, server not yet scaffolded

The initial game server bootstrap sequence is documented from live captures. The core opcode chain — session bind, player registration, container/inventory load, and coordinate sync — is confirmed at high confidence against multiple private server implementations.

See [`ucgo-protocol/docs/protocol/game/GAME_FLOW.md`](ucgo-protocol/docs/protocol/game/GAME_FLOW.md) and [`GAME_OPCODE_MATRIX.md`](ucgo-protocol/docs/protocol/game/GAME_OPCODE_MATRIX.md) for current findings.

---

## Direction

Near-term:

* Implement character creation and deletion in the login server
* Replace in-memory repositories with persistent storage

Mid-term:

* Scaffold `ucgo-game-server` using the same `ucgo-core` foundation
* Continue game protocol documentation into active gameplay (movement, combat, chat)

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
