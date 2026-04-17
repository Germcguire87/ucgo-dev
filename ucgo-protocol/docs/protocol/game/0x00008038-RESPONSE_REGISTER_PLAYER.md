# REGISTER_PLAYER_RESPONSE (0x00008038)

## Status

🟡 PARTIAL (CONFIRMED REQUEST/RESPONSE PAIR)

## Direction

Game Server → Client

## Summary

Early server response sent shortly after the client issues `0x00000038` (`RequestRegisterPlayer`). Confirms or finalizes player registration on the game server connection.

This is one of the first clearly observed server→client packets in the game bootstrap flow.

---

## Capture Metadata (Representative)

| Field      | Value              |
| ---------- | ------------------ |
| Opcode     | `0x00008038`       |
| Sequence   | `2`                |
| SysMessage | `0x00000000`       |
| Direction  | GameServerToClient |
| XORSize    | `28`               |
| BlowfishSize | `32`             |

---

## Header

Standard 64-byte UCGO packet header.

---

## Observed Body Bytes

```text
00 0A 00 02
00 00 00 00
00 00 00 00
09 7F 45 A0
00 00 00 00
00 00 00 00
00 00 00 00
```

---

## Tentative Body Structure

| Offset | Size | Type | Description |
| ------ | ---- | ---- | ----------- |
| `0x40` | 4    | uint32 | Unknown status / flags field (`0x000A0002` observed) |
| `0x44` | 8    | bytes  | Unknown / zero in representative capture |
| `0x4C` | 4    | uint32 | Character ID (BE) — matches selected player (`0x097F45A0`) |
| `0x50` | 12   | bytes  | Reserved / zero-filled block in representative capture |

---

## Interpretation

This packet is the server-side counterpart to `0x00000038` (`RequestRegisterPlayer`). The inclusion of the selected character ID strongly suggests that the server is acknowledging or completing registration of the controlled player entity into the game session.

The opcode pairing follows the same request/response convention seen elsewhere in UCGO:

```text
0x00000038  request
0x00008038  response
```

---

## Flow Position

```text
Client → Game Server   0x00000041   RequestLoginGame
Client → Game Server   0x00000038   RequestRegisterPlayer
Server → Client        0x00008038   ← this packet
Client / Server        bootstrap exchange continues
```

---

## Cross-Reference

From `GameOpcodeMap.java` (Titans server):

```java
map.put(new Integer(0x38), new RequestRegisterPlayer(0x38));
```

The exact Titans response class name is not yet identified, but the observed wire behavior supports this pairing.

---

## Unknowns / Open Questions

- Meaning of the leading `0x000A0002` field
- Whether this packet has success / failure variants
- Whether additional registration state is delivered in subsequent packets rather than inside this response body
