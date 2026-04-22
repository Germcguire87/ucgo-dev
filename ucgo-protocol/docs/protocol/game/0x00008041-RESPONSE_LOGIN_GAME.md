# NOTIFY_LOGIN_GAME (0x00008041)

## Status

🟢 HIGH CONFIDENCE (ROLE + SUCCESS/ERROR RESPONSE STRUCTURE CONFIRMED VIA MULTIPLE SERVER IMPLEMENTATIONS)

## Direction

Game Server → Client

## Summary

Server response to `0x00000041`, indicating whether the character was successfully accepted into the game server.

This is the primary acknowledgment that the game-session login step succeeded or failed.

---

## Capture Metadata (Representative)

| Field        | Value                                       |
| ------------ | ------------------------------------------- |
| Opcode       | `0x00008041`                                |
| Direction    | Game Server → Client                        |
| Occurrence   | Early bootstrap response after `0x00000041` |
| XORSize      | Small                                       |
| BlowfishSize | Small                                       |

---

## Header

Standard 64-byte UCGO packet header.

---

## Confirmed Response Variants

Both implementations confirm success and error-style responses for opcode `0x8041`.

### Success Response

#### Titans

```text
u16  0x0010
u16  0x0002
byte[24]  0x00
```

Total body length: 28 bytes. 

#### UCGOHost

```text
u32  0x00100002
byte[24]  0x00
```

Total body length: 28 bytes. 

These are functionally the same success body:

* Titans writes it as two BE shorts
* UCGOHost writes it as one BE int

---

### Error / Rejected Response

#### Titans

```text
u32  0x00000007
```

Used for `REJECTED`. 

#### UCGOHost

```text
u32  0x00000007
```

Used when the player is already logged in. 

UCGOHost also sends:

```text
u32  0xFFFFFFFF
```

for general character-loading failure. 

---

## Interpretation

This opcode acts as the game-server login result packet.

### Success means:

* character accepted
* session authenticated at game-server level
* player loaded into world/session state
* bootstrap may continue with registration and world sync packets

### Failure means:

* login rejected
* character/account/session invalid
* duplicate login or character loading problem

---

## Flow Context

```text
Client → 0x00000041   RequestLoginGame
Server → 0x00008041   NotifyLoginGame
↓
If success:
Client → 0x00000038   RequestRegisterPlayer
Server → 0x00008038   NotifyRegisterPlayer
```

---

## Important Notes

* Success body is highly stable and mostly zero-filled
* `0x00100002` is the success marker
* `0x00000007` is a confirmed rejection/error-style code
* `0xFFFFFFFF` is also used by UCGOHost for a broader failure case

---

## Known Result Codes

| Value        | Meaning                                  | Confidence  |
| ------------ | ---------------------------------------- | ----------- |
| `0x00100002` | Success                                  | High        |
| `0x00000007` | Rejected / already logged in             | Medium-High |
| `0xFFFFFFFF` | General failure / character load failure | Medium      |

---

## Open Questions

* Whether retail used more specific failure codes beyond those seen in the private server implementations
* Whether the success body contains hidden semantics beyond a simple success marker
