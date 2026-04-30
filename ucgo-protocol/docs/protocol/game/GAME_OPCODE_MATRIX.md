# UCGO Game Server Opcode Matrix

## Status

🟢 BOOTSTRAP SEQUENCE FULLY DOCUMENTED

## Scope

This matrix covers all observed opcodes involved in the game server bootstrap, world load, and active gameplay phases. Combat, chat, inventory manipulation (partial), and logout flows are not yet fully covered.

---

## Opcode Reference

### Bootstrap Phase — Session and Registration

| Opcode       | Direction             | Name                                | Status | Notes |
| ------------ | --------------------- | ----------------------------------- | ------ | ----- |
| `0x00000041` | Client → Game         | RequestLoginGame                    | 🟢 High Confidence | First packet on new game connection; activates character session; requires `loginMode == 0x00010000` and `characterId` |
| `0x00008041` | Game → Client         | NotifyLoginGame                     | 🟢 High Confidence | Response to `0x41`; success body is `0x00100002` + 24 zero bytes; `0x00000007` = rejected |
| `0x00000038` | Client → Game         | RequestRegisterPlayer               | 🟢 High Confidence | Sent after `0x8041` success; registers player entity into world simulation; body is `unk0 + characterId` |
| `0x00008038` | Game → Client         | NotifyRegisterPlayer                | 🟢 High Confidence | Response to `0x38`; includes character ID; marks player as active in game world |

### Bootstrap Phase — Time, Items, and World State

| Opcode       | Direction             | Name                                | Status | Notes |
| ------------ | --------------------- | ----------------------------------- | ------ | ----- |
| `0x00000013` | Client → Game         | RequestServerTime                   | 🟢 Confirmed | 9-byte body: `unk0=0x00000000`, `sentinel=0xFFFFFFFF`, `unk1=0x00`; sent at sequence 3 |
| `0x00008013` | Game → Client         | ResponseServerTime                  | 🟢 Confirmed | 28-byte body; `subType=0x0027`, `constant=0x0002`, current Unix timestamp as big-endian u32 at offset 0x04, 20 zero bytes |
| `0x00000016` | Client → Game         | RequestItemInfo                     | 🟢 High Confidence | Burst during world load; requests container/inventory/item data by unique ID and parent ID |
| `0x00008016` | Game → Client         | ResponseItemInfo                    | 🟢 High Confidence | Per-request response; delivers container/item state; always terminates with `0xFF`; payload varies by container type |
| `0x00000070` | Client → Game         | RequestOccupationCityInfoList       | 🟢 Confirmed | 9-byte body: `unk0=0x00000000`, `characterId`, `unk1=0xFF`; sent twice (sequences 21 and 24) |
| `0x00008070` | Game → Client         | ResponseOccupationCityInfoList      | 🟢 Confirmed | 88-byte body; `0x83` header = 3 entries; each 29-byte entry contains cityId, faction, big-endian timestamp, `0x85` marker, and 5 resource slot pairs |

### Bootstrap Phase — Coordinate Manager and Entity Subscription

| Opcode       | Direction             | Name                                | Status | Notes |
| ------------ | --------------------- | ----------------------------------- | ------ | ----- |
| `0x00000000` | Client → Game         | RequestRegistCoordMgr               | 🟢 Confirmed | 53-byte body; identical field layout to `0x00000002`; `targetCharId = 0x00000000` at bootstrap |
| `0x00008000` | Game → Client         | ResponseRegistCoordMgr              | 🟢 Confirmed | 28-byte ACK: `subType=0x0012`, `constant=0x0002`, 24 zero bytes; mirrors RESPONSE_SERVER_TIME structure |
| `0x00000003` | Client → Game         | RequestPlayerCoordDataList          | 🟢 High Confidence | Position update + visible entity list request; carries `accountId`, `characterId`, zone, and `x/y/z` |
| `0x00008003` | Game → Client         | NotifyPlayerCoordDataList           | 🟢 High Confidence | Delivers nearby player and NPC coordinate/state list; also includes faction, vehicle, rank, action, and appearance fields per entity |

### Bootstrap Phase — Player Info and Appearance

| Opcode       | Direction             | Name                                | Status | Notes |
| ------------ | --------------------- | ----------------------------------- | ------ | ----- |
| `0x00000006` | Client → Game         | RequestSimplePlayerInfo             | 🟢 Confirmed | 9-byte body: `unk0=0x00000001` (unique among 9-byte requests), `characterId`, `unk1=0x01`; sequence 25 |
| `0x00008006` | Game → Client         | ResponseSimplePlayerInfo            | 🟢 Confirmed | Variable-length; `unk0=0xFFFFFFFF`, `characterId`, `unk1=0x0001`, then `nameLen = 0x80 \| charCount` followed by UTF-16LE name (no null terminator) |
| `0x0000000A` | Client → Game         | RequestPlayerLooksBuff              | 🟢 Confirmed | 9-byte body: `unk0=0x00000000`, `characterId`, `unk1=0x05`; always `5` across all captures including mid-session; sequence 26 |
| `0x0000800A` | Game → Client         | ResponsePlayerLooksBuff             | 🟢 Confirmed | Variable-length; `variant=0x0003` (on-foot, 77 bytes) or `variant=0x0004` (in vehicle/MS, 52 bytes); vehicle variant uses `0x87` framing markers around 7×4-byte equipment slots |
| `0x00000005` | Client → Game         | RequestSpaceCircuitItem             | 🟢 Confirmed | 20-byte body; sent 3× with `batchIndex` 0/1/2; `coordValue` is IEEE 754 float (400.0, ~3968.0, ~8000.0); sequences 27–29 |
| `0x00008005` | Game → Client         | ResponseSpaceCircuitItem            | 🟢 Confirmed | Two variants: **data** (66 bytes, `resultCode=0x01`, entity record with `0x85` marker) for batchIndex=0; **terminator** (4 bytes, `00 02 02 80`) for batchIndex=1; no response for batchIndex=2 |

### Active Gameplay

| Opcode       | Direction             | Name                                | Status | Notes |
| ------------ | --------------------- | ----------------------------------- | ------ | ----- |
| `0x00000002` | Client → Game         | RequestPlayerCoordUpdate            | 🟢 High Confidence | High-frequency movement/rotation/state update; carries full position, orientation, vehicle, combat, and action state; no direct response |
| `0x00000024` | Client → Game         | RequestSpacePickupItemBuff          | 🟢 High Confidence | Item/container/vehicle interaction; `moveType` selects action (pickup, money, vehicle entry, wreckage); variable-length |
| `0x00008024` | Game → Client         | NotifySpacePickupItemBuff           | 🟢 High Confidence | Authoritative result of pickup action; echoes `endByte` from request; triggers downstream `0x00008035` + `0x00008003` + `0x00008016` |

---

## Confirmed Request / Response Pairs

| Request      | Response     | Confidence | Notes |
| ------------ | ------------ | ---------- | ----- |
| `0x00000041` | `0x00008041` | High       | Confirmed; success code `0x00100002` |
| `0x00000038` | `0x00008038` | High       | Confirmed; carries character ID |
| `0x00000013` | `0x00008013` | Confirmed  | Timestamp in response at offset 0x04 (big-endian u32) |
| `0x00000016` | `0x00008016` | High       | Burst family; one response per request; terminates with `0xFF` |
| `0x00000070` | `0x00008070` | Confirmed  | Sent twice; response contains 3 city entries |
| `0x00000000` | `0x00008000` | Confirmed  | ACK response; 28 bytes fixed |
| `0x00000003` | `0x00008003` | High       | Response carries full visible entity list |
| `0x00000006` | `0x00008006` | Confirmed  | Response contains UTF-16LE character name |
| `0x0000000A` | `0x0000800A` | Confirmed  | Response variant depends on vehicle state |
| `0x00000005` | `0x00008005` | Confirmed  | 3 requests; 2 responses (data + terminator) |
| `0x00000024` | `0x00008024` | High       | Pickup/vehicle entry; `endByte` echoed |

---

## Naming Basis

Packet names are based on private server source registries and capture analysis:

- `GameOpcodeMap.java` (Titans server)
- `registerOpcodes.java` (Norwegian server)
- Hex packet analysis from `tiny_move_forward.txt`, `no_movement_pure_idle.txt`, `get_in_TGM-79-Trainer-ms.txt`, and others

---

## Open Questions

- First true idle/heartbeat opcode after world load completes
- Full mapping of `action` and `state` enum values in `0x00000002`
- Meaning of `machineId`, `clusterId`, and `equipChecksum` in `0x00000002`
- Whether any bootstrap packets vary by zone, inventory, equipment, or nearby entities
- Whether `0x00000041` trailing fields (session token, character name in UTF-16LE) are validated by retail server
- Player vs. NPC entry format differences in `0x00008003` response
- Appearance slot layout in `0x0000800A` on-foot variant (which visual categories map to which byte ranges)
- Whether `secondaryId = 0x00000194` in `0x0000800A` is a static no-vehicle sentinel or a character sub-ID
- Identity of opcode `0x00008035` referenced in `0x00008024` flow (world broadcast)
