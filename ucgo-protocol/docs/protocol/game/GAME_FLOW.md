# UCGO Game Server Bootstrap Flow Overview

## Status

🟢 BOOTSTRAP SEQUENCE FULLY DOCUMENTED

## Servers Involved

| Server      | Port  | Description                                      |
| ----------- | ----- | ------------------------------------------------ |
| Login server| 24018 | Authentication and character handoff             |
| Game server | 24010 | Gameplay bootstrap, world load, and ongoing play |

---

## Entry Point

The game server flow begins immediately after the login server sends `0x00038005` (`SERVER_GAME_SERVER_INFO`).

The client then opens a **new TCP connection** to the provided game server IP and port (`24010`).

---

## Observed Initial Bootstrap Sequence

From the `tiny_move_forward.txt` and `no_movement_pure_idle.txt` captures, with confirmed sequence numbers:

```text
Login Server → Client   0x00038005   SERVER_GAME_SERVER_INFO

Client opens new TCP connection to game server:24010

Seq 1:  Client → Game Server    0x00000041   RequestLoginGame
        Game Server → Client    0x00008041   NotifyLoginGame           (success: 0x00100002)

Seq 2:  Client → Game Server    0x00000038   RequestRegisterPlayer
        Game Server → Client    0x00008038   NotifyRegisterPlayer      (includes characterId)

Seq 3:  Client → Game Server    0x00000013   RequestServerTime
        Game Server → Client    0x00008013   ResponseServerTime        (Unix timestamp at body offset 0x04)

Seq 4–20+:
        Client → Game Server    0x00000016   RequestItemInfo           (burst; one per container)
        Game Server → Client    0x00008016   ResponseItemInfo          (per request; terminates with 0xFF)

Seq 21: Client → Game Server    0x00000070   RequestOccupationCityInfoList
        Game Server → Client    0x00008070   ResponseOccupationCityInfoList  (3 city entries, 88 bytes)

Seq 22: Client → Game Server    0x00000000   RequestRegistCoordMgr
        Game Server → Client    0x00008000   ResponseRegistCoordMgr    (28-byte ACK)

Seq 23: Client → Game Server    0x00000003   RequestPlayerCoordDataList
        Game Server → Client    0x00008003   NotifyPlayerCoordDataList (visible entity list)

Seq 24: Client → Game Server    0x00000070   RequestOccupationCityInfoList   (second send)
        (response not observed separately — may be batched with prior 0x8070)

Seq 25: Client → Game Server    0x00000006   RequestSimplePlayerInfo
        Game Server → Client    0x00008006   ResponseSimplePlayerInfo  (character name in UTF-16LE)

Seq 26: Client → Game Server    0x0000000A   RequestPlayerLooksBuff
        Game Server → Client    0x0000800A   ResponsePlayerLooksBuff   (on-foot: 77 bytes; in-MS: 52 bytes)

Seq 27: Client → Game Server    0x00000005   RequestSpaceCircuitItem   (batchIndex=0)
        Game Server → Client    0x00008005   ResponseSpaceCircuitItem  (data variant, 66 bytes)

Seq 28: Client → Game Server    0x00000005   RequestSpaceCircuitItem   (batchIndex=1)
        Game Server → Client    0x00008005   ResponseSpaceCircuitItem  (terminator: 00 02 02 80)

Seq 29: Client → Game Server    0x00000005   RequestSpaceCircuitItem   (batchIndex=2)
        (no confirmed response)

→ Bootstrap complete; normal gameplay begins
→ Server begins periodic 0x00008003 NotifyPlayerCoordDataList updates
```

---

## High-Level Interpretation

The initial game server login is not a single request/response pair like the login server flow. Instead, the client performs a **bootstrap burst** of multiple specialized requests to populate the local game state.

Observed categories:

- **Session / identity bind** — `0x00000041` (activates character on game server; requires `loginMode == 0x00010000`) / `0x00008041` (success = `0x00100002`; error = `0x00000007` or `0xFFFFFFFF`)
- **World entity registration** — `0x00000038` (world-entry handshake) / `0x00008038` (confirms player active in simulation; includes character ID)
- **Time sync** — `0x00000013` / `0x00008013` (response contains current Unix timestamp as big-endian u32 at body offset 0x04; `subType = 0x0027`)
- **Container / item / inventory data pulls** — repeated `0x00000016` / `0x00008016`; one request per container; payload includes unique ID, parent ID, and static ID chains
- **Occupation / city state** — `0x00000070` (sent twice) / `0x00008070` (3 city entries; high-bit count `0x83`; each entry has cityId, faction, timestamp, resource slots)
- **Coordinate manager / world subscription** — `0x00000000` (same format as `0x00000002` but `targetCharId = 0`) / `0x00008000` (ACK; `subType = 0x0012`)
- **Position update + visible entity list** — `0x00000003` (carries `accountId`, `characterId`, zone, `x/y/z`) / `0x00008003` (full visible player+NPC list; includes position, faction, vehicle, rank, and appearance fields per entity)
- **Simple player info** — `0x00000006` (`unk0 = 0x00000001`; unique marker) / `0x00008006` (character name as `0x80|len` + UTF-16LE, no null terminator)
- **Appearance / looks** — `0x0000000A` (`unk1 = 0x05` constant) / `0x0000800A` (`variant = 0x0003` on-foot or `0x0004` in vehicle; vehicle uses `0x87` framing markers)
- **Circuit item batch** — `0x00000005` ×3 with `batchIndex = 0, 1, 2` and increasing `coordValue` floats / `0x00008005` data variant (batchIndex 0) + terminator (batchIndex 1)
- **Live movement / state stream** — `0x00000002` (high-frequency; carries full position, orientation, vehicle context, combat state; no direct response; active gameplay only)

---

## Active Gameplay Flow (Post-Bootstrap)

Once the bootstrap sequence completes, movement-triggered packets begin:

```text
Client → 0x00000002   RequestPlayerCoordUpdate   (per movement / rotation)
Server processes position + state mutation
Server → 0x00008003   NotifyPlayerCoordDataList  (broadcasts updated world state to nearby clients)

Client → 0x00000003   RequestPlayerCoordDataList (periodic world/visibility sync)
Server → 0x00008003   NotifyPlayerCoordDataList  (refreshes visible entity list)
```

Key distinctions:

| Opcode       | Phase       | Frequency    | Response | Role |
| ------------ | ----------- | ------------ | -------- | ---- |
| `0x00000002` | Gameplay    | High (per input) | None (fire-and-forget) | Client → server state mutation |
| `0x00000003` | Both        | Periodic     | `0x00008003` | Client requests entity list refresh |
| `0x00008003` | Both        | Per `0x03`   | —        | Server broadcasts visible world state |

`0x00000002` does **not** have a direct response. The server updates its internal state and may subsequently send `0x00008003` to nearby clients as a downstream effect.

### Item / Vehicle Interaction

```text
Client → 0x00000024   RequestSpacePickupItemBuff  (moveType selects action)
Server → 0x00008024   NotifySpacePickupItemBuff   (authoritative result; echoes endByte)
Server → 0x00008035   Broadcast world update
Server → 0x00008003   Entity sync
Server → 0x00008016   Container sync (if needed)
```

`moveType` values: `0x00010000` = pickup, `0x00020000` = money, `0x00030000` = enter vehicle, `0x00040000` = loot wreckage.

---

## Sequence Numbers

Sequence numbers reset on the new game server TCP connection.

| Seq | Opcode | Name |
| --- | ------ | ---- |
| 1   | `0x00000041` | RequestLoginGame |
| 2   | `0x00000038` | RequestRegisterPlayer |
| 3   | `0x00000013` | RequestServerTime |
| 4–20+| `0x00000016` | RequestItemInfo (burst) |
| 21  | `0x00000070` | RequestOccupationCityInfoList (first) |
| 22  | `0x00000000` | RequestRegistCoordMgr |
| 23  | `0x00000003` | RequestPlayerCoordDataList |
| 24  | `0x00000070` | RequestOccupationCityInfoList (second) |
| 25  | `0x00000006` | RequestSimplePlayerInfo |
| 26  | `0x0000000A` | RequestPlayerLooksBuff |
| 27  | `0x00000005` | RequestSpaceCircuitItem (batchIndex=0) |
| 28  | `0x00000005` | RequestSpaceCircuitItem (batchIndex=1) |
| 29  | `0x00000005` | RequestSpaceCircuitItem (batchIndex=2) |

---

## Directional Opcode Pattern

Game server responses follow the high-bit response pattern used throughout UCGO:

```text
request_opcode | 0x00008000 = response_opcode
```

All bootstrap opcodes confirmed:

| Request | Response | Pair |
| ------- | -------- | ---- |
| `0x00000041` | `0x00008041` | RequestLoginGame / NotifyLoginGame |
| `0x00000038` | `0x00008038` | RequestRegisterPlayer / NotifyRegisterPlayer |
| `0x00000013` | `0x00008013` | RequestServerTime / ResponseServerTime |
| `0x00000016` | `0x00008016` | RequestItemInfo / ResponseItemInfo |
| `0x00000070` | `0x00008070` | RequestOccupationCityInfoList / ResponseOccupationCityInfoList |
| `0x00000000` | `0x00008000` | RequestRegistCoordMgr / ResponseRegistCoordMgr |
| `0x00000003` | `0x00008003` | RequestPlayerCoordDataList / NotifyPlayerCoordDataList |
| `0x00000006` | `0x00008006` | RequestSimplePlayerInfo / ResponseSimplePlayerInfo |
| `0x0000000A` | `0x0000800A` | RequestPlayerLooksBuff / ResponsePlayerLooksBuff |
| `0x00000005` | `0x00008005` | RequestSpaceCircuitItem / ResponseSpaceCircuitItem |
| `0x00000024` | `0x00008024` | RequestSpacePickupItemBuff / NotifySpacePickupItemBuff |

---

## Relationship to Private Server Sources

Observed client opcodes cross-reference cleanly against the Titans server `GameOpcodeMap.java` and the Norwegian `registerOpcodes.java` registry:

| Opcode | Titans name |
| ------ | ----------- |
| `0x41` | `RequestLoginGame` |
| `0x38` | `RequestRegisterPlayer` |
| `0x13` | `RequestServerTime` |
| `0x16` | `RequestItemInfo` |
| `0x70` | `RequestOccupationCityInfoList` |
| `0x00` | `RequestRegistCoordMgr` |
| `0x03` | `RequestPlayerCoordDataList` |
| `0x06` | `RequestSimplePlayerInfo` |
| `0x0A` | `RequestPlayerLooksBuff` |
| `0x05` | `RequestSpaceCircuitItem` |
| `0x24` | `RequestSpacePickupItemBuff` |

---

## Key Differences vs Login Flow

The login flow is mostly linear and tightly bounded:

```text
login request → auth response → character data → handoff
```

The game bootstrap flow is much broader:

```text
identity bind → register player → time sync → item/inventory pull
  → city/faction state → coord manager → entity list
  → player info → appearance → circuit items → gameplay
```

This makes the game protocol substantially more complex than the login protocol.

---

## Documentation Status

### Completed

| Opcode(s) | Name | Confidence |
| --------- | ---- | ---------- |
| `0x00000041` / `0x00008041` | RequestLoginGame / NotifyLoginGame | 🟢 High |
| `0x00000038` / `0x00008038` | RequestRegisterPlayer / NotifyRegisterPlayer | 🟢 High |
| `0x00000016` / `0x00008016` | RequestItemInfo / ResponseItemInfo | 🟢 High |
| `0x00000003` / `0x00008003` | RequestPlayerCoordDataList / NotifyPlayerCoordDataList | 🟢 High |
| `0x00000002` | RequestPlayerCoordUpdate | 🟢 High |
| `0x00000013` / `0x00008013` | RequestServerTime / ResponseServerTime | 🟢 Confirmed |
| `0x00000070` / `0x00008070` | RequestOccupationCityInfoList / ResponseOccupationCityInfoList | 🟢 Confirmed |
| `0x00000000` / `0x00008000` | RequestRegistCoordMgr / ResponseRegistCoordMgr | 🟢 Confirmed |
| `0x00000006` / `0x00008006` | RequestSimplePlayerInfo / ResponseSimplePlayerInfo | 🟢 Confirmed |
| `0x0000000A` / `0x0000800A` | RequestPlayerLooksBuff / ResponsePlayerLooksBuff | 🟢 Confirmed |
| `0x00000005` / `0x00008005` | RequestSpaceCircuitItem / ResponseSpaceCircuitItem | 🟢 Confirmed |
| `0x00000024` / `0x00008024` | RequestSpacePickupItemBuff / NotifySpacePickupItemBuff | 🟢 High |

### Remaining Priorities

1. Enumerate `action` and `state` enum values in `0x00000002` (REQUEST_PLAYER_COORD_UPDATE)
2. Document unknown fields in `0x00000024` (REQUEST_SPACE_PICKUP_ITEM_BUFF) — many `unkN` fields unresolved
3. Clarify player vs. NPC entry format differences in `0x00008003` (NOTIFY_PLAYER_COORD_DATA_LIST)
4. Identify opcode `0x00008035` (world broadcast referenced by `0x00008024` flow)
5. Document logout, combat, chat, and zone-transition opcodes
6. Determine first idle/heartbeat opcode (if any) after bootstrap completes

---

## Source References

- `tiny_move_forward.txt`
- `no_movement_pure_idle.txt`
- `get_in_TGM-79-Trainer-ms.txt`
- `initial_game_load_no_movement.txt`
- `GameOpcodeMap.java`
- `registerOpcodes.java`
