# 0x00008000 — RESPONSE_REGIST_COORD_MGR

## Status
🟢 Confirmed — Packet structure annotated from hex data; structurally mirrors RESPONSE_SERVER_TIME

## Direction
Game Server → Client

## Summary
Server acknowledgement for the coordinate manager registration. Returns a short fixed-size response confirming the player has been registered with the coord manager subsystem. The body structure matches the shape of RESPONSE_SERVER_TIME (0x00008013) with the same `constant = 0x0002` field.

## Confidence
Medium (structure confirmed; name from private server registry)

## Observed In Captures
- `tiny_move_forward.txt`, `no_movement_pure_idle.txt`, `movement_test.txt`, `very_small_rotation.txt`, `rotation_only.txt`, `initial_game_load_no_movement.txt`
- Sequence: 22 (mirrors request)
- Occurs: once per session

## Packet Structure

| Offset | Size | Type  | Name       | Value (observed) | Notes                                                          |
|--------|------|-------|------------|------------------|----------------------------------------------------------------|
| 0x00   | 2    | u16   | subType    | `00 12`          | 0x12 = 18; purpose unknown; compare with 0x0027 in RESPONSE_SERVER_TIME |
| 0x02   | 2    | u16   | constant   | `00 02`          | Constant `0x0002` — appears in many server responses           |
| 0x04   | 24   | bytes | padding    | `00 × 24`        | All zeros                                                      |

**Total body size: 28 bytes** (XORSize = 28, BlowfishSize = 32)

## Capture Example
From `tiny_move_forward.txt`, Packet 63, Sequence 22:
```
0040:   00 12 00 02 00 00 00 00 00 00 00 00 00 00 00 00   ................
0050:   00 00 00 00 00 00 00 00 00 00 00 00               ............
```

## Structural Comparison with RESPONSE_SERVER_TIME (0x00008013)
| Field    | 0x00008013   | 0x00008000   |
|----------|-------------|-------------|
| subType  | `00 27`     | `00 12`     |
| constant | `00 02`     | `00 02`     |
| bytes 4+ | timestamp + zeros | all zeros |

Both responses are 28 bytes. The `subType` (`00 27` vs `00 12`) may identify the response class. The `00 02` constant appears consistent across server acknowledgement packets.

## Flow Context
- Responds to 0x00000000 (REQUEST_REGIST_COORD_MGR) at sequence 22
- After this, the server immediately sends the main wave of territory and coord data (sequences 22–28):
  - 0x00008003 (NOTIFY_PLAYER_COORD_DATA_LIST)
  - 0x00008070 (RESPONSE_OCCUPATION_CITY_INFO_LIST, second copy)
  - 0x00008006 (RESPONSE_SIMPLE_PLAYER_INFO)
  - 0x0000800A (RESPONSE_PLAYER_LOOKS_BUFF)
  - 0x00008005 (RESPONSE_SPACE_CIRCUIT_ITEM, ×2)

## Implementation Notes
- This is a fixed-size 28-byte acknowledgement; no dynamic data required
- Send `subType = 0x0012`, `constant = 0x0002`, followed by 24 zero bytes
- The client does not appear to inspect the payload beyond confirming receipt (no observed retransmission logic)
