# ucgo-tools

## Overview

`ucgo-tools` is the **tooling and experimentation layer** for the UCGO-DEV project.

It contains utilities used to **analyze, extract, validate, and generate** UCGO protocol data based on real client ↔ server captures.

---

## Purpose

* Parse raw network captures and reassemble TCP streams
* Decrypt and inspect UCGO packets
* Validate `ucgo-core` codec implementations against real capture data
* Verify crypto test vectors from `ucgo-protocol/docs/protocol/login/CRYPTO_REFERENCE.md`

---

## Philosophy

* **Work from real data** — All tooling operates on actual captures whenever possible.
* **Keep tools modular** — Each tool has a clear, focused responsibility.
* **Support iteration** — Reverse engineering is exploratory; tools should evolve easily.
* **Avoid production coupling** — This is not server code. It remains flexible and experimental.

---

## Structure

```
ucgo-tools/
  packet-decoder/     # Decrypts raw captures; the ground truth crypto implementation
  script-runner/      # One-off scripts for isolated crypto and protocol research
  test-harness/       # Feeds real captures through ucgo-core and validates results
  models/             # Legacy TypeScript packet interfaces (superseded by ucgo-core)
```

---

### `packet-decoder/`

The primary reverse engineering tool. Parses `.pcap` and Wireshark text exports, reassembles TCP streams, decrypts UCGO packets using the non-standard Blowfish + XOR pipeline, and outputs hex dumps and JSON for protocol documentation.

This is the **ground truth** implementation for crypto. If `ucgo-core` ever diverges from `packet-decoder` in behavior, `ucgo-core` is wrong.

See [packet-decoder/README.md](packet-decoder/README.md) for usage.

---

### `test-harness/`

Feeds real UCGO packet captures through `ucgo-core` and validates the full wire decode pipeline. Also runs crypto test vectors from the protocol documentation.

```bash
cd test-harness
npm install
npm run vectors                      # Run crypto vector validation only
npm run run <capture.pcap>           # Decode a single capture
npm run run                          # Batch mode — scans ucgo-protocol/captures/raw/ucgohost-style/login/
npm run run <capture.pcap> --verbose # Include raw body hex dump
npm run run <capture.pcap> --original # Use chrTCPPassword instead of UCGOhost key
```

---

### `script-runner/`

Experimental scripts for isolated crypto and decryption tests. Not part of the main decode pipeline — used for one-off verification during protocol research.

Scripts:
- `decryptTest.ts` — early Blowfish key candidate analysis against known ciphertext blocks
- `checkVector.ts` — investigation script for the login password crypto test vectors

---

### `models/`

Legacy TypeScript packet interfaces created before `ucgo-core` existed. Covers `ClientLoginRequest30000` and `ServerLoginResponse38000`. Kept for historical reference; `ucgo-core` is the authoritative source for all packet models.

---

## How It Fits

```
raw captures → packet-decoder → captures/parsed/ → ucgo-protocol docs
                                                          ↓
                    test-harness ← ucgo-core (codecs) ←──┘
```

* `packet-decoder` processes raw capture data and produces the parsed output that feeds protocol documentation
* `ucgo-core` implements the codecs derived from that documentation
* `test-harness` closes the loop by running real captures through `ucgo-core` and confirming the decode output matches what `packet-decoder` produces

---

## Current Status

* `packet-decoder` — functional; handles `.pcap` and Wireshark text exports, full decrypt pipeline (Blowfish + XOR), TCP stream reassembly
* `test-harness` — functional; crypto vector validation passes, capture decode pipeline wired to `ucgo-core`
* `script-runner` — research scripts used during Blowfish key and password crypto investigation; not part of any pipeline
* `models/` — legacy; use `ucgo-core` for all packet model needs

---

## Notes

* Tool APIs and structures are not yet stable
* Expect refactors as protocol understanding improves
* The `packet-decoder` requires `xortable.dat` in `packet-decoder/data/`
