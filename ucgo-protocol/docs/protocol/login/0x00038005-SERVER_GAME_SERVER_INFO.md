# SERVER_GAME_SERVER_INFO (0x00038005)

## Status

🟡 PARTIAL (HIGH CONFIDENCE CORE STRUCTURE)

## Direction

Login Server → Client

## Summary

Sent after the client requests game server connection details via `0x00030005`. Provides the IP address and port of the game server the client should connect to. This is the final packet in the login server flow — after receiving this, the client opens a new TCP connection to the game server.

---

## Capture Metadata (Representative)

| Field      | Value               |
| ---------- | ------------------- |
| Opcode     | 0x00038005          |
| Sequence   | varies              |
| SysMessage | 0x00000000          |
| Direction  | LoginServerToClient |

---

## Header

Standard 64-byte UCGO packet header. See `0x00030000` for field layout.

---

## Body Structure

| Offset | Size          | Type     | Description                                    |
| ------ | ------------- | -------- | ---------------------------------------------- |
| 0x40   | 4             | uint32   | Result code: `0x00000001` = success (BE)       |
| 0x44   | 1             | byte     | `0x80 \| ip_string_length`                     |
| 0x45   | `ip_len`      | ASCII    | Game server IP address (ASCII, no null term)   |
| var    | 2             | uint16   | Game server port (BE): `0x5DCA` = `24010`      |
| var    | 4             | uint32   | Unknown — `0x00000000` observed                |

### Example (IP = `24.129.194.237`, port = `24010`):
```
00 00 00 01         result = success
8F                  0x80 | 15 = 15 char IP string
32 34 2E 31 32 39   "24.129"
2E 31 39 34 2E 32   ".194.2"
33 37               "37"
5D CA               port = 24010
00 00 00 00         unknown
```

---

## Port

The game server port `0x5DCA` = decimal `24010` is consistent across all observed captures.

---

## Login Flow Position

```
7. Server → Client   0x00038002   Character data (last one)
8. Client → Server   0x00030005   Game server request
9. Server → Client   0x00038005   ← this packet

   Client opens new TCP connection to game server at provided IP:24010
```

---

## Source Reference

From `Opcode0x30005.java` (Norwegian server):

```java
svar.writeIntBE(0x1);
svar.writeByte((byte) (config.Server.gameserver_ip.length() | 0x80));
svar.writeStringASCII(config.Server.gameserver_ip);
svar.writeShortBE((short) 0x5DCA);  // port 24010
svar.writeIntBE(0x0);
```

---

## Unknowns / Open Questions

- Purpose of the trailing `0x00000000` field
- Whether error variants of this packet exist and what they look like
- Whether the port is configurable or always `24010`
