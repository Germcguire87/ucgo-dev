# CLIENT_LOGIN_REQUEST (0x00030000)

## Status

🟢 PARTIAL (HIGH CONFIDENCE CORE STRUCTURE)

## Direction

Client → Login Server

## Summary

First packet sent by the client during login. Contains a UTF-16LE username and a deterministic encrypted payload (likely credentials).

---

## Capture Metadata (Representative)

| Field      | Value               |
| ---------- | ------------------- |
| Opcode     | 0x00030000          |
| Sequence   | 1                   |
| SysMessage | 0x00000000          |
| Direction  | clientToLoginServer |

---

## High-Level Structure

```
[HEADER][PADDING][TAIL][BODY]
```

---

## Header

| Offset    | Size | Description                                        |
| --------- | ---- | -------------------------------------------------- |
| 0x00      | 4    | "head" marker                                      |
| 0x04      | 4    | Dynamic session/seed field (varies per connection) |
| 0x08      | 4    | SysMessage                                         |
| 0x0C      | 4    | Sequence                                           |
| 0x10      | 4    | XORSize                                            |
| 0x14      | 4    | BlowfishSize                                       |
| 0x18      | 4    | Opcode (0x00030000)                                |
| 0x1C–0x3B | ~32  | Padding (all zeros observed)                       |
| 0x3C      | 4    | "tail" marker                                      |

---

## Body Structure (Post-Tail)

| Offset | Size | Type     | Description                                         |
| ------ | ---- | -------- | --------------------------------------------------- |
| 0x40   | 1    | byte     | Username length field (0x80 | length)               |
| 0x41   | var  | UTF-16LE | Username (null-terminated)                          |
| var    | var  | bytes    | Encrypted payload (deterministic, Blowfish-aligned) |

---

## Username Encoding

* Encoding: UTF-16LE
* Null-terminated (`00 00`)
* Starts at offset **0x41**

### Examples

| Raw Bytes               | Decoded     |
| ----------------------- | ----------- |
| `6A 00 69 00 6D 00 ...` | jimbotodo   |
| `76 00 61 00 72 00 ...` | vargas06123 |
| `61 00 73 00 64 00`     | asd         |

---

## Username Length Field

| Offset | Description            |
| ------ | ---------------------- |
| 0x40   | 0x80 | username_length |

### Verified Examples

| Username    | Length | Byte @ 0x40 |
| ----------- | ------ | ----------- |
| asd         | 3      | 0x83        |
| jimbotodo   | 9      | 0x89        |
| vargas06123 | 11     | 0x8B        |

### Interpretation

* High bit (0x80) likely acts as a flag
* Lower bits encode username length

---

## Encrypted Payload

* Begins immediately after username null terminator
* Size varies with username length
* Appears Blowfish-encrypted
* Block-aligned (8-byte multiples)

### Observations

* Deterministic: identical inputs produce identical output
* No per-session randomness observed
* Independent of header seed field

---

## Size Behavior

* Packet size scales with username length
* XORSize increases with payload size
* BlowfishSize is padded to 8-byte boundaries

---

## Verified Observations

* Username always begins at offset **0x41**
* Username is UTF-16LE and null-terminated
* Byte at **0x40 = 0x80 | username_length**
* Encrypted payload begins immediately after username
* Header contains dynamic session field (0x04–0x07)
* Encrypted payload is deterministic across sessions

---

## Unknowns / Open Questions

* Structure of encrypted payload (password? token? composite data?)
* Exact XOR layer behavior (pre/post Blowfish)
* Meaning of header seed field (session ID? crypto seed?)
* Exact formula for XORSize

---

## Notes

This packet is now structurally understood and can be reliably parsed for:

* Username extraction
* Payload boundary detection

Further work should focus on decrypting or modeling the encrypted payload.
