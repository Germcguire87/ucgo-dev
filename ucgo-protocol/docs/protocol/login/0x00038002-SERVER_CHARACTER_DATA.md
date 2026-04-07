# SERVER_CHARACTER_DATA (0x00038002)

## Status

🔴 PARTIAL (STRUCTURE OBSERVED, FIELDS LARGELY UNKNOWN)

## Direction

Login Server → Client

## Summary

Sent after `0x00038001`, one packet per character on the account. Contains full character data used to populate the character selection screen — name, appearance, stats, equipment, and position. This is the largest packet in the login flow. Accounts with two characters receive two of these packets.

---

## Capture Metadata (Representative)

| Field      | Value               |
| ---------- | ------------------- |
| Opcode     | 0x00038002          |
| Sequence   | 3 (first char), 4 (second char) |
| SysMessage | 0x00000000          |
| Direction  | LoginServerToClient |

---

## Header

Standard 64-byte UCGO packet header. See `0x00030000` for field layout.

`BlowfishSize` is large — observed values of 584–608 bytes. This is the largest login-flow packet.

---

## Body Structure

The body is not fully decoded. The following fields have been identified from capture analysis.

### Known Fields

| Offset | Size | Type     | Description                                           |
| ------ | ---- | -------- | ----------------------------------------------------- |
| 0x40   | 1    | byte     | Sub-type indicator: `0x00` observed                   |
| 0x41   | 1    | byte     | Always `0x02`                                         |
| 0x42   | 4    | uint32   | Account ID (BE)                                       |
| 0x46   | 4    | uint32   | Unknown (BE)                                          |
| 0x4A   | 1    | byte     | Character slot index (`0x01` = slot 1, `0x02` = slot 2) |
| var    | var  | struct   | Character data block (see below)                      |

### Character Name (located within body)

Character names are encoded as UTF-16LE within the body. From the `loginwarmuro` and `loginwdante` captures, the character name `enoPwnzJ00F` was decoded at body offset ~0x50:

```
Raw: 65 00 6E 00 6F 00 50 00 77 00 6E 00 7A 00 4A 00 30 00 30 00 46
     e        n        o        P        w        n        z        J        0        0        F
```

The byte immediately before the name appears to be `0x8B` (0x80 | 11) encoding the name length, followed by a Japanese character sequence used as a suffix or tag (`73 95 AC 8A`).

### Stat Block

A repeated structure was observed containing skill/stat IDs and values. The pattern appears to be:

```
[0x80 | count] [stat records...]
```

Each stat record appears to be ~5 bytes: `[flags] [stat_id: 3 bytes] [value: 1 byte]`

Example from capture (decoded as stat entries):
```
80 8B 00  [stat_id_1]  00 00 00 14   (value = 20)
          [stat_id_2]  00 00 00 14
          ...
```

### Account ID Sentinel Pattern

The account ID appears repeatedly throughout the body as a delimiter between data sections. The pattern `[account_id] [section_byte]` was observed multiple times, suggesting the body is structured as a series of tagged sections.

Example (account `0x00033E3C`):
```
00 03 3E 3C  00  [section data]
00 03 3E 3C  01  [section data]
00 03 3E 3C  02  [section data]
00 03 3E 3C  03  [section data]
00 03 3E 3C  83  [section data]
```

The section byte after the account ID appears to be a sequential index (0x00, 0x01, 0x02, 0x03) with `0x83` as a terminal section.

---

## Observed Body Size

| Scenario                    | BlowfishSize |
| --------------------------- | ------------ |
| Account with 1 character    | ~591 bytes   |
| Account with 2 characters   | ~584 bytes each |

---

## Login Flow Position

```
3. Server → Client   0x00038000   Login response
4. Server → Client   0x00038001   Character slot list
5. Server → Client   0x00038002   ← character data (per character)
   [repeated for each character]
6. Client → Server   0x00030005   Game server request (after user selects character)
```

---

## Unknowns / Open Questions

This packet requires significantly more capture analysis to fully document. Key unknowns:

- Complete field layout and offsets
- Encoding of character appearance fields (face, hair, skin)
- Encoding of character position (map/zone + coordinates)
- Encoding of character stats and skill values
- Equipment slot data structure
- Purpose and structure of the tagged section format
- Whether all characters follow the same body layout
