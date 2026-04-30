# 0x00000013 — REQUEST_SERVER_TIME

## Status
🟢 Confirmed — Observed in multiple live captures; packet structure annotated from hex data

## Direction
Client → Game Server

## Summary
Client requests the current server time early in the bootstrap sequence. Sent once, near the beginning of the connection (sequence 3 in all observed captures), before player-specific data is exchanged.

## Confidence
High

## Observed In Captures
- `tiny_move_forward.txt`, `no_movement_pure_idle.txt`, `movement_test.txt`, `very_small_rotation.txt`, `rotation_only.txt`
- Sequence: 3 (always)
- Occurs: once per session

## Packet Structure

| Offset | Size | Type  | Name       | Value (observed)       | Notes                                                  |
|--------|------|-------|------------|------------------------|--------------------------------------------------------|
| 0x00   | 4    | u32   | unk0       | `00 00 00 00`          | Always zero in captures; purpose unknown               |
| 0x04   | 4    | u32   | sentinel   | `FF FF FF FF`          | Always `0xFFFFFFFF`; possibly "no prior timestamp" sentinel |
| 0x08   | 1    | u8    | unk1       | `00`                   | Always zero; possibly padding                          |

**Total body size: 9 bytes** (XORSize = 9, BlowfishSize = 16)

## Capture Example
From `tiny_move_forward.txt`, Packet 3, Sequence 3:
```
0040:   00 00 00 00 FF FF FF FF 00
```

## Flow Context
- Sent at connection sequence 3, immediately after two 0x00000003 coord update packets
- Always precedes 0x00000070 (REQUEST_OCCUPATION_CITY_INFO_LIST) in the bootstrap
- Server responds with 0x00008013 (RESPONSE_SERVER_TIME) at the same sequence number

## Notes
- The `FF FF FF FF` sentinel in the `sentinel` field likely signals "I have no prior time reference" on first connection
- The sequencing pattern (seq 3 in all captures) suggests this fires at a fixed point in the TCP handshake, before the main bootstrap phase
