# ucgo-protocol

## Overview

`ucgo-protocol` is the **research and documentation hub** for the UCGO-DEV project.

It contains all artifacts related to **understanding, documenting, and validating** the UCGO network protocol. This includes raw captures, processed data, structured packet definitions, and human-readable protocol documentation.

This directory represents the **source of truth** for protocol knowledge.

---

## 🎯 Purpose

The goal of `ucgo-protocol` is to:

* Collect and organize real client ↔ server network data
* Document packet structures with high accuracy
* Track discoveries and unknowns in a structured format
* Provide a reference specification for tooling and server development
* Separate **evidence (captures)** from **interpretation (docs)**

---

## 🧠 Philosophy

* **Evidence first**
  All conclusions should be backed by real capture data.

* **Spec over notes**
  Documentation should be clear, structured, and reusable.

* **Separate raw from processed**
  Never mix original data with derived outputs.

* **Track uncertainty**
  Unknowns and assumptions should be explicitly documented.

---

## 📁 Structure

```txt
ucgo-protocol/
  captures/
    raw/
      titans-style/
      ucgohost-style/
    parsed/
      login/
  docs/
    protocol/
      login/
  README.md
```

---

### `captures/`

Contains all network data used for reverse engineering.

#### `raw/`

* Original capture data, never modified
* Organized by capture style: `titans-style/`, `ucgohost-style/`
* Wireshark exports and TCP dumps

#### `parsed/`

* Structured output from the packet decoder tool
* Organized by flow: `login/`
* Used as the primary reference when writing packet documentation

---

### `docs/protocol/`

Human-readable protocol documentation.

Organized by flow or feature:

```txt
docs/protocol/
  login/
    0x00030000-CLIENT_LOGIN_REQUEST.md
    0x00030001-CLIENT_ACCOUNT_ECHO.md
    0x00030003-CLIENT_CREATE_CHARACTER.md
    0x00030004-CLIENT_DELETE_CHARACTER.md
    0x00038000-SERVER_LOGIN_RESPONSE.md
    0x00038001-SERVER_CHARACTER_SLOT_LIST.md
    0x00038002-SERVER_CHARACTER_DATA.md
    0x00038003-SERVER_CREATE_CHARACTER_RESPONSE.md
    0x00038005-SERVER_GAME_SERVER_INFO.md
    CRYPTO_REFERENCE.md
    LOGIN_FLOW.md
```

Each document should aim to describe:

* Packet structure
* Field offsets and meanings
* Encoding rules
* Size relationships
* Known vs unknown fields
* Supporting evidence from captures

---

## 🔄 Workflow

```txt
raw captures
   ↓
ucgo-tools (parsing, extraction)
   ↓
captures/parsed/
   ↓
docs/protocol/
```

* Raw data is collected in `captures/raw`
* Tools process and extract meaningful packet data into `captures/parsed`
* Findings are documented in `docs/protocol`

---

## 📊 Confidence Levels

Each documented packet or field should ideally indicate confidence:

* **High** — verified through repeated captures and controlled tests
* **Medium** — strong evidence but not fully confirmed
* **Low** — hypothesis or early-stage finding

This helps prevent assumptions from becoming “facts.”

---

## 🚀 Current Status

### Login Flow — Documented

| Opcode | Name | Status |
|--------|------|--------|
| `0x00030000` | CLIENT_LOGIN_REQUEST | Complete |
| `0x00030001` | CLIENT_ACCOUNT_ECHO | Complete |
| `0x00030003` | CLIENT_CREATE_CHARACTER | Partial |
| `0x00030004` | CLIENT_DELETE_CHARACTER | Complete |
| `0x00038000` | SERVER_LOGIN_RESPONSE | Complete |
| `0x00038001` | SERVER_CHARACTER_SLOT_LIST | Complete |
| `0x00038002` | SERVER_CHARACTER_DATA | Complete |
| `0x00038003` | SERVER_CREATE_CHARACTER_RESPONSE | Partial |
| `0x00038005` | SERVER_GAME_SERVER_INFO | Partial |

Encryption scheme (Blowfish + XOR table) is fully documented in `CRYPTO_REFERENCE.md`.
Full login sequence and branching logic documented in `LOGIN_FLOW.md`.

Next area: game server protocol (packets exchanged after handoff from login server).

---

## ⚠️ Notes

* This is an evolving research area—expect frequent updates
* Not all documentation is complete or finalized
* Some findings may be revised as new evidence emerges

---

## 📌 Summary

`ucgo-protocol` transforms raw network captures into a structured, evidence-backed specification of the UCGO protocol—forming the foundation for tooling, validation, and future server development.
