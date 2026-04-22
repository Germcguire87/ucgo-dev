# 0x00008005 — RESPONSE_SPACE_CIRCUIT_ITEM

## Status
🟡 Partial — Observed in live capture; naming based on capture evidence and private server source cross-reference where available

## Direction
Game Server → Client

## Summary
Server response paired with the client space-circuit-item request.

## Confidence
Low

## Observed In Capture
- File: `initial_game_load_no_movement.txt`
- Port: `24010`
- Seen 2 time(s) in this capture
- Observed twice as the likely response counterpart to client opcode 0x00000005.

## Flow Context
- This opcode was observed during the initial game-world bootstrap after login handoff.
- The capture covers character selection, TCP connect to the game server, and initial world load with no movement.
- This document is intentionally conservative and may be renamed as protocol understanding improves.

## Current Understanding
- Opcode: `0x00008005`
- Tentative name: `RESPONSE_SPACE_CIRCUIT_ITEM`
- Direction: Game Server → Client
- Bootstrap role: observed during early world-entry initialization

## Open Questions
- Exact body layout and field meanings
- Whether this packet is mandatory in all login/world-entry flows
- Whether this opcode has sub-modes or result codes in its payload
- How this packet pairs with surrounding request/response traffic

## Notes
- Client-side names are grounded in the private server opcode registries when available.
- Server-side names are currently inferred as response counterparts to the observed client requests.
- This file should be updated as soon as byte-level annotation work begins for this opcode.
