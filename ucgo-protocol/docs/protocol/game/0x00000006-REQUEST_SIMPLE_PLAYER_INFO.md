# 0x00000006 — REQUEST_SIMPLE_PLAYER_INFO

## Status
🟡 Partial — Observed in live capture; naming based on capture evidence and private server source cross-reference where available

## Direction
Client → Game Server

## Summary
Requests a compact/basic player info payload.

## Confidence
Medium

## Observed In Capture
- File: `initial_game_load_no_movement.txt`
- Port: `24010`
- Seen 1 time(s) in this capture
- Observed once during initial load as a small bootstrap packet.

## Flow Context
- This opcode was observed during the initial game-world bootstrap after login handoff.
- The capture covers character selection, TCP connect to the game server, and initial world load with no movement.
- This document is intentionally conservative and may be renamed as protocol understanding improves.

## Current Understanding
- Opcode: `0x00000006`
- Tentative name: `REQUEST_SIMPLE_PLAYER_INFO`
- Direction: Client → Game Server
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
