# REQUEST_LOGIN_GAME (0x00000041)

## Status

🟢 HIGH CONFIDENCE (ROLE + CORE STRUCTURE CONFIRMED VIA MULTIPLE SERVER IMPLEMENTATIONS)

## Direction

Client → Game Server

## Summary

Primary game-server login request used to transition the client from login-server handoff into an authenticated game-world session.

This is the first major packet sent on the new game-server TCP stream after the login server hands the client off.

---

## Capture Metadata (Representative)

| Field        | Value                                                   |
| ------------ | ------------------------------------------------------- |
| Opcode       | `0x00000041`                                            |
| Direction    | Client → Game Server                                    |
| Occurrence   | First observed client packet on the `24010` game stream |
| XORSize      | `42`                                                    |
| BlowfishSize | `48`                                                    |

---

## Header

Standard 64-byte UCGO packet header.

---

## Confirmed Request Structure

Both Titans and UCGOHost confirm the same leading structure.

### Layout (Big Endian)

| Field           | Type  | Description                                                                 |
| --------------- | ----- | --------------------------------------------------------------------------- |
| loginMode       | u32   | Must be `0x00010000`                                                        |
| characterId     | u32   | Character ID selected for game login                                        |
| trailingUnknown | u32   | Present in UCGOHost; read but not meaningfully used                         |
| remainingData   | bytes | Additional payload present in captures, but ignored by both implementations |

---

## Capture Correlation

In the live capture, this packet clearly contains:

* the selected character ID
* a session/account-style token
* the character name in UTF-16LE

Even though the private server implementations do not parse those later fields, the live packet shows the client is sending more data than the minimal required fields. At minimum, both implementations only rely on the first `0x00010000` constant and the `characterId`.

---

## Titans Behavior

Titans performs the following logic:

1. Read `loginMode`
2. Require `loginMode == 0x00010000`
3. Read `characterId`
4. Load the character into the `GameSession`
5. Set session state to `AUTHENTICATED`
6. Register the session/player in the game world
7. Send `NotifyLoginGame(SUCCESS)` using opcode `0x8041`

This shows that `0x41` is the request that actually activates the player session on the game server.

---

## UCGOHost Behavior

UCGOHost performs a richer version of the same process:

1. Require first field to equal `0x00010000`
2. Read `characterId`
3. Read one additional `u32`
4. Resolve account ID from the character
5. Reject if the account is already connected
6. Load full character data
7. Ensure core containers exist and are linked
8. Restore clothing / active vehicle or transport state
9. Register the player in the active game player list
10. Send success response `0x8041` with a fixed success body 

This strongly confirms that `0x41` is the root packet for game-session initialization.

---

## Interpretation

This opcode is best understood as:

> **Client request to log the selected character into the game server and initialize the full game session**

It likely gates:

* session authentication on game server
* character/world loading
* container linking
* clothing and vehicle restoration
* world registration
* permission/visibility state

---

## Flow Context

```text
Login Server → 0x00038005   SERVER_GAME_SERVER_INFO
Client opens TCP connection to game server
Client → 0x00000041         RequestLoginGame
Server → 0x00008041         NotifyLoginGame
Client → 0x00000038         RequestRegisterPlayer
Server → 0x00008038         NotifyRegisterPlayer
```

---

## Important Notes

* `0x00010000` is a required constant in both implementations
* `characterId` is the key field
* Additional trailing request data exists in live captures but is not required by the known server implementations
* This is the packet that moves the session into authenticated in-game state

---

## Open Questions

* Exact meaning of the trailing `u32`
* Exact purpose of the extra identity/session/name data present in live captures
* Whether retail server used more of the request body than the private server implementations currently do
