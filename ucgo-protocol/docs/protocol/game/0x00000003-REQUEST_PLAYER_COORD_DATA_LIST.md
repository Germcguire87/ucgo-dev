# REQUEST_PLAYER_COORD_DATA_LIST (0x00000003)

## Status

🟢 HIGH CONFIDENCE (ROLE + CORE BODY STRUCTURE CONFIRMED VIA MULTIPLE SERVER IMPLEMENTATIONS)

## Direction

Client → Game Server

## Summary

Client request used to update the server with the player's current position/state and request a fresh list of nearby player/NPC coordinate data.

This appears to be a core **world sync / visibility / heartbeat-style** packet during gameplay and initial world load.

---

## Capture Metadata (Representative)

| Field        | Value                                                             |
| ------------ | ----------------------------------------------------------------- |
| Opcode       | `0x00000003`                                                      |
| Direction    | Client → Game Server                                              |
| Occurrence   | Repeated during initial world load and likely throughout gameplay |
| XORSize      | Variable                                                          |
| BlowfishSize | Variable                                                          |

---

## Header

Standard 64-byte UCGO packet header.

---

## Confirmed Request Structure

Both Titans and UCGOHost parse the request body as big-endian fields.

### Layout

| Field            | Type        | Description                                                                                 |
| ---------------- | ----------- | ------------------------------------------------------------------------------------------- |
| accountId        | u32         | Account ID                                                                                  |
| characterId      | u32         | Character ID                                                                                |
| factionOrUnknown | u16 / bytes | Titans reads a BE short as faction; UCGOHost reads bytes here as part of zone/unknown block |
| reserved         | 6 bytes     | Unknown / reserved                                                                          |
| x                | u32         | Player X coordinate                                                                         |
| y                | u32         | Player Y coordinate                                                                         |
| z                | u32         | Player Z coordinate                                                                         |
| trailingUnknown  | u32         | Unknown trailing field                                                                      |

---

## Titans Interpretation

Titans parses:

* `account_id`
* `character_id`
* `faction` as `short`
* skip remaining bytes of the 8-byte block
* `Position`
* trailing `u32`

Then it:

* updates the player's position
* updates session beat / heartbeat state

This strongly suggests the request serves as both:

* a movement/position update
* a trigger to refresh nearby entity coordinate data 

---

## UCGOHost Interpretation

UCGOHost parses:

* `account_id`
* `character_id`
* 1 byte unknown
* 1 byte zone
* 6 bytes skipped
* `x`
* `y`
* `z`
* trailing `u32`

Then it:

* validates account ID + character ID
* records timing for anti-speed-cheat handling
* gathers nearby players and NPCs
* responds with `0x00008003` containing the visible world list 

---

## Interpretation

This opcode is best understood as a **player coordinate update + visible entity list request**.

It is likely used for:

* initial world bootstrap after entering game
* ongoing world sync while stationary or moving
* visibility refresh for nearby players/NPCs
* heartbeat / anti-speed-cheat timing

---

## Flow Context

```text
Client → 0x00000041   RequestLoginGame
Client → 0x00000038   RequestRegisterPlayer
Client → 0x00000013   RequestServerTime
Client → 0x00000016   RequestItemInfo
Client → 0x00000003   RequestPlayerCoordDataList
Server → 0x00008003   NotifyPlayerCoordDataList
```

---

## Important Notes

* This request body is definitely meaningful and is not ignored.
* It carries player identity and world position.
* Both implementations use it as a trigger for world/visibility updates.
* UCGOHost additionally uses repeated receipt timing for anti-speed-cheat detection. 

---

## Open Questions

* Exact meaning of the 8-byte block after `characterId`
* Whether the short Titans calls `faction` is truly faction or part of a broader state block
* Meaning of the trailing `u32`
* Whether this packet cadence differs between standing still, movement, and vehicle travel
