# REQUEST_ITEM_INFO (0x00000016)

## Status

🟡 PARTIAL (HIGH CONFIDENCE ROLE, BODY STILL EMERGING)

## Direction

Client → Game Server

## Summary

Repeated bootstrap packet sent by the client during initial world load to request item/object information for specific entity IDs.

This is **not** a heartbeat packet. It appears in a burst with varying target IDs and is followed by matching `0x00008016` responses from the server.

---

## Capture Metadata (Representative)

| Field      | Value              |
| ---------- | ------------------ |
| Opcode     | `0x00000016`       |
| Sequence   | `4`–`20` observed  |
| SysMessage | `0x00000000`       |
| Direction  | clientToGameServer |
| XORSize    | `37`               |
| BlowfishSize | `40`             |

---

## Header

Standard 64-byte UCGO packet header.

---

## Representative Body Layout

Example packet body:

```text
00 02 00 00
09 7F 45 A0
09 7F 45 A1
00 00 00 14
00 00 00 00
00 00 00 00
00 01 AD B1
00 00 00 00
00 00 00 0B
FF
```

Other observed target IDs include:

- `09 7F 45 AA`
- `09 7F 45 A2`
- `09 7F 45 A4`
- `09 7F 45 AB`
- additional non-player-like object IDs later in the burst

---

## Tentative Structure

| Offset | Size | Type | Description |
| ------ | ---- | ---- | ----------- |
| `0x40` | 4    | uint32 | Unknown header / mode field — observed `0x00020000` |
| `0x44` | 4    | uint32 | Requesting player character ID (BE) |
| `0x48` | 4    | uint32 | Target object / item / entity ID (BE) |
| `0x4C` | 4    | uint32 | Type / category / size-like field (`0x13` / `0x14` observed) |
| `0x50` | 12   | bytes  | Unknown flags / reserved / zero-heavy block |
| `0x5C` | 4    | uint32 | Unknown ID / state field |
| `0x60` | 4    | uint32 | Unknown / often zero |
| `0x64` | 1    | byte   | Observed terminator / flag `0xFF` |

---

## Interpretation

The repeated request pattern during world load strongly suggests the client is asking for detailed information about:

- nearby world objects
- items
- equipment
- container-linked entities
- possibly player-attached or world-attached item records

This interpretation is reinforced by the Titans source name `RequestItemInfo` and the observed matching `0x00008016` server responses.

---

## Flow Position

```text
Client → Game Server   0x00000041   RequestLoginGame
Client → Game Server   0x00000038   RequestRegisterPlayer
Client → Game Server   0x00000013   RequestServerTime
Client → Game Server   0x00000016   ← repeated burst begins
Server → Client        0x00008016   matching responses observed
```

---

## Source Reference

From `GameOpcodeMap.java` (Titans server):

```java
map.put(new Integer(0x16), new RequestItemInfo(0x16));
```

---

## Unknowns / Open Questions

- Exact meaning of the `0x00020000` leading field
- Whether the target ID always refers to an item, or more generally to any world entity with attached item/state data
- Meaning of the `0x13` / `0x14` subtype-like field
- Exact structure of the matching `0x00008016` response bodies
