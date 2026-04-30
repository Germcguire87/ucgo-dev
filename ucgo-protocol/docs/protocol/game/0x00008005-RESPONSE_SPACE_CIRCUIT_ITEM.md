# 0x00008005 — RESPONSE_SPACE_CIRCUIT_ITEM

## Status
🟢 Confirmed — Two distinct response variants observed; packet structure annotated from hex data

## Direction
Game Server → Client

## Summary
Returns circuit item data in response to REQUEST_SPACE_CIRCUIT_ITEM (0x00000005). Two variants are observed: a **data variant** carrying a circuit item entity record, and a **terminator variant** (4 bytes) signalling the end of the batch. Only two server responses arrive for three client requests (batchIndex 0 and 1 get responses; batchIndex 2 appears to get none, or the response is implicit).

## Confidence
Medium (structure mapped; circuit item semantics not fully understood)

## Observed In Captures
- `tiny_move_forward.txt`, `no_movement_pure_idle.txt`, `movement_test.txt`, `very_small_rotation.txt`, `rotation_only.txt`, `initial_game_load_no_movement.txt`
- Sequences: 27 (data variant), 28 (terminator variant)
- Occurs: 2 per bootstrap

---

## Variant 1 — Data Response (batchIndex 0)

**XORSize: 66 bytes**, responded to batchIndex=0 request

### Structure

| Offset | Size | Type  | Name          | Value (observed)       | Notes                                                        |
|--------|------|-------|---------------|------------------------|--------------------------------------------------------------|
| 0x00   | 2    | u16   | constant      | `00 02`                | Standard server response prefix                              |
| 0x02   | 1    | u8    | resultCode    | `01`                   | `01` = entry follows; `02` = empty/end (see Variant 2)      |
| 0x03   | 1    | u8    | marker        | `81`                   | High-bit marker (`0x80 | 1`?); similar to item record framing|
| 0x04   | 4    | bytes | entityId      | `16 BA 3B 48`          | Circuit item entity ID                                       |
| 0x08   | 4    | u32   | unk0          | `00 00 00 14`          | `0x14 = 20`; purpose unknown                                 |
| 0x0C   | 4    | bytes | unk1          | `00 08 8C CE`          | Some secondary ID or flags                                   |
| 0x10   | 8    | bytes | posEncoded    | `04 52 CB 84 FC 77 02 EE` | Encoded position (same format as player coord packets)    |
| 0x18   | 4    | u32   | unk2          | `00 00 01 5D`          | Counter or ID (`0x15D = 349`)                                |
| 0x1C   | 4    | bytes | unk3          | `00 00 00 00`          | Zeros                                                        |
| 0x20   | 1    | u8    | statusMarker  | `85`                   | Same `0x85` marker seen in RESPONSE_OCCUPATION_CITY_INFO_LIST |
| 0x21   | 1    | u8    | unk4          | `74`                   | `0x74 = 116`; possibly a type or category                    |
| 0x22   | 6    | bytes | unk5          | `00 00 00 00 00 00`    | Zeros                                                        |
| 0x28   | 4    | bytes | unk6          | `00 01 00 00`          | Some flag or sub-count                                       |
| 0x2C   | 4    | bytes | unk7          | `00 00 80 69`          | Partial entity reference?                                    |
| 0x30   | 12   | bytes | unk8          | `E8 9C AD 00 00 00 00 00 00 00 00 69` | Mixed; possibly two entity IDs  |
| 0x3C   | 4    | bytes | unk9          | `E8 9C AD 00`          | Mirrors value at 0x30+0 — possibly a second entity ID        |
| 0x40   | 2    | bytes | trailer       | `00 80`                | End-of-entry marker                                          |

**Total body: 66 bytes**

### Capture Example
From `tiny_move_forward.txt`, Packet 68, Sequence 27:
```
0040:   00 02 01 81 16 BA 3B 48 00 00 00 14 00 08 8C CE   ......;H........
0050:   04 52 CB 84 FC 77 02 EE 00 00 01 5D 00 00 00 00   .R...w.....]....
0060:   85 74 00 00 00 00 00 00 00 01 00 00 00 00 80 69   .t.............i
0070:   E8 9C AD 00 00 00 00 00 00 00 00 69 E8 9C AD 00   ...........i....
0080:   00 80                                             ..
```

---

## Variant 2 — Terminator Response (batchIndex 1)

**XORSize: 4 bytes** — minimal "end of batch" signal

### Structure

| Offset | Size | Type  | Name       | Value     | Notes                                        |
|--------|------|-------|------------|-----------|----------------------------------------------|
| 0x00   | 2    | u16   | constant   | `00 02`   | Standard server response prefix              |
| 0x02   | 1    | u8    | resultCode | `02`      | `02` = end-of-batch / no more entries        |
| 0x03   | 1    | u8    | endMarker  | `80`      | `0x80` end marker                            |

**Total body: 4 bytes**

### Capture Example
From `tiny_move_forward.txt`, Packet 69, Sequence 28:
```
0040:   00 02 02 80                                       ....
```

---

## Flow Context
- Follows immediately after the client's three REQUEST_SPACE_CIRCUIT_ITEM packets
- The data variant (seq 27) delivers one circuit item record
- The terminator variant (seq 28) signals the end of available items
- batchIndex=2 (seq 29) appears to receive no further response — the client may not await one
- After these two responses, the server begins the periodic 0x00008003 (NOTIFY_PLAYER_COORD_DATA_LIST) updates

## Open Questions
- Meaning of `statusMarker = 0x85` and `unk4 = 0x74` within the data entry
- Whether multiple data variant responses can occur for a single batch (if there are many circuit items)
- What the paired entity ID values at offsets 0x2C–0x3D represent
- Whether the terminator is always `02 80` or could carry other result codes

## Implementation Notes
- Respond to batchIndex=0 with the data variant if circuit item data is available, or with the terminator if not
- Respond to batchIndex=1 with the terminator variant
- For batchIndex=2, no response appears required based on captures
- The `0x85` marker at offset 0x20 of the data variant matches the one seen in RESPONSE_OCCUPATION_CITY_INFO_LIST — it may be a protocol-wide "status block follows" marker
