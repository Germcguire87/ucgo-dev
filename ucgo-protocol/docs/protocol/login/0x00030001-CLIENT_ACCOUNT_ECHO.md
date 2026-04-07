# CLIENT_ACCOUNT_ECHO (0x00030001)

## Status

🟢 COMPLETE

## Direction

Client → Login Server

## Summary

Second packet sent by the client during login. Sent immediately after `0x00030000` in the same burst, before any server response is received. Contains the account ID the client expects to receive, which the server validates against the authenticated account.

On first login (no prior session), the account ID field will contain whatever the server assigned on the previous login — or zero if this is a truly fresh client state. The server cross-references this against the authenticated account ID from `0x00030000`.

---

## Capture Metadata (Representative)

| Field      | Value               |
| ---------- | ------------------- |
| Opcode     | 0x00030001          |
| Sequence   | 2                   |
| SysMessage | 0x00000000          |
| Direction  | clientToLoginServer |

---

## Header

Standard 64-byte UCGO packet header. See `0x00030000` for field layout. Sequence is always `2` (follows the login request).

---

## Body Structure (9 bytes)

| Offset | Size | Type   | Description                                                        |
| ------ | ---- | ------ | ------------------------------------------------------------------ |
| 0x40   | 4    | uint32 | Unknown — always `0x00000000` in all observed captures (BE)        |
| 0x44   | 4    | uint32 | Account ID (BE) — client's stored account ID from prior login      |
| 0x48   | 1    | byte   | Terminator — always `0x00`                                         |

---

## Account ID Field

The client sends the account ID it received from the server's previous `0x00038000` response. The server validates that this matches the account ID it just authenticated.

From `Opcode0x30001.java`:
```java
pd.readIntBE(); // Unknown int (always 0x00000000)
if (p.getAccountID() != pd.readIntBE()) {
    // mismatch — reject
    return;
}
```

### Observed Values

| Account       | Account ID (hex) | Body bytes (hex)          |
| ------------- | ---------------- | ------------------------- |
| ucgocore      | `0x01D33C7E`     | `00000000 01D33C7E 00`    |
| anewaccount   | `0x0145D7C2`     | `00000000 0145D7C2 00`    |
| asd (warmuro) | `0x00033E3C`     | `00000000 00033E3C 00`    |
| jimbotodo     | `0x002C7E2FB0`   | `00000000 2C7E2FB0 00`    |

---

## Timing

This packet is sent in a burst with `0x00030000` — the client does not wait for the server to respond before sending it. Both packets are transmitted as a single TCP write in all observed captures.

The server processes `0x00030000` first (authenticates the user, sets `p.accountID`), then processes this packet which validates the echoed account ID against the newly set value.

---

## Login Flow Position

```
1. Client → Server   0x00030000   Login request        ┐ sent in
2. Client → Server   0x00030001   ← this packet        ┘ same burst
3. Server → Client   0x00038000   Login response
```

---

## Unknowns / Open Questions

- Purpose of the first 4-byte field (always `0x00000000`) — possibly a placeholder for a prior security token, a flags field, or a protocol version
- Whether this field is ever non-zero in original server captures
