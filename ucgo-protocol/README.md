# ucgo-protocol

## Overview

`ucgo-protocol` is the **research and documentation hub** for the UCGO-DEV project.

It contains all artifacts related to **understanding, documenting, and validating** the UCGO network protocol. This includes raw captures, processed data, structured packet definitions, and human-readable protocol documentation.

This directory is the **source of truth** for protocol knowledge. All codec implementations in `ucgo-core` and server logic in `apps/` must stay consistent with what is documented here.

---

## Purpose

The goal of `ucgo-protocol` is to:

* Collect and organize real client ↔ server network data
* Document packet structures with high accuracy
* Track discoveries and unknowns in a structured format
* Provide a reference specification for tooling and server development
* Separate **evidence (captures)** from **interpretation (docs)**

---

## Philosophy

* **Evidence first** — All conclusions should be backed by real capture data.
* **Spec over notes** — Documentation should be clear, structured, and reusable.
* **Separate raw from processed** — Never mix original data with derived outputs.
* **Track uncertainty** — Unknowns and assumptions should be explicitly documented.

---

## Structure

```
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

### `captures/`

Contains all network data used for reverse engineering.

**`raw/`** — Original capture data, never modified. Organized by capture style: `titans-style/`, `ucgohost-style/`. Wireshark exports and TCP dumps.

**`parsed/`** — Structured output from the packet decoder tool. Used as the primary reference when writing packet documentation.

---

### `docs/protocol/`

Human-readable protocol documentation, organized by flow or feature.

```
docs/protocol/
  login/
    LOGIN_FLOW.md
    CRYPTO_REFERENCE.md
    0x00030000-CLIENT_LOGIN_REQUEST.md
    0x00030001-CLIENT_ACCOUNT_ECHO.md
    0x00030002-CLIENT_REQUEST_CHARACTER_DATA.md
    0x00030003-CLIENT_CREATE_CHARACTER.md
    0x00030004-CLIENT_DELETE_CHARACTER.md
    0x00038000-SERVER_LOGIN_RESPONSE.md
    0x00038001-SERVER_CHARACTER_SLOT_LIST.md
    0x00038002-SERVER_CHARACTER_DATA.md
    0x00038003-SERVER_CREATE_CHARACTER_RESPONSE.md
    0x00038005-SERVER_GAME_SERVER_INFO.md
```

Each document aims to describe: packet structure, field offsets and meanings, encoding rules, size relationships, known vs unknown fields, and supporting evidence from captures.

---

## Workflow

```
raw captures
   ↓
ucgo-tools (parsing, decryption, extraction)
   ↓
captures/parsed/
   ↓
docs/protocol/
   ↓
ucgo-core (codec implementations)
```

---

## Confidence Levels

Each documented packet or field indicates confidence:

* **High** — verified through repeated captures and controlled tests
* **Medium** — strong evidence but not fully confirmed
* **Low** — hypothesis or early-stage finding

This prevents assumptions from becoming facts.

---

## Current Status

### Login Protocol — Documentation

| Opcode | Name | Direction | Doc Status |
|--------|------|-----------|------------|
| `0x00000000` | `CLIENT_INFO_REQUEST` | Client → Info | Covered in LOGIN_FLOW.md |
| `0x00008000` | `SERVER_INFO_RESPONSE` | Info → Client | Covered in LOGIN_FLOW.md |
| `0x00030000` | `CLIENT_LOGIN_REQUEST` | Client → Login | Complete |
| `0x00030001` | `CLIENT_ACCOUNT_ECHO` | Client → Login | Complete |
| `0x00030002` | `CLIENT_REQUEST_CHARACTER_DATA` | Client → Login | Complete |
| `0x00030003` | `CLIENT_CREATE_CHARACTER` | Client → Login | Partial |
| `0x00030004` | `CLIENT_DELETE_CHARACTER` | Client → Login | Complete |
| `0x00030005` | `CLIENT_GAME_SERVER_REQUEST` | Client → Login | Covered in LOGIN_FLOW.md |
| `0x00038000` | `SERVER_LOGIN_RESPONSE` | Login → Client | Complete |
| `0x00038001` | `SERVER_CHARACTER_SLOT_LIST` | Login → Client | Complete |
| `0x00038002` | `SERVER_CHARACTER_DATA` | Login → Client | Complete |
| `0x00038003` | `SERVER_CREATE_CHARACTER_RESPONSE` | Login → Client | Partial |
| `0x00038004` | `SERVER_DELETE_CHARACTER_RESPONSE` | Login → Client | Covered in LOGIN_FLOW.md |
| `0x00038005` | `SERVER_GAME_SERVER_INFO` | Login → Client | Partial — unknown trailing fields |

The encryption scheme (non-standard Blowfish + XOR table) is fully documented in `CRYPTO_REFERENCE.md` with test vectors. The complete login sequence, branching logic, and account ID lifecycle are documented in `LOGIN_FLOW.md`.

---

## Notes

* This is an evolving research area — expect updates as new captures are analyzed
* Partial documents represent real findings; unknown fields are explicitly marked
* Some findings may be revised as new evidence emerges
