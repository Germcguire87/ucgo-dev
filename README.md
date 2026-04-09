# UCGO-DEV

## Overview

UCGO-DEV is a reverse engineering and tooling project focused on understanding and rebuilding the network protocol and server architecture of **Universal Century Gundam Online (UCGO)**.

The long-term goal is to move beyond fragile, legacy private server implementations and establish a clean, well-documented, and community-friendly foundation—similar in spirit to **SWG Core 3**—that enables modern server development, collaboration, and extensibility.

---

## 🎯 Goals

* Reverse engineer the UCGO network protocol with high accuracy
* Document packet structures in a clear, reproducible format
* Build tooling to parse, analyze, and generate protocol data
* Enable development of a clean, modern server implementation
* Reduce reliance on legacy, opaque server codebases
* Create a foundation others can understand and contribute to

---

## 🧠 Project Philosophy

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

## 📁 Repository Structure

### `ucgo-protocol/`

This is the **research and documentation hub**.

Contains:

* Raw and transformed network captures
* Extracted packet data
* Protocol documentation (`docs/protocol/`)

This directory represents the **source of truth** for protocol understanding.

---

### `ucgo-tools/`

This is the **tooling layer** used to support reverse engineering and testing.

Contains (or will contain):

* Packet decoders and analyzers
* Capture parsing utilities
* Fixture generation tools
* Replay and inspection utilities
* (Future) mock client and scenario runners

These tools operate on real data and help validate protocol findings.

---

### (Planned) `ucgo-core/`

This will become the **server implementation layer**.

It will eventually contain:

* Protocol encoders/decoders used at runtime
* Session and connection handling
* Game server logic
* Services and systems (login, character, world, etc.)

This layer will consume the protocol knowledge established in `ucgo-protocol`.

---

## 🔄 Current Status

### Login Flow — Complete

The full client ↔ login server handshake is documented across 9 packets:

| Opcode | Name | Direction | Status |
|--------|------|-----------|--------|
| `0x00030000` | CLIENT_LOGIN_REQUEST | Client → Server | Complete |
| `0x00030001` | CLIENT_ACCOUNT_ECHO | Client → Server | Complete |
| `0x00030003` | CLIENT_CREATE_CHARACTER | Client → Server | Partial |
| `0x00030004` | CLIENT_DELETE_CHARACTER | Client → Server | Complete |
| `0x00038000` | SERVER_LOGIN_RESPONSE | Server → Client | Complete |
| `0x00038001` | SERVER_CHARACTER_SLOT_LIST | Server → Client | Complete |
| `0x00038002` | SERVER_CHARACTER_DATA | Server → Client | Complete |
| `0x00038003` | SERVER_CREATE_CHARACTER_RESPONSE | Server → Client | Partial |
| `0x00038005` | SERVER_GAME_SERVER_INFO | Server → Client | Partial |

Crypto reference (Blowfish + XOR table, deviations from standard) and the full login flow sequence are also documented.

Tooling for capture parsing, stream reassembly, and decryption is functional.

---

## 🚀 Direction

Near-term focus:

* Begin documenting game server protocol (post-login handoff)
* Create `packet-catalog.json` as a machine-readable index
* Build capture normalization and fixture tooling

Mid-term focus:

* Establish a complete protocol spec for core flows
* Introduce a mock client for rapid server testing
* Begin scaffolding `ucgo-core`

Long-term focus:

* Deliver a clean, extensible UCGO server core
* Enable community collaboration and contribution
* Replace reliance on legacy private server implementations

---

## ⚠️ Disclaimer

This project is a reverse engineering effort for educational and preservation purposes.
It is not affiliated with or endorsed by the original developers or publishers of UCGO.

---

## 🤝 Contributing

Contributions are welcome — protocol findings, tooling improvements, and capture analysis all help.

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to get started and what to expect from the review process.

Please read the [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

---

## 📌 Summary

UCGO-DEV aims to transform fragmented, undocumented knowledge into a structured, reusable foundation for rebuilding UCGO—from protocol to server—cleanly and collaboratively.
