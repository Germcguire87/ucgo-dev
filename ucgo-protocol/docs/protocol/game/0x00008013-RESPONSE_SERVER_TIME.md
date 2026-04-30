# 0x00008013 — RESPONSE_SERVER_TIME

## Status
🟢 Confirmed — Packet structure annotated from hex data; server timestamp field verified against capture metadata

## Direction
Game Server → Client

## Summary
Server responds with its current Unix timestamp. The timestamp field in the body was verified to match the capture's recorded packet timestamp exactly, confirming this as the authoritative server clock used for client-server time synchronisation.

## Confidence
High

## Observed In Captures
- `tiny_move_forward.txt`, `no_movement_pure_idle.txt`, `movement_test.txt`, `very_small_rotation.txt`, `rotation_only.txt`
- Sequence: 3 (mirrors request)
- Occurs: once per session

## Packet Structure

| Offset | Size | Type  | Name          | Value (observed)       | Notes                                                    |
|--------|------|-------|---------------|------------------------|----------------------------------------------------------|
| 0x00   | 2    | u16   | subType       | `00 27`                | 0x0027 = 39; purpose unknown, may be a result sub-code  |
| 0x02   | 2    | u16   | constant      | `00 02`                | Appears as a constant `0x0002` in many server responses  |
| 0x04   | 4    | u32   | serverTime    | e.g. `69 E9 84 EA`    | Current server Unix timestamp, **big-endian**            |
| 0x08   | 20   | bytes | padding       | `00 × 20`              | Always zero; purpose unknown                             |

**Total body size: 28 bytes** (XORSize = 28, BlowfishSize = 32)

## Timestamp Verification
Capture time recorded for `tiny_move_forward.txt`: `1776911594.115014`

Body bytes at offset 0x04: `69 E9 84 EA`
```
0x69 E9 84 EA = 1,776,911,594 decimal  ← exact match to capture timestamp
```
This confirms `serverTime` encodes the current wall-clock Unix timestamp in big-endian u32 format.

## Capture Example
From `tiny_move_forward.txt`, Packet 44, Sequence 3:
```
0040:   00 27 00 02 69 E9 84 EA 00 00 00 00 00 00 00 00   .'..i...........
0050:   00 00 00 00 00 00 00 00 00 00 00 00               ............
```

## Flow Context
- Responds to client opcode 0x00000013 at the same sequence number
- Client can use `serverTime` to compute clock drift and align game-time references
- Followed by a large batch of 0x00008016 (RESPONSE_ITEM_INFO) packets as the main bootstrap continues

## Implementation Notes
- Your server must return the current Unix wall-clock time as a big-endian u32 at offset 0x04
- The 20 bytes of trailing zeros appear to be unused padding; send them as-is
- The meaning of `subType = 0x0027` is not yet understood; replicate it verbatim
