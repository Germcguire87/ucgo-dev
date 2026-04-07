# SERVER_LOGIN_RESPONSE (0x00038000)

## Status

🟢 COMPLETE

## Direction

Login Server → Client

## Summary

First server response in the login flow. Communicates the authentication result and, on success, provides the account ID and UCGM tag used in all subsequent login-flow packets.

---

## Capture Metadata (Representative)

| Field      | Value               |
| ---------- | ------------------- |
| Opcode     | 0x00038000          |
| Sequence   | 1                   |
| SysMessage | 0x00000000          |
| Direction  | LoginServerToClient |

---

## High-Level Structure

```
[HEADER][BODY]
```

---

## Header (64 bytes)

Identical structure to all other UCGO packets. See `0x00030000` for field layout.

---

## Body Structure (16 bytes fixed)

| Offset | Size | Type   | Description                                      |
| ------ | ---- | ------ | ------------------------------------------------ |
| 0x40   | 4    | uint32 | Result code (BE)                                 |
| 0x44   | 4    | uint32 | Security token — hardcoded `0x12345678` in UCGOhost; purpose unknown in original server |
| 0x48   | 4    | uint32 | Account ID (BE) — used as session identifier in all subsequent packets |
| 0x4C   | 4    | uint32 | UCGM tag (BE) — `0x0A` for normal accounts, higher values for GM accounts |

---

## Result Codes

| Value  | Meaning                                                        |
| ------ | -------------------------------------------------------------- |
| `0x01` | Login success                                                  |
| `0x09` | Login failure (bad username/password)                          |
| `0x0B` | Server closed (maintenance) — non-UCGM account                |
| `0x0C` | Wrong client version                                           |
| `0x15` | Already logged in / login too soon (duplicate session attempt) |

---

## Success Variant

### Raw Body Bytes (Example)

```
00 00 00 01   result = 1 (success)
12 34 56 78   security token (hardcoded stub in UCGOhost)
01 D3 3C 7E   account ID
00 00 00 0A   UCGM tag
```

### Observations

- Account ID (`0x48`) is reused verbatim in all subsequent login-flow packets
- UCGM tag `0x0A` is the standard value for normal player accounts
- The security token field (`0x44`) is `0x12345678` in all UCGOhost captures — this is a hardcoded placeholder in the Norwegian server source (`svar.writeIntBE(0x12345678); //Security token`)

---

## Failure Variant

### Raw Body Bytes

```
00 00 00 09   result = 9 (failure)
FF FF FF FF   sentinel (invalid)
FF FF FF FF   sentinel (invalid)
00 00 00 00   zero
```

### Observations

- `0xFFFFFFFF` is used as a sentinel value for fields that have no valid value on failure
- Body is identical across all failed login attempts regardless of username/password
- Flow terminates — server sends no further packets

---

## "Login Too Soon" Variant (result = 0x15)

Sent when the account is still marked as active on the game server (player did not cleanly disconnect).

### Raw Body Bytes

```
00 00 00 15   result = 0x15 (already logged in)
FF FF FF FF   sentinel
FF FF FF FF   sentinel
00 00 00 00   zero
```

---

## Login Flow Position

```
1. Client → Server   0x00030000   Login request
2. Client → Server   0x00030001   Account ID echo
3. Server → Client   0x00038000   ← this packet

   Branch on result code:
   
   result = 0x01 (success):
     4. Server → Client   0x00038001   Character slot list
     5. Server → Client   0x00038002   Character data (one per character)
   
   result = 0x09 / 0x0B / 0x0C / 0x15 (any failure):
     Flow terminates. No further packets.
```

---

## Field Reference

| Field          | Offset | On success              | On failure   |
| -------------- | ------ | ----------------------- | ------------ |
| Result code    | 0x40   | `0x00000001`            | varies       |
| Security token | 0x44   | `0x12345678` (UCGOhost) | `0xFFFFFFFF` |
| Account ID     | 0x48   | server-assigned integer | `0xFFFFFFFF` |
| UCGM tag       | 0x4C   | `0x0000000A` (normal)   | `0x00000000` |

---

## Source Reference

From `Opcode0x30000.java` (Norwegian server):

```java
svar.writeIntBE(0x1);
svar.writeIntBE(0x12345678); // Security token
svar.writeIntBE(accountID);
svar.writeIntBE(p.getUCGM()); // GM tag
```

---

## Unknowns / Open Questions

- Exact purpose of the security token field (`0x44`) in the original Japanese server — UCGOhost hardcodes it, so its intended use is unknown
- Whether the original server used a dynamic security token and how the client validated it
- Whether UCGM tag values above `0x0A` affect client behavior (GM commands, UI, etc.)
