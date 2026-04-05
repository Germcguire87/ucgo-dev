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
  tools/
    packet-decoder/
      src/
      test/
```

### `tools/packet-decoder/`

The first major tool in the toolkit.

Responsibilities:

* Parse extracted UCGO packet data
* Decode known packet structures (e.g. login request)
* Validate packet boundaries and fields
* Output structured representations for analysis

This tool is the foundation for understanding and verifying packet formats.

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

* Initial packet decoding tooling in progress
* Focused on login request packet (`0x00030000`)
* Expanding toward broader login flow analysis

---

## ⚠️ Notes

* This directory may evolve rapidly as new discoveries are made
* Tool APIs and structures are not yet stable
* Expect refactors as understanding of the protocol improves

---

## 📌 Summary

`ucgo-tools` is the experimental engine of the project—turning raw network data into actionable knowledge and enabling rapid iteration as the UCGO protocol is uncovered.
