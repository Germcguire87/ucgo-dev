# 0x0000000A — REQUEST_PLAYER_LOOKS_BUFF

## Status
🟢 Confirmed — Packet structure annotated from hex data; consistent across all captures

## Direction
Client → Game Server

## Summary
Client requests the player's appearance/equipment-looks data ("looks buff"). Sent once during bootstrap immediately after REQUEST_SIMPLE_PLAYER_INFO. The response carries the player's equipped visual items and appearance state.

## Confidence
Medium (structure confirmed; "looks buff" naming from private server registry)

## Observed In Captures
- `tiny_move_forward.txt`, `no_movement_pure_idle.txt`, `movement_test.txt`, `very_small_rotation.txt`, `rotation_only.txt`, `initial_game_load_no_movement.txt`, `get_in_TGM-79-Trainer-ms.txt`
- Sequence: 26 (always during bootstrap)
- Occurs: once per session

## Packet Structure

| Offset | Size | Type  | Name        | Value (observed) | Notes                                                          |
|--------|------|-------|-------------|------------------|----------------------------------------------------------------|
| 0x00   | 4    | u32   | unk0        | `00 00 00 00`    | Always zero                                                    |
| 0x04   | 4    | u32   | characterId | e.g. `09 7F 45 A0` | Character whose appearance is being requested                |
| 0x08   | 1    | u8    | unk1        | `05`             | Always `5` in all captures; may be a "mode" or appearance-type flag |

**Total body size: 9 bytes** (XORSize = 9, BlowfishSize = 16)

## Capture Example
From `tiny_move_forward.txt`, Packet 26, Sequence 26:
```
0040:   00 00 00 00 09 7F 45 A0 05                        ......E..
```

## Flow Context
Bootstrap sequence order:
1. **Seq 25**: REQUEST_SIMPLE_PLAYER_INFO
2. **Seq 26**: REQUEST_PLAYER_LOOKS_BUFF (this opcode)
3. **Seq 27–29**: REQUEST_SPACE_CIRCUIT_ITEM (×3)

Server responds with 0x0000800A (RESPONSE_PLAYER_LOOKS_BUFF).

## Notes
- The `unk1 = 5` is consistent across all captures including the `get_in_TGM-79-Trainer-ms.txt` mid-session capture (where this was also observed at sequence 4141). This value likely identifies the looks data "category" or "version" to request.
