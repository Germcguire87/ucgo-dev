# UCGO Game Server Opcode Matrix (Initial Bootstrap)

## Status

🟡 PARTIAL (INITIAL WORLD LOAD ONLY)

## Scope

This matrix covers only the **observed opcodes involved in initial game server login and world bootstrap**. It does not yet cover movement, combat, chat, inventory manipulation, or logout flows.

---

## Opcode Reference

| Opcode       | Direction             | Name                                | Status | Notes |
| ------------ | --------------------- | ----------------------------------- | ------ | ----- |
| `0x00000041` | Client → Game         | RequestLoginGame                    | 🟢 High Confidence | First packet on new game connection; activates character session; requires `loginMode == 0x00010000` and `characterId` |
| `0x00008041` | Game → Client         | NotifyLoginGame                     | 🟢 High Confidence | Response to `0x41`; success body is `0x00100002` + 24 zero bytes; `0x00000007` = rejected |
| `0x00000038` | Client → Game         | RequestRegisterPlayer               | 🟢 High Confidence | Sent after `0x8041` success; registers player entity into world simulation; body is `unk0 + characterId` |
| `0x00008038` | Game → Client         | NotifyRegisterPlayer                | 🟢 High Confidence | Response to `0x38`; includes character ID; marks player as active in game world |
| `0x00000013` | Client → Game         | RequestServerTime                   | 🟡 Partial | Small bootstrap packet; sequence 3 in observed capture |
| `0x00000016` | Client → Game         | RequestItemInfo                     | 🟢 High Confidence | Burst during world load; requests container/inventory/item data by unique ID and parent ID |
| `0x00008016` | Game → Client         | ResponseItemInfo                    | 🟢 High Confidence | Per-request response; delivers container/item state; always terminates with `0xFF`; payload varies by container type |
| `0x00000070` | Client → Game         | RequestOccupationCityInfoList       | 🟡 Partial | Not a heartbeat; likely world/faction/city state |
| `0x00000000` | Client → Game         | RequestRegistCoordMgr               | 🟡 Partial | Coordinate manager registration / world subscription |
| `0x00000002` | Client → Game         | RequestPlayerCoordUpdate            | 🟢 High Confidence | High-frequency movement/rotation/state update; carries full position, orientation, vehicle, combat, and action state; no direct response |
| `0x00000003` | Client → Game         | RequestPlayerCoordDataList          | 🟢 High Confidence | Position update + visible entity list request; carries `accountId`, `characterId`, zone, and `x/y/z` |
| `0x00008003` | Game → Client         | NotifyPlayerCoordDataList           | 🟢 High Confidence | Delivers nearby player and NPC coordinate/state list; also includes faction, vehicle, rank, action, and appearance fields per entity |
| `0x00000006` | Client → Game         | RequestSimplePlayerInfo             | 🟡 Partial | Basic player data request |
| `0x0000000A` | Client → Game         | RequestPlayerLooksBuff              | 🟡 Partial | Appearance / visual data request |
| `0x00000005` | Client → Game         | RequestSpaceCircuitItem             | 🟡 Partial | Repeated structured request during bootstrap |

---

## Confirmed Request / Response Pairs

| Request      | Response     | Confidence | Notes |
| ------------ | ------------ | ---------- | ----- |
| `0x00000041` | `0x00008041` | High       | Confirmed by both Titans and UCGOHost; success code `0x00100002` |
| `0x00000038` | `0x00008038` | High       | Observed in capture; confirmed by both implementations; carries character ID |
| `0x00000016` | `0x00008016` | High       | Burst request/response family; one response per request; confirmed by both implementations |
| `0x00000003` | `0x00008003` | High       | Confirmed by both implementations; response carries full visible entity list |

---

## Naming Basis

Packet names are currently based on private server source registries:

- `GameOpcodeMap.java` (Titans server)
- `registerOpcodes.java` (Norwegian server)

Names should be treated as **working protocol labels** until packet bodies are fully documented.

---

## Open Questions

- First true idle/heartbeat opcode after world load completes
- Exact semantics of `0x00000005` (`RequestSpaceCircuitItem`) during bootstrap
- Full body layout of `0x00000000` (`RequestRegistCoordMgr`)
- Which opcodes are mandatory to remain connected vs optional bootstrap enrichments
- Whether any bootstrap packets vary by zone, inventory, equipment, or nearby entities
- Whether `0x00000041` trailing fields (session token, character name in UTF-16LE) are validated by retail server
- Full mapping of `action` and `state` values in `0x00000002`
- Meaning of `machineId`, `clusterId`, and `equipChecksum` in `0x00000002`
