# 0x00000000 — REQUEST_REGIST_COORD_MGR

## Status
🟢 Confirmed — Packet structure annotated from hex data; matches REQUEST_PLAYER_COORD_UPDATE (0x00000002) field layout exactly

## Direction
Client → Game Server

## Summary
Registers the client with the server's coordinate manager. Carries the player's initial position and state using the same field layout as the ongoing REQUEST_PLAYER_COORD_UPDATE (0x00000002) packets. Sent once during bootstrap as the player's first authoritative coordinate submission to the server.

## Confidence
Medium-High (structure is clear from captures; name from private server registry cross-reference)

## Observed In Captures
- `tiny_move_forward.txt`, `no_movement_pure_idle.txt`, `movement_test.txt`, `very_small_rotation.txt`, `rotation_only.txt`, `initial_game_load_no_movement.txt`
- Sequence: 22 (always, in the middle of the occupation city info requests)
- Occurs: once per session

## Packet Structure
The body is **identical in layout to 0x00000002 (REQUEST_PLAYER_COORD_UPDATE)**. Refer to that document for full field descriptions. Key differences at login are noted below.

| Offset | Size | Type  | Name              | Observed Value         | Notes                                                        |
|--------|------|-------|-------------------|------------------------|--------------------------------------------------------------|
| 0x00   | 8    | bytes | posEncoded        | e.g. `04 52 D1 5F FC 77 04 33` | Encoded position/entity tag; same format as coord update |
| 0x08   | 4    | u32   | unk0              | `00 00 01 37`          | Constant seen in multiple related packets                    |
| 0x0C   | 2    | bytes | unk1              | `00 00`                | Always zero                                                  |
| 0x0E   | 2    | bytes | actionState       | e.g. `6B 92`           | Action and state flags; see 0x00000002 docs                  |
| 0x10   | 4    | u32   | characterId       | e.g. `09 7F 45 A0`     | Local player's character ID                                  |
| 0x14   | 2    | bytes | vehicleId         | `FF FF`                | `0xFFFF` = no vehicle (on foot)                              |
| 0x16   | 2    | bytes | unk2              | `00 01`                | Some flag or mode indicator                                  |
| 0x18   | 4    | u32   | targetCharId      | `00 00 00 00`          | **Zero at registration** (no target selected yet); 0x00000002 has a real ID here during gameplay |
| 0x1C   | 2    | bytes | unk3              | `FF FF`                | —                                                            |
| 0x1E   | 4    | bytes | unk4              | `FF FF 00 0A`          | Differs from 0x00000002; unclear                             |
| 0x22   | 4    | u32   | unk5              | `00 00 00 01`          | Counter or flag                                              |
| 0x26   | 4    | u32   | unk6              | `00 00 00 01`          | Counter or flag                                              |
| 0x2A   | 4    | u32   | attackId          | `FF FF FF FF`          | `0xFFFFFFFF` = no attack in progress                         |
| 0x2E   | 4    | bytes | damageAndPad      | `FF 00 00 00`          | Damage byte + 3 zero pad bytes                               |
| 0x32   | 1    | u8    | trailing          | `00`                   | Trailing zero                                                |

**Total body size: 53 bytes** (XORSize = 53, BlowfishSize = 56)

## Capture Example
From `tiny_move_forward.txt`, Packet 22, Sequence 22:
```
0040:   04 52 D1 5F FC 77 04 33 00 00 01 37 00 00 00 00   .R._.w.3...7....
0050:   6B 92 09 7F 45 A0 FF FF 00 01 00 00 00 00 FF FF   k...E...........
0060:   FF FF 00 0A 00 00 00 01 00 00 00 01 FF FF FF FF   ................
0070:   FF 00 00 00 00                                    .....
```

## Key Difference from REQUEST_PLAYER_COORD_UPDATE
The only structural difference between this packet and 0x00000002 is at offset 0x18 (`targetCharId`):
- **0x00000000**: `00 00 00 00` — no target (initial registration)
- **0x00000002**: real character ID — mid-game target or nearby entity

This strongly suggests the coord manager registration packet is simply the first coord update, submitted with cleared targeting state.

## Flow Context
Appears at bootstrap sequence 22, sandwiched between two REQUEST_OCCUPATION_CITY_INFO_LIST requests:
1. Seq 21: REQUEST_OCCUPATION_CITY_INFO_LIST
2. **Seq 22: REQUEST_REGIST_COORD_MGR (this opcode)**
3. Seq 23: REQUEST_PLAYER_COORD_DATA_LIST
4. Seq 24: REQUEST_OCCUPATION_CITY_INFO_LIST (second request)

Server responds with 0x00008000 (RESPONSE_REGIST_COORD_MGR).

## Implementation Notes
- Build this packet using the same serialization as REQUEST_PLAYER_COORD_UPDATE, with `targetCharId = 0` and `vehicleId = 0xFFFF`
- Only sent once per session; the ongoing coord updates use 0x00000002 instead
