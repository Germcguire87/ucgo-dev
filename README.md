# UCGO Foundation

UCGO Foundation is a shared, stable base for the UCGO private server ecosystem. It turns fragmented, secretive, low-progress hobby servers into a structured, shared, SWG-style ecosystem with compounding progress.

## Vision
- Build a single, well-documented protocol source of truth.
- Make captures, specs, and tools reproducible and sharable.
- Encourage collaboration and reduce duplicated reverse-engineering effort.

## Repository Layout
- ucgo-protocol/ : Canonical protocol documentation, packet specs, and captures.
- ucgo-tools/ : Tooling for parsing, decoding, and validating captures.
- ucgo-tools/packet-decoder/ : The primary parser and decoder for UCGO TCP streams.

## How To Use This Repo
- If you want to decode packets, start in ucgo-tools/packet-decoder.
- If you want to document or learn the protocol, start in ucgo-protocol.

## Contributing
- Prefer evidence-backed docs (captures, dumps, offsets).
- Keep notes actionable and verifiable.
- When adding new knowledge, include how it was derived.
