# 0x00000006 — REQUEST_SIMPLE_PLAYER_INFO

## Status
🟢 Confirmed — Packet structure annotated from hex data; consistent across all captures

## Direction
Client → Game Server

## Summary
Client requests a compact player info record, including at minimum the character's display name. Sent once during bootstrap as part of the late-bootstrap player data initialisation phase, after the coord manager is registered.

## Confidence
Medium (structure confirmed; name from private server registry)

## Observed In Captures
- `tiny_move_forward.txt`, `no_movement_pure_idle.txt`, `movement_test.txt`, `very_small_rotation.txt`, `rotation_only.txt`, `initial_game_load_no_movement.txt`
- Sequence: 25 (always)
- Occurs: once per session

## Packet Structure

| Offset | Size | Type  | Name        | Value (observed) | Notes                                                |
|--------|------|-------|-------------|------------------|------------------------------------------------------|
| 0x00   | 4    | u32   | unk0        | `00 00 00 01`    | Always `1`; may be a request type or mode flag       |
| 0x04   | 4    | u32   | characterId | e.g. `09 7F 45 A0` | Requesting player's character ID                   |
| 0x08   | 1    | u8    | unk1        | `01`             | Always `1`; may mirror unk0 or be a separate flag    |

**Total body size: 9 bytes** (XORSize = 9, BlowfishSize = 16)

## Capture Example
From `tiny_move_forward.txt`, Packet 25, Sequence 25:
```
0040:   00 00 00 01 09 7F 45 A0 01                        ......E..
```

## Comparison with Similar Requests
All the small 9-byte bootstrap requests share the same structure (`unk0` u32, `characterId` u32, `trailing` u8):

| Opcode       | unk0 (u32)     | trailing (u8) | Name                          |
|--------------|----------------|---------------|-------------------------------|
| 0x00000006   | `00 00 00 01`  | `01`          | REQUEST_SIMPLE_PLAYER_INFO    |
| 0x0000000A   | `00 00 00 00`  | `05`          | REQUEST_PLAYER_LOOKS_BUFF     |
| 0x00000070   | `00 00 00 00`  | `FF`          | REQUEST_OCCUPATION_CITY_INFO_LIST |
| 0x00000013   | `00 00 00 00`  | `00`          | REQUEST_SERVER_TIME (no charId) |

The `unk0 = 1` in this opcode is unique and may indicate a specific data-type request or mode.

## Flow Context
Bootstrap sequence order around this opcode:
1. Seq 22: REQUEST_REGIST_COORD_MGR
2. Seq 23: REQUEST_PLAYER_COORD_DATA_LIST
3. Seq 24: REQUEST_OCCUPATION_CITY_INFO_LIST (second)
4. **Seq 25: REQUEST_SIMPLE_PLAYER_INFO (this opcode)**
5. Seq 26: REQUEST_PLAYER_LOOKS_BUFF

Server responds with 0x00008006 (RESPONSE_SIMPLE_PLAYER_INFO).
