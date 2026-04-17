# UCGO Game Server Bootstrap Flow Overview

## Status

🟡 PARTIAL (EARLY BOOTSTRAP DOCUMENTED)

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
Login Server → Client   0x00038005   Game server info
Client opens new TCP connection to game server:24010

Client → Game Server    0x00000041   RequestLoginGame
Client → Game Server    0x00000038   RequestRegisterPlayer
Client → Game Server    0x00000013   RequestServerTime
Client → Game Server    0x00000016   RequestItemInfo         (burst, repeated)
Server → Client         0x00008038   Register player response
Server → Client         0x00008016   Item info response      (repeated)
Client → Game Server    0x00000070   RequestOccupationCityInfoList
Client → Game Server    0x00000000   RequestRegistCoordMgr
Client → Game Server    0x00000003   RequestPlayerCoordDataList
Server → Client         0x00008003   Coord data list response
Client → Game Server    0x00000006   RequestSimplePlayerInfo
Client → Game Server    0x0000000A   RequestPlayerLooksBuff
Client → Game Server    0x00000005   RequestSpaceCircuitItem (repeated)
```

This is the earliest documented **world bootstrap** sequence observed so far. No movement input was performed during the capture.

---

## High-Level Interpretation

The initial game server login is not a single request/response pair like the login server flow. Instead, the client performs a **bootstrap burst** of multiple specialized requests to populate the local game state.

Observed categories:

- **Session / identity bind** — `0x00000041`
- **Player registration** — `0x00000038` / `0x00008038`
- **Time sync** — `0x00000013`
- **Item / object data pulls** — repeated `0x00000016` / `0x00008016`
- **Coordinate manager / world registration** — `0x00000000`
- **Nearby player coordinate data** — `0x00000003` / `0x00008003`
- **Simple player info / appearance / container-related data** — `0x00000006`, `0x0000000A`, `0x00000005`
- **Occupation / city state** — `0x00000070`

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

- Client request `0x00000038` → Server response `0x00008038`
- Client request `0x00000016` → Server response `0x00008016`
- Client request `0x00000003` → Server response `0x00008003`

This strongly suggests many game opcodes follow:

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

## Next Steps

Priority documentation targets:

1. `0x00000041` / first game-login packet
2. `0x00000038` / `0x00008038` player registration pair
3. `0x00000016` / `0x00008016` item info request/response family
4. `0x00000003` / `0x00008003` coordinate data list pair
5. Identify first true idle / heartbeat packet after bootstrap completes

---

## Source References

- `initial_game_load_no_movement.txt`
- `GameOpcodeMap.java`
- `registerOpcodes.java`
