# 0x00000038 — REQUEST_REGISTER_PLAYER

## Status
🟡 Partial — Observed in capture, mapped via private server sources

## Direction
Client → Game Server

## Summary
Registers the player with the game world after initial login.

## Observations
- Sent immediately after 0x00000041
- Small payload
- Likely signals readiness to enter world simulation

## Open Questions
- What exact fields are required?
- Does this trigger server-side entity spawn?
