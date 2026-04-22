# NOTIFY_PLAYER_COORD_DATA_LIST (0x00008003)

## Status

🟢 HIGH CONFIDENCE (ROLE + RESPONSE PATTERN CONFIRMED VIA MULTIPLE SERVER IMPLEMENTATIONS)

## Direction

Game Server → Client

## Summary

Server response carrying nearby player and NPC coordinate/state data in response to `0x00000003`.

This is one of the primary world-state packets used to populate and refresh the visible entity list around the player.

---

## Capture Metadata (Representative)

| Field        | Value                                                             |
| ------------ | ----------------------------------------------------------------- |
| Opcode       | `0x00008003`                                                      |
| Direction    | Game Server → Client                                              |
| Occurrence   | Repeated during initial world load and likely throughout gameplay |
| XORSize      | Variable                                                          |
| BlowfishSize | Variable                                                          |

---

## Header

Standard 64-byte UCGO packet header.

---

## Confirmed Response Role

Both implementations identify this opcode as the server-side response to `0x00000003`:

* Titans: `NotifyPlayerCoordDataList` with opcode `0x8003` 
* UCGOHost: builds and sends response packet `0x8003` after processing opcode `0x03` 

---

## Titans Response Behavior

Titans builds a compact response containing:

* leading short `0x0002`
* world data from `GameWorld.getWorld().write(session.getEntity())`
* account ID
* character ID
* zero byte
* zone ID
* trailing zero fields

This suggests a world/entity list payload followed by player identity / zone metadata. 

---

## UCGOHost Response Behavior

UCGOHost shows the response structure more explicitly.

### High-level layout

1. `u16be 0x0002`
2. variable-length count of visible entities
3. repeated visible-entity entries for:

   * nearby players
   * nearby global NPCs
   * nearby local NPCs
4. trailing footer:

   * player count byte
   * account ID
   * character ID
   * zero byte
   * zone byte
   * `u32be 0`
   * `u16be 0`

This makes `0x00008003` the primary **visible world list** packet. 

---

## Confirmed Entity Entry Contents (UCGOHost)

For player entries, UCGOHost writes:

* `x`
* `y`
* `z`
* `tilt`
* `roll`
* `direction`
* `characterId`
* unknown short `0x0000`
* unknown byte `0x00`
* zone byte
* container/vehicle context
* vehicle ID or `-1` for human form
* rank
* GM tag
* occupancy tag
* action
* criminal flag
* faction
* appearance change counter
* team ID
* machine damage
* attack ID 

This is a major protocol anchor point.

---

## Interpretation

This opcode delivers the **world visibility set** around the player.

It likely drives:

* nearby player positions
* nearby NPC positions
* vehicle vs human display state
* faction/action/team markers
* visual appearance refresh
* attack / combat context

---

## Flow Context

```text
Client → 0x00000003   RequestPlayerCoordDataList
Server → 0x00008003   NotifyPlayerCoordDataList
```

---

## Important Notes

* This is not just a pure coordinate packet.
* It appears to include rich state for each visible entity.
* UCGOHost shows that the payload includes both players and NPCs.
* Titans confirms the same opcode role, though with a more abstract world writer.

---

## Open Questions

* Exact byte layout of the Titans `GameWorld.write(...)` payload
* Final normalized structure of NPC entries vs player entries
* Whether the trailing footer is always present and always identical
* Whether the entry list format changes by zone, vehicle state, or space/ground context
