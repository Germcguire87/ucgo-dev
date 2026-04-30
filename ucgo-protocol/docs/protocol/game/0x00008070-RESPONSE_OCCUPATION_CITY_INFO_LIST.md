# 0x00008070 — RESPONSE_OCCUPATION_CITY_INFO_LIST

## Status
🟢 Confirmed — Packet structure annotated from hex data; body consistent across multiple captures

## Direction
Game Server → Client

## Summary
Carries the current territorial occupation status of all game cities/zones, including the controlling faction, resource slot ownership per city, capture timestamps, and supply scores. Sent twice per bootstrap (once per client request) with identical content.

## Confidence
Medium (structure mapped from captures; field semantics are inferred from game-domain knowledge)

## Observed In Captures
- `tiny_move_forward.txt`, `no_movement_pure_idle.txt`, `movement_test.txt`, `very_small_rotation.txt`, `rotation_only.txt`, `initial_game_load_no_movement.txt`
- Observed: 2 per session (sequences 21 and 24)
- **Both responses carry identical body bytes each time**

## Packet Structure

### Outer Format

| Offset | Size | Type  | Name       | Value (observed) | Notes                                    |
|--------|------|-------|------------|------------------|------------------------------------------|
| 0x00   | 1    | u8    | cityCount  | `83`             | Number of city entries, with high-bit marker (see below) |
| 0x01   | N×29 | array | entries    | —                | One 29-byte entry per city               |

**Total body size: 88 bytes** (1 header byte + 3 × 29-byte entries, XORSize = BlowfishSize = 88)

### cityCount Encoding
The `cityCount` byte has its high bit set (`0x83` = `0x80 | 3`). This is consistent with the `0x87` and `0x85` marker bytes seen elsewhere in the protocol, suggesting the high bit is a type flag and the low 7 bits encode the count.

### Per-City Entry (29 bytes each)

| Offset | Size | Type  | Name               | Notes                                                      |
|--------|------|-------|--------------------|------------------------------------------------------------|
| 0x00   | 3    | bytes | prefix             | Always `00 00 00`; padding                                 |
| 0x03   | 1    | u8    | cityId             | Sequential city/zone identifier (observed: 0x39, 0x3A, 0x3B = 57, 58, 59) |
| 0x04   | 1    | u8    | unk0               | Always `00`; purpose unknown                               |
| 0x05   | 1    | u8    | controllingFaction | Controlling faction ID (observed values: 1 or 2)           |
| 0x06   | 3    | bytes | unk1               | Always `00 00 00`; padding                                 |
| 0x09   | 1    | u8    | unk2               | Varies (0, 1, 2); may be contested-by faction or sub-state |
| 0x0A   | 4    | u32BE | captureTimestamp   | Unix timestamp of last capture (big-endian)                |
| 0x0E   | 1    | u8    | statusMarker       | Always `0x85`; framing byte for the resource block         |
| 0x0F   | 10   | bytes | resourceSlots      | 5 × u16 — resource slot ownership per slot (faction ID)   |
| 0x19   | 2    | bytes | unk3               | Always `00 00`; possibly a 6th empty slot or padding       |
| 0x1B   | 2    | u16BE | supplyScore        | Supply/score count for this city (e.g. 0x0001, 0x0706, 0x0711) |

### Resource Slots
The 10 bytes at entry offset 0x0F encode 5 resource slots, each as a `(00, factionId)` pair:
- `00 01` = faction 1 owns this slot
- `00 02` = faction 2 owns this slot
- `00 00` = unoccupied or absent

## Capture Example
From `tiny_move_forward.txt`, Packets 62 and 65 (Sequences 21 and 24):
```
0040:   83 00 00 00 39 00 02 00 00 00 01 69 65 BD FD 85   ....9......ie...
0050:   00 02 00 02 00 02 00 02 00 02 00 00 00 01 00 00   ................
0060:   00 3A 00 01 00 00 00 00 69 E9 A7 DD 85 00 01 00   .:......i.......
0070:   01 00 01 00 01 00 01 00 00 07 06 00 00 00 3B 00   ..............;.
0080:   02 00 00 00 02 69 E9 8F 41 85 00 02 00 02 00 02   .....i..A.......
0090:   00 02 00 02 00 00 07 11                           ........
```

### Decoded Entries
| cityId | controlFaction | unk2 | captureTimestamp   | resourceSlots         | supplyScore |
|--------|---------------|------|--------------------|-----------------------|-------------|
| 0x39   | 2             | 1    | `69 65 BD FD`      | [2, 2, 2, 2, 2]       | 0x0001      |
| 0x3A   | 1             | 0    | `69 E9 A7 DD`      | [1, 1, 1, 1, 1]       | 0x0706      |
| 0x3B   | 2             | 2    | `69 E9 8F 41`      | [2, 2, 2, 2, 2]       | 0x0711      |

## Flow Context
- Responds to 0x00000070 (REQUEST_OCCUPATION_CITY_INFO_LIST) twice per bootstrap
- Informs the client of faction territory state at login time
- Used to render faction-controlled city markers and supply status in the world UI

## Open Questions
- Exact meaning of `unk2` (offset 0x09 per entry): whether it indicates contesting faction, previous owner, or some other sub-state
- Whether `supplyScore` (last 2 bytes) represents material supply points, control score, or something else
- Whether `cityId` values are static game constants or dynamic
- Faction ID mappings: which numeric value corresponds to each in-game faction
