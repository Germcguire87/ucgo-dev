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

```txt id="3n9x8r"
ucgo-protocol/
  captures/
    raw/
    parsed/
    extracted/
  docs/
    protocol/
  packet-catalog.json
  README.md
```

---

### `captures/`

Contains all network data used for reverse engineering.

#### `raw/`

* Original capture data
* Wireshark exports, TCP dumps, or third-party logs
* Never modified

#### `parsed/`

* Structured interpretations of capture data
* Typically generated via tools
* May include decoded headers, field breakdowns, etc.

#### `extracted/`

* Isolated UCGO packet binaries or hex dumps
* Clean inputs for tooling and testing
* Used as fixtures for validation

---

### `docs/protocol/`

Human-readable protocol documentation.

Organized by flow or feature:

```txt
docs/protocol/
  login/
    client-login-request.md
  ...
```

Each document should aim to describe:

* Packet structure
* Field offsets and meanings
* Encoding rules
* Size relationships
* Known vs unknown fields
* Supporting evidence from captures

---

### `packet-catalog.json`

A structured index of known packets.

Each entry may include:

* opcode
* direction (client → server, server → client)
* name
* description
* known fields
* documentation reference
* confidence level

This file acts as a **machine-readable map of the protocol**.

---

## 🔄 Workflow

```txt id="9z2mqp"
raw captures
   ↓
ucgo-tools (parsing, extraction)
   ↓
parsed / extracted data
   ↓
documentation (docs/protocol)
   ↓
packet-catalog.json
```

* Raw data is collected in `captures/raw`
* Tools process and extract meaningful packet data
* Findings are documented in `docs/protocol`
* Structured summaries are added to `packet-catalog.json`

---

## 📊 Confidence Levels

Each documented packet or field should ideally indicate confidence:

* **High** — verified through repeated captures and controlled tests
* **Medium** — strong evidence but not fully confirmed
* **Low** — hypothesis or early-stage finding

This helps prevent assumptions from becoming “facts.”

---

## 🚀 Current Status

* Login request packet (`0x00030000`) is well understood
* Username encoding and packet structure verified
* Encrypted payload boundaries identified
* Beginning expansion into full login flow

---

## ⚠️ Notes

* This is an evolving research area—expect frequent updates
* Not all documentation is complete or finalized
* Some findings may be revised as new evidence emerges

---

## 📌 Summary

`ucgo-protocol` transforms raw network captures into a structured, evidence-backed specification of the UCGO protocol—forming the foundation for tooling, validation, and future server development.
