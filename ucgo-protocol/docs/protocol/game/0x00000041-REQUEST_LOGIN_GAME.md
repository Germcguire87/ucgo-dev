# REQUEST_LOGIN_GAME (0x00000041)

## Status

🟡 PARTIAL (HIGH CONFIDENCE CORE STRUCTURE)

## Direction

Client → Game Server

## Summary

First packet sent by the client after opening the new TCP connection to the game server. It appears to bind the selected account/session/character identity to the gameplay connection.

This is the game-server equivalent of “enter world with this selected character.”

---

## Capture Metadata (Representative)

| Field      | Value              |
| ---------- | ------------------ |
| Opcode     | `0x00000041`       |
| Sequence   | `1`                |
| SysMessage | `0x00000000`       |
| Direction  | clientToGameServer |
| XORSize    | `42`               |
| BlowfishSize | `48`             |

---

## Header

Standard 64-byte UCGO packet header. Sequence resets to `1` on the new game server connection.

---

## Observed Body Bytes

```text
00 01 00 00
09 7F 45 A0
12 34 56 78
00 00 00 00
8B 41 00 6E 00 6F 00 74 00 68 00 65 00 72 00 20 00 47 00 75 00 79 00
00 01 80
```

---

## Tentative Body Structure

| Offset | Size | Type | Description |
| ------ | ---- | ---- | ----------- |
| `0x40` | 4    | uint32 | Unknown / mode / result-like field — observed `0x00010000` |
| `0x44` | 4    | uint32 | Character ID (BE) |
| `0x48` | 4    | uint32 | Security token / session token (`0x12345678` in UCGOhost captures) |
| `0x4C` | 4    | uint32 | Unknown / reserved — observed `0x00000000` |
| `0x50` | var  | UTF-16LE string | Character name (`Another Guy`) with prefixed high-bit length byte |
| `var`  | 3    | bytes | Trailing flags / terminator (`00 01 80` observed) |

---

## Evidence

This packet includes all of the identity-bearing fields expected for game-session binding:

- Selected character ID
- Login-issued security token
- Character name in UTF-16LE

The Titans private server maps opcode `0x41` to `RequestLoginGame`, which matches the observed role of this packet.

---

## Flow Position

```text
1. Login Server → Client   0x00038005   Game server info
2. Client opens TCP connection to game server:24010
3. Client → Game Server    0x00000041   ← this packet
4. Client → Game Server    0x00000038   Register player
5. Client → Game Server    bootstrap burst continues
```

---

## Source Reference

From `GameOpcodeMap.java` (Titans server):

```java
map.put(new Integer(0x41), new RequestLoginGame(0x41));
```

---

## Unknowns / Open Questions

- Exact meaning of the first 4-byte field (`0x00010000` observed)
- Exact encoding of the character-name length / marker byte (`0x8B` observed)
- Whether the trailing `00 01 80` bytes are flags, terminators, or state selectors
- Which server opcode is the direct logical response to this request
