# CLIENT_REQUEST_CHARACTER_DATA (0x00030002)

## Status

🟢 COMPLETE

## Direction

Client → Login Server

## Summary

Sent by the client to request full character data for a known character ID. The server responds with `0x00038002` (SERVER_CHARACTER_DATA) for each request.

The client sends one `0x00030002` per character slot it knows about from a prior session, speculatively, in the same burst as `0x00030000` and `0x00030001` — before the server has responded with the character list. The client is pre-announcing which character IDs it expects, based on stored session data.

The server validates the character ID against the authenticated account and responds with the full character data packet.

---

## Capture Metadata

| Field      | Value               |
| ---------- | ------------------- |
| Opcode     | 0x00030002          |
| Sequence   | 3 (first), 4 (second) |
| SysMessage | 0x00000000          |
| Direction  | clientToLoginServer |

---

## Header

Standard 64-byte UCGO packet header. Sequence increments from prior packets in the burst.

---

## Body Structure (9 bytes)

| Offset | Size | Type   | Description |
| ------ | ---- | ------ | ----------- |
| 0x40   | 4    | uint32 | Unknown — always `0x00000000`. Skipped by server. |
| 0x44   | 4    | uint32 | Character ID (BE) — the character whose data is being requested |
| 0x48   | 1    | byte   | Always `0x01` |

---

## Server Handling

From `RequestPlayerInfo.java` (Titans server):

```java
buffer.skip(4);              // discard the unknown 4-byte field
int id = buffer.getIntBE();  // read character ID
send(new NotifyPlayerInfo(id)); // respond with 0x00038002
```

From `Opcode0x30002.java` (Norwegian server): loads the character by ID, validates it belongs to the authenticated account, builds and sends `0x00038002`.

---

## Observed Body Values

| Account      | Char ID      | Body bytes (hex)              |
| ------------ | ------------ | ----------------------------- |
| anewaccount  | `0x090E8EA0` | `00000000 090E8EA0 01`        |
| anewaccount  | `0x09EAC5E0` | `00000000 09EAC5E0 01`        |
| asd (warmuro)| `0x0000BE2E` | `00000000 0000BE2E 01`        |
| asd (warmuro)| `0x000097D6` | `00000000 000097D6 01`        |

---

## Login Flow Position

```
1. Client → Server   0x00030000   Login request        ┐
2. Client → Server   0x00030001   Account ID echo      │ burst
3. Client → Server   0x00030002   ← this packet (×1 per known character) ┘
4. Server → Client   0x00038000   Login response
5. Server → Client   0x00038001   Character slot list
6. Server → Client   0x00038002   Character data (one per 0x00030002 request)
```

All client packets in steps 1–3 are sent in a single TCP burst before waiting for any server response. The server processes them in sequence order.

---

## Notes

On first-ever login (brand new account, no prior session), the client has no stored character IDs and sends no `0x00030002` packets. The server still sends `0x00038001` (empty slot list) and no `0x00038002` packets.

On subsequent logins, the client sends one `0x00030002` per character it remembers from the previous session. If the character list has changed (character deleted, new character added), the speculative requests may not match the actual character list — the server handles this gracefully.