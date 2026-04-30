# 0x0000800A — RESPONSE_PLAYER_LOOKS_BUFF

## Status
🟢 Confirmed — Packet structure annotated from hex data; two distinct response variants observed

## Direction
Game Server → Client

## Summary
Returns the player's current visual appearance state, including equipped appearance items and their slot values. Two distinct response formats have been observed depending on whether the character is on foot or in a vehicle/MS (mobile suit). The response is variable-length.

## Confidence
Medium (structure mapped from captures; slot semantics are inferred)

## Observed In Captures
- `tiny_move_forward.txt`, `no_movement_pure_idle.txt`, `movement_test.txt`, `very_small_rotation.txt`, `rotation_only.txt`: **on-foot variant** (77 bytes)
- `get_in_TGM-79-Trainer-ms.txt`: **vehicle/MS variant** (52 bytes)
- Sequence: 26 (bootstrap), and also seen mid-session (seq 4141 in get_in_TGM capture)

## Packet Structure

### Common Header (all variants)

| Offset | Size | Type  | Name         | Value (observed)       | Notes                                                   |
|--------|------|-------|--------------|------------------------|---------------------------------------------------------|
| 0x00   | 2    | u16   | variant      | `00 03` or `00 04`    | `0x03` = on-foot; `0x04` = in vehicle/MS                |
| 0x02   | 2    | u16   | constant     | `00 02`               | Standard server response constant                       |
| 0x04   | 4    | u32   | characterId  | e.g. `09 7F 45 A0`   | Character being described                               |
| 0x08   | 4    | u32   | secondaryId  | varies                 | `00 00 01 94` (on-foot) or `00 06 41 BA` (in vehicle)  |

### On-Foot Variant (variant = 0x0003, XORSize = 77)
`secondaryId = 00 00 01 94` (possibly no-vehicle sentinel or character sub-ID)

| Offset | Size | Type  | Name         | Value                  | Notes                                                  |
|--------|------|-------|--------------|------------------------|--------------------------------------------------------|
| 0x0C   | 4    | bytes | unk0         | `00 00 00 00`          | Zero-padded                                            |
| 0x10   | 65   | bytes | appearsSlots | see below              | Appearance slot data                                   |

Full body from `tiny_move_forward.txt`, Packet 67:
```
0040:   00 03 00 02 09 7F 45 A0 00 00 01 94 00 00 00 00   ......E.........
0050:   FF FF 00 FF FF 00 FF FF 00 FF FF 00 FF FF 00 FF   ................
0060:   FF 00 FF 00 00 00 00 00 00 00 00 00 00 00 00 00   ................
0070:   00 00 00 00 00 00 00 00 00 00 00 00 00            .............
```

### Vehicle/MS Variant (variant = 0x0004, XORSize = 52)
`secondaryId = 00 06 41 BA` (vehicle/MS entity ID — matches vehicle IDs seen in 0x00000024/0x00008024)

Full body from `get_in_TGM-79-Trainer-ms.txt`, Packet 32:
```
0040:   00 04 00 02 09 7F 45 A0 00 06 41 BA 87 FF FF FF   ......E...A.....
0050:   FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF   ................
0060:   FF FF FF FF FF FF FF FF FF 87 00 00 00 00 00 00   ................
0070:   00 80 00 00                                       ....
```

The vehicle variant contains a 28-byte block of `0xFF` framed by `0x87` markers:
- `0x87` at offset 0x0C = equipment array start marker
- 28 bytes of `0xFF` = 7 equipment slots, all empty (`0xFFFFFFFF` per slot)
- `0x87` at offset 0x29 = equipment array end marker
- 6 trailing bytes: `00 00 00 00 00 00 00 80 00 00`

## Appearance Slot Encoding (on-foot variant)
The on-foot variant uses 3-byte slot entries `(00 FF 00)` or `(FF FF 00)` for the appearance payload. The pattern `FF FF 00` repeating appears to encode empty/default appearance slots. The full slot layout and which visual equipment categories each slot represents are not yet fully mapped.

## Flow Context
- Responds to 0x0000000A (REQUEST_PLAYER_LOOKS_BUFF) at sequence 26
- After this, the server sends 0x00008005 (RESPONSE_SPACE_CIRCUIT_ITEM) responses
- The `variant` field (`0x03` vs `0x04`) directly reflects whether the character currently occupies a mobile suit

## Open Questions
- Full slot layout in the on-foot variant: which byte ranges correspond to which visual equipment categories
- Whether the `0x87` framing bytes in the vehicle variant encode a count (`0x80 | 7` = 7 slots) or are fixed delimiters
- Meaning of the 6 trailing bytes in the vehicle variant (ending `00 80 00 00`)
- Whether `secondaryId = 00 00 01 94` is a static sentinel for "no vehicle" or a character sub-ID

## Implementation Notes
- Check the character's current vehicle state before sending this response
- Use `variant = 0x0003` for on-foot characters, `variant = 0x0004` for characters in a vehicle/MS
- Populate `secondaryId` with the vehicle entity ID, or `00 00 01 94` if on foot
