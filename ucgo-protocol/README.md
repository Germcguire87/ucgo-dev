# UCGO Protocol

This package is the protocol source of truth for UCGO. It collects packet specs, opcode notes, and real captures so the community can document the protocol in a stable, shared way.

## Contents
- docs/protocol/ : Packet-level documentation (login, game, CMS, etc).
- captures/ : Raw captures and decoded dumps used as evidence.
- README files inside subfolders explain the expected structure.

## Using It
- Use the packet-decoder tool to generate canonical hex dumps.
- Derive fields from real packets and document them here.
- Keep terminology consistent and prefer concrete offsets and sizes.

## Contribution Guide
- Add new packet docs with opcode, direction, fields, and examples.
- Include capture references or dumps that support the fields.
- Mark unknown fields clearly and avoid speculation.
