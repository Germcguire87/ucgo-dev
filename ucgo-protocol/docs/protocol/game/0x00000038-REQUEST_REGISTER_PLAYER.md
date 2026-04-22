# REQUEST_REGISTER_PLAYER (0x00000038)

## Status

🟢 HIGH CONFIDENCE (ROLE + CORE STRUCTURE CONFIRMED VIA MULTIPLE SERVER IMPLEMENTATIONS)

## Direction

Client → Game Server

## Summary

Client request used to **register the player entity with the game world** after successful game login (`0x00000041`).

This packet signals that the client is ready to enter the world simulation and begin receiving world-state updates.

---

## Capture Metadata (Representative)

| Field        | Value                          |
| ------------ | ------------------------------ |
| Opcode       | `0x00000038`                   |
| Direction    | Client → Game Server           |
| Occurrence   | Once during initial world load |
| XORSize      | Small                          |
| BlowfishSize | Small                          |

---

## Header

Standard 64-byte UCGO packet header.

---

## Confirmed Request Structure

### Layout (Big Endian)

| Field       | Type | Description                                       |
| ----------- | ---- | ------------------------------------------------- |
| unk0        | u32  | Unknown / mode field (ignored by implementations) |
| characterId | u32  | Player character ID                               |

---

## Behavior

### UCGOHost

* Reads and ignores first `u32`
* Reads `characterId`
* Validates it against session character
* Responds with `0x00008038` if valid 

### Titans

* Reads first `u32`
* Reads `playerID`
* Immediately responds with `NotifyRegisterPlayer(playerID)` 

---

## Interpretation

This opcode is a **registration handshake step** between:

* client identity (login complete)
* world simulation (entity must now be inserted)

It likely:

* confirms player identity at game-server level
* binds session to world entity
* enables subsequent world-state packets (`0x03`, `0x16`, etc.)

---

## Flow Context

```text
Client → 0x00000041   RequestLoginGame
Client → 0x00000038   RequestRegisterPlayer
Server → 0x00008038   NotifyRegisterPlayer
```

---

## Important Notes

* Request body is minimal and mostly acts as a trigger
* Character ID validation is the only meaningful logic
* No complex payload parsing is required

---

## Open Questions

* Meaning of the leading `unk0` field
* Whether this opcode ever carries additional data in other contexts
