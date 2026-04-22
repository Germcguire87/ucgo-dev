# UCGO Game Server Bootstrap Flow Overview

## Status

🟡 PARTIAL (CORE BOOTSTRAP CHAIN DOCUMENTED — LOGIN/REGISTER/ITEM/COORD CONFIRMED)

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

From the `initial_game_load_no_movement.txt` capture:

```text
Login Server → Client   0x00038005   SERVER_GAME_SERVER_INFO
Client opens new TCP connection to game server:24010

Client → Game Server    0x00000041   RequestLoginGame          (seq 1)
Server → Client         0x00008041   NotifyLoginGame           (success: 0x00100002)
Client → Game Server    0x00000038   RequestRegisterPlayer     (seq 2)
Client → Game Server    0x00000013   RequestServerTime         (seq 3)
Client → Game Server    0x00000016   RequestItemInfo           (burst, repeated; seq 4–20+)
Server → Client         0x00008038   NotifyRegisterPlayer      (includes character ID)
Server → Client         0x00008016   ResponseItemInfo          (repeated; one per 0x16 request)
Client → Game Server    0x00000070   RequestOccupationCityInfoList
Client → Game Server    0x00000000   RequestRegistCoordMgr
Client → Game Server    0x00000003   RequestPlayerCoordDataList
Server → Client         0x00008003   NotifyPlayerCoordDataList (visible entity list)
Client → Game Server    0x00000006   RequestSimplePlayerInfo
Client → Game Server    0x0000000A   RequestPlayerLooksBuff
Client → Game Server    0x00000005   RequestSpaceCircuitItem   (repeated)
```

This is the earliest documented **world bootstrap** sequence observed so far. No movement input was performed during the capture. Movement-phase packets (`0x00000002`) are absent here by design.

---

## High-Level Interpretation

The initial game server login is not a single request/response pair like the login server flow. Instead, the client performs a **bootstrap burst** of multiple specialized requests to populate the local game state.

Observed categories:

- **Session / identity bind** — `0x00000041` (activates character on game server; requires `loginMode == 0x00010000`) / `0x00008041` (success = `0x00100002`; error = `0x00000007` or `0xFFFFFFFF`)
- **World entity registration** — `0x00000038` (world-entry handshake; body is `unk0 + characterId`) / `0x00008038` (confirms player active in simulation; includes character ID)
- **Time sync** — `0x00000013`
- **Container / item / inventory data pulls** — repeated `0x00000016` / `0x00008016`; one request per container; payload includes unique ID, parent ID, and static ID chains
- **Coordinate manager / world subscription** — `0x00000000`
- **Position update + visible entity list** — `0x00000003` (carries `accountId`, `characterId`, zone, `x/y/z`) / `0x00008003` (full visible player+NPC list; includes position, faction, vehicle, rank, and appearance fields per entity)
- **Live movement / state stream** — `0x00000002` (high-frequency; carries full position, orientation, vehicle context, combat state; no direct response; active gameplay only)
- **Simple player info / appearance / container-related data** — `0x00000006`, `0x0000000A`, `0x00000005`
- **Occupation / city state** — `0x00000070`

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

---

## Sequence Numbers

Sequence numbers reset on the new game server TCP connection.

Example:

- `0x00000041` is sequence `1`
- `0x00000038` is sequence `2`
- `0x00000013` is sequence `3`

This indicates the game server maintains its own packet sequence independent of the login server session.

---

## Directional Opcode Pattern

Game server responses observed so far follow the same high-bit response pattern used elsewhere in UCGO:

- Client request `0x00000041` → Server response `0x00008041`
- Client request `0x00000038` → Server response `0x00008038`
- Client request `0x00000016` → Server response `0x00008016`
- Client request `0x00000003` → Server response `0x00008003`

This is now confirmed for the core bootstrap chain and strongly suggests many game opcodes follow:

```text
request_opcode | 0x00008000 = response_opcode
```

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

---

## Key Differences vs Login Flow

The login flow is mostly linear and tightly bounded:

```text
login request → auth response → character data → handoff
```

The game bootstrap flow is much broader:

```text
identity bind → register player → pull world/object/player/time data → continue world initialization
```

This makes the game protocol substantially more complex than the login protocol and suggests documentation should proceed **packet family by packet family**, not as a single monolithic flow.

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

### Remaining Priorities

1. `0x00000000` (`RequestRegistCoordMgr`) — body layout unknown
2. `0x00000005` (`RequestSpaceCircuitItem`) — semantics unclear
3. `0x00000013` (`RequestServerTime`) — body and response not yet documented
4. `0x00000006`, `0x0000000A` — player info / appearance request bodies
5. Identify first true idle / heartbeat packet after bootstrap completes

---

## Source References

- `initial_game_load_no_movement.txt`
- `GameOpcodeMap.java`
- `registerOpcodes.java`
