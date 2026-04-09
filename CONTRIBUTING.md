# Contributing to UCGO-DEV

Thank you for your interest in contributing. This project is a reverse engineering and
preservation effort — every packet decoded, every unknown field identified, and every
tool improved moves us closer to a stable, open UCGO foundation.

---

## Table of Contents

- [Where to Start](#where-to-start)
- [Contributing Protocol Documentation](#contributing-protocol-documentation)
- [Contributing Code / Tooling](#contributing-code--tooling)
- [Submitting Captures](#submitting-captures)
- [Pull Request Process](#pull-request-process)
- [Commit Style](#commit-style)
- [Code of Conduct](#code-of-conduct)

---

## Where to Start

- Browse [open issues](../../issues) for tasks that need help
- Read the existing protocol docs in [ucgo-protocol/docs/protocol/](ucgo-protocol/docs/protocol/) to understand the current state
- Run the packet decoder against your own captures to verify or extend findings
- If you've found something new — a packet structure, field meaning, or crypto detail — open an issue or submit a PR

No contribution is too small. Correcting an unknown field, adding a test vector, or
improving a description is genuinely valuable.

---

## Contributing Protocol Documentation

Protocol documentation lives in `ucgo-protocol/docs/protocol/`. Each packet family
has its own subdirectory (e.g., `login/`).

### Standards

**Evidence first.** Every field description should be backed by observed captures.
If you're inferring something, say so and give your reasoning. This project values
honest unknowns over confident guesses.

**Use the existing format.** New packet docs should follow the structure already
established in existing files:

```
## Status
## Direction
## Summary
## Header
## Body
  - Field tables: | Offset | Size | Type | Name | Description |
## Unknowns
## Notes / Observations
## Captures Referenced
```

**Use confidence indicators.** Mark fields and findings with:
- `[HIGH]` — confirmed across multiple captures, behavior is consistent
- `[MEDIUM]` — observed but not exhaustively tested
- `[LOW]` — inferred or seen only once

**Reference your captures.** Name the capture files you used in the `Captures Referenced`
section so findings can be verified.

### Adding a New Packet Doc

1. Create a new `.md` file in the appropriate subdirectory (e.g., `ucgo-protocol/docs/protocol/login/`)
2. Name it after the opcode: e.g., `0x00030005.md`
3. Follow the format above
4. Add an entry to `ucgo-protocol/packet-catalog.json` (once it exists)
5. Submit a PR — see [Pull Request Process](#pull-request-process)

---

## Contributing Code / Tooling

Tooling lives in `ucgo-tools/`. The primary tool is the packet decoder in
`ucgo-tools/packet-decoder/`.

### Setup

```bash
cd ucgo-tools/packet-decoder
npm install
npm run build
```

See [ucgo-tools/packet-decoder/README.md](ucgo-tools/packet-decoder/README.md) for
full usage instructions.

### Standards

- Language: TypeScript
- Keep modules focused — one responsibility per file
- Prefer clarity over cleverness; this code should be readable by someone new to the project
- Don't add features beyond what's needed; speculative abstractions create maintenance burden
- No secrets or credentials in committed code

### Adding a New Tool

1. Create a subdirectory under `ucgo-tools/` (e.g., `ucgo-tools/capture-normalizer/`)
2. Include a `README.md` covering: purpose, setup, usage, and how it fits into the workflow
3. Add an entry in the top-level `ucgo-tools/README.md`

---

## Submitting Captures

Raw `.pcap` files and Wireshark text exports are valuable for verification and cross-referencing.

- Raw captures go in `ucgo-protocol/captures/raw/` (note: large binaries may be tracked separately)
- Parsed/annotated exports go in `ucgo-protocol/captures/parsed/`
- Name captures descriptively: e.g., `login_success_char_select_2024.pcap`
- If a capture contains sensitive data (real credentials, IPs), scrub it before submitting

If you have captures but aren't sure how to process them, open an issue — someone can help.

---

## Pull Request Process

1. Fork the repo and create a branch from `main`
2. Name branches descriptively: e.g., `protocol/0x00038006-game-server-handoff` or `tools/capture-normalizer`
3. Keep PRs focused — one packet, one fix, one feature per PR
4. Write a clear PR description explaining:
   - What you found or changed
   - What evidence or testing backs it up
   - Any remaining unknowns or open questions
5. PRs are reviewed for accuracy and consistency with existing documentation style

There's no automated CI yet. Expect manual review.

---

## Commit Style

Use short, descriptive imperative commit messages:

```
add 0x00038006 game server handoff packet doc
fix offset table in 0x00038002 char data
add xortable key override to packet decoder CLI
```

---

## Code of Conduct

All contributors are expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
