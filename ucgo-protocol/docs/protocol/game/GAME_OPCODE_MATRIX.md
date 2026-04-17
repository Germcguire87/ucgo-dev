# UCGO Game Server Opcode Matrix (Initial Bootstrap)

## Status

🟡 PARTIAL (INITIAL WORLD LOAD ONLY)

## Scope

This matrix covers only the **observed opcodes involved in initial game server login and world bootstrap**. It does not yet cover movement, combat, chat, inventory manipulation, or logout flows.

---

## Opcode Reference

| Opcode       | Direction             | Name                                | Status | Notes |
| ------------ | --------------------- | ----------------------------------- | ------ | ----- |
| `0x00000041` | Client → Game         | RequestLoginGame                    | 🟡 Partial | First packet on new game connection; contains account/session/character identity |
| `0x00000038` | Client → Game         | RequestRegisterPlayer               | 🟡 Partial | Sent immediately after `0x41` |
| `0x00008038` | Game → Client         | RegisterPlayer response             | 🟡 Partial | Response to `0x38`; includes character ID |
| `0x00000013` | Client → Game         | RequestServerTime                   | 🟡 Partial | Small bootstrap packet |
| `0x00000016` | Client → Game         | RequestItemInfo                     | 🟡 Partial | Burst of repeated requests during world load |
| `0x00008016` | Game → Client         | ItemInfo response                   | 🟡 Partial | Repeated responses matching requested object/item IDs |
| `0x00000070` | Client → Game         | RequestOccupationCityInfoList       | 🟡 Partial | Not a heartbeat; likely world/faction/city state |
| `0x00000000` | Client → Game         | RequestRegistCoordMgr               | 🟡 Partial | Coordinate manager registration / world subscription |
| `0x00000003` | Client → Game         | RequestPlayerCoordDataList          | 🟡 Partial | Structured request for coordinate data |
| `0x00008003` | Game → Client         | PlayerCoordDataList response        | 🟡 Partial | Server response to `0x03` |
| `0x00000006` | Client → Game         | RequestSimplePlayerInfo             | 🟡 Partial | Basic player data request |
| `0x0000000A` | Client → Game         | RequestPlayerLooksBuff              | 🟡 Partial | Appearance / visual data request |
| `0x00000005` | Client → Game         | RequestSpaceCircuitItem             | 🟡 Partial | Repeated structured request during bootstrap |

---

## Confirmed Request / Response Pairs

| Request      | Response     | Confidence | Notes |
| ------------ | ------------ | ---------- | ----- |
| `0x00000038` | `0x00008038` | High       | Observed directly in parsed game stream |
| `0x00000016` | `0x00008016` | High       | Repeated request/response family observed |
| `0x00000003` | `0x00008003` | Medium     | Observed after coordinate-related request |

---

## Naming Basis

Packet names are currently based on private server source registries:

- `GameOpcodeMap.java` (Titans server)
- `registerOpcodes.java` (Norwegian server)

Names should be treated as **working protocol labels** until packet bodies are fully documented.

---

## Open Questions

- First true idle/heartbeat opcode after world load completes
- Exact response opcode for `0x00000041` (`RequestLoginGame`)
- Exact semantics of `0x00000005` during bootstrap
- Which opcodes are mandatory to remain connected vs optional bootstrap enrichments
- Whether any bootstrap packets vary by zone, inventory, equipment, or nearby entities
