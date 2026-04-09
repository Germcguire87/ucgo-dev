# ucgo-tools

## Overview

`ucgo-tools` is the **tooling and experimentation layer** for the UCGO-DEV project.

It contains utilities used to **analyze, extract, validate, and generate** UCGO protocol data based on real client ↔ server captures.

This is where reverse engineering work becomes **repeatable, testable, and automated**.

---

## 🎯 Purpose

The goal of `ucgo-tools` is to support protocol discovery and validation by providing:

* Tools to parse raw network captures
* Utilities to extract and isolate UCGO packets
* Helpers to inspect and debug packet structures
* Fixture generation for testing protocol behavior
* (Future) a mock client for rapid server-side testing

This layer acts as the **bridge between raw data and structured protocol knowledge**.

---

## 🧠 Philosophy

* **Work from real data**
  All tooling should operate on actual captures whenever possible.

* **Keep tools modular**
  Each tool should have a clear, focused responsibility.

* **Support iteration**
  Reverse engineering is exploratory—tools should evolve easily.

* **Avoid production coupling**
  This is not server code. It should remain flexible and experimental.

---

## 📁 Structure

```txt
ucgo-tools/
  models/
  packet-decoder/
    src/
    data/
    docs/
  script-runner/
    scripts/
```

### `packet-decoder/`

The primary tool. Parses `.pcap` and Wireshark text exports, reassembles TCP streams,
decrypts UCGO packets, and outputs hex dumps and JSON for protocol documentation.

See [packet-decoder/README.md](packet-decoder/README.md) for usage.

### `models/`

TypeScript interfaces matching documented packet structures. Currently covers:

* `ClientLoginRequest30000.ts` — `0x00030000`
* `ServerLoginResponse38000.ts` — `0x00038000`

These are intended to evolve alongside the protocol documentation.

### `script-runner/`

Experimental scripts for isolated crypto and decryption tests. Not part of the main
decode pipeline — used for one-off verification during protocol research.

---

## 🔧 Planned Tools

As the project evolves, additional tools will be added:

### `capture-normalizer/`

* Convert Wireshark dumps and other formats into a consistent structure

### `fixture-builder/`

* Generate reusable packet fixtures for testing

### `packet-inspector/`

* CLI tool to visualize packet structure and fields

### `mock-client/`

* Scriptable client to send packets to a local server
* Enables rapid testing without using the real UCGO client

### `scenario-runner/`

* Higher-level testing framework built on the mock client
* Used to simulate gameplay flows (login, crafting, etc.)

---

## 🔄 How It Fits Into the Project

```txt
raw captures → ucgo-tools → structured data → ucgo-protocol docs → (future) ucgo-core
```

* `ucgo-tools` consumes raw or semi-processed capture data
* Produces structured outputs and insights
* Feeds into protocol documentation (`ucgo-protocol`)
* Eventually supports development and testing of `ucgo-core`

---

## 🚀 Current Status

* Packet decoder is functional — handles `.pcap` and Wireshark text exports
* Full decrypt pipeline operational (Blowfish + XOR table)
* TCP stream reassembly and sliding-window packet detection working
* TypeScript models exist for `0x00030000` and `0x00038000`
* Next: capture normalizer and fixture builder to support broader protocol testing

---

## ⚠️ Notes

* This directory may evolve rapidly as new discoveries are made
* Tool APIs and structures are not yet stable
* Expect refactors as understanding of the protocol improves

---

## 📌 Summary

`ucgo-tools` is the experimental engine of the project—turning raw network data into actionable knowledge and enabling rapid iteration as the UCGO protocol is uncovered.
