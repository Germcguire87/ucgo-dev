# REQUEST_PLAYER_COORD_UPDATE (0x00000002)

## Status

🟢 HIGH CONFIDENCE (ROLE + STRUCTURE CONFIRMED VIA MULTIPLE SERVER IMPLEMENTATIONS AND CAPTURE ANALYSIS)

## Direction

Client → Game Server

## Summary

High-frequency client update packet used to transmit **player position, rotation, and gameplay state** to the game server.

This packet is sent when the player:

* moves
* rotates
* changes action/state (e.g., thrusters, attack state)

It does **not** appear during pure idle.

---

## Capture Metadata (Representative)

| Field        | Value                                 |
| ------------ | ------------------------------------- |
| Opcode       | `0x00000002`                          |
| Direction    | Client → Game Server                  |
| Occurrence   | Repeated during movement and rotation |
| XORSize      | Medium                                |
| BlowfishSize | Medium                                |

---

## Header

Standard 64-byte UCGO packet header.

---

## Confirmed Structure

Both UCGOHost and Titans implementations parse the packet as a structured state update.

### Layout (Big Endian)

| Field             | Type | Description                           |
| ----------------- | ---- | ------------------------------------- |
| posX              | u32  | Player X coordinate                   |
| posY              | u32  | Player Y coordinate                   |
| posZ              | u32  | Player Z coordinate                   |
| tilt              | u16  | Rotation tilt                         |
| roll              | u16  | Rotation roll                         |
| direction         | u16  | Heading / facing direction            |
| characterId       | u32  | Player character ID                   |
| machineId         | u16  | Machine ID (unknown role)             |
| clusterId         | u16  | Cluster ID (unknown role)             |
| vehicleUniqueId   | u32  | Active vehicle instance ID            |
| vehicleTemplateId | u32  | Vehicle type/template                 |
| rank              | u8   | Player rank                           |
| accountLevel      | u8   | Account level / privilege             |
| action            | u8   | Current action (e.g. thruster on/off) |
| state             | u8   | Player state flag                     |
| faction           | u16  | Faction / nationality                 |
| equipChecksum     | u16  | Equipment checksum                    |
| updateCounter     | u16  | Update counter                        |
| teamId            | u32  | Team ID                               |
| damage            | u8   | Damage value                          |
| attackId          | u32  | Attack identifier                     |

---

## Behavior

### Server-side (UCGOHost)

* Updates player position:

  * X, Y, Z
  * tilt, roll, direction
* Updates:

  * action state
  * team ID
  * attack ID
  * vehicle state
* Applies movement validation (e.g. thruster bug correction)
* Updates vehicle movement tracking if in vehicle 

---

### Server-side (Titans)

* Parses full packet into `CoordUpdate`
* Updates:

  * entity position
  * entity rotation
  * appearance/action state
  * team and combat fields
* Applies:

  * vehicle logic
  * damage synchronization
  * dismount logic
* Updates world entity state immediately

---

## Interpretation

This opcode represents:

> **The authoritative client → server movement and state update stream**

It is responsible for transmitting:

* movement (X/Y/Z)
* orientation (tilt/roll/direction)
* gameplay state (action, state, team)
* vehicle context
* combat state (attack ID, damage)

---

## Relationship to Other Opcodes

| Opcode       | Role                                              |
| ------------ | ------------------------------------------------- |
| `0x00000002` | Immediate player state update (movement/rotation) |
| `0x00000003` | Periodic world/visibility sync request            |
| `0x00008003` | Server broadcast of visible entity state          |

Typical flow:

```text
Client → 0x00000002   (movement/rotation update)
Server updates player state
Server → 0x00008003   (broadcast updated world state)
```

---

## Capture Observations

* Appears during:

  * movement
  * rotation (even very small rotations)
* Does not appear during:

  * pure idle periods
* Interleaves with `0x00000003` during active gameplay

---

## Important Notes

* This is the first opcode with a **fully structured gameplay payload**
* Unlike bootstrap packets, this packet drives live world updates
* Server does not treat this as a simple request — it is a state mutation input

---

## Open Questions

* Exact meaning of:

  * machineId / clusterId
  * equipChecksum
  * updateCounter semantics
* Full mapping of `action` and `state` values
* Whether additional fields exist in variants of this packet
