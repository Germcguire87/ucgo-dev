# 0x00000005 — REQUEST_SPACE_CIRCUIT_ITEM

## Status
🟢 Confirmed — Packet structure annotated from hex data; sequential counter pattern confirmed across all captures

## Direction
Client → Game Server

## Summary
Client requests circuit item data (likely spatial grid/territory circuit nodes) in batches, incrementing a counter per packet. Always sent three times in sequence during bootstrap (counter = 0, 1, 2). The body reuses the leading position/entity fields seen in REQUEST_REGIST_COORD_MGR and REQUEST_PLAYER_COORD_UPDATE.

## Confidence
Medium (structure confirmed; "space circuit item" naming from private server registry; exact semantics of circuit items unknown)

## Observed In Captures
- `tiny_move_forward.txt`, `no_movement_pure_idle.txt`, `movement_test.txt`, `very_small_rotation.txt`, `rotation_only.txt`, `initial_game_load_no_movement.txt`
- Sequences: 27, 28, 29 (always three consecutive packets)
- The three packets differ only in `coordValue` and `batchIndex`

## Packet Structure

| Offset | Size | Type  | Name         | Value (example)        | Notes                                                             |
|--------|------|-------|--------------|------------------------|-------------------------------------------------------------------|
| 0x00   | 8    | bytes | posEncoded   | `04 52 D1 5F FC 77 04 33` | Encoded position/entity tag (same leading bytes as 0x00000000, 0x00000002) |
| 0x08   | 4    | u32   | unk0         | `00 00 01 37`           | Constant seen in many coord-related packets                      |
| 0x0C   | 4    | bytes | coordValue   | varies per packet       | Changes each packet; appears to be an IEEE 754 float coordinate  |
| 0x10   | 3    | bytes | unk1         | `00 00 00`              | Always zero                                                      |
| 0x13   | 1    | u8    | batchIndex   | `00`, `01`, `02`        | Monotonically increasing counter: 0 on first send, +1 each time  |

**Total body size: 20 bytes** (XORSize = 20, BlowfishSize = 24)

## Observed Values Per Packet
From `tiny_move_forward.txt`, Sequences 27–29:

| Seq | coordValue (hex) | coordValue (IEEE 754 BE float) | batchIndex |
|-----|-----------------|-------------------------------|------------|
| 27  | `43 C8 00 00`   | 400.0                         | `00`        |
| 28  | `45 7A 00 00`   | ~3968.0                       | `01`        |
| 29  | `45 FA 00 00`   | ~8000.0                       | `02`        |

The `coordValue` field encodes what appears to be an IEEE 754 single-precision float in big-endian byte order, representing an increasing coordinate range. This may indicate batch requests for circuit items within progressively larger radius or coordinate range.

## Capture Examples
From `tiny_move_forward.txt`:
```
Packet 27 (seq 27, batchIndex=0):
0040:   04 52 D1 5F FC 77 04 33 00 00 01 37 43 C8 00 00   .R._.w.3...7C...
0050:   00 00 00 00                                       ....

Packet 28 (seq 28, batchIndex=1):
0040:   04 52 D1 5F FC 77 04 33 00 00 01 37 45 7A 00 00   .R._.w.3...7Ez..
0050:   00 00 00 01                                       ....

Packet 29 (seq 29, batchIndex=2):
0040:   04 52 D1 5F FC 77 04 33 00 00 01 37 45 FA 00 00   .R._.w.3...7E...
0050:   00 00 00 02                                       ....
```

## Flow Context
- Always three consecutive packets at the end of the bootstrap phase (sequences 27, 28, 29)
- Server responds with two 0x00008005 packets (at sequences 27 and 28); no confirmed response for batchIndex=2
- Follows the player looks / simple info requests; marks end of bootstrap before normal gameplay begins

## Open Questions
- What "space circuit items" represent in the game world (spatial nodes, territory circuit points, grid mesh?)
- Why exactly three requests with a counter 0–2 (perhaps 3 is the number of circuit regions or item categories)
- Whether batchIndex and coordValue together encode a spatial range query or a paginated request
- Why sequence 29 (batchIndex=2) has no confirmed server response in captures

## Implementation Notes
- Send three consecutive REQUEST_SPACE_CIRCUIT_ITEM packets with `batchIndex` = 0, 1, 2 during bootstrap
- Populate `posEncoded` and `unk0` from the player's current position state (same values as just-sent REQUEST_REGIST_COORD_MGR)
- The `coordValue` must be populated correctly; use the values observed if static, or derive from player zone data
