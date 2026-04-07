# CLIENT_CREATE_CHARACTER (0x00030003)

## Status

🟡 PARTIAL (HIGH CONFIDENCE CORE FIELDS, SOME UNKNOWNS)

## Direction

Client → Login Server

## Summary

Sent when the player creates a new character at the character selection screen. Contains full character creation data including appearance, faction, starting location, and base attribute distribution. The server responds with `0x00038003`.

---

## Capture Metadata (Representative)

| Field      | Value               |
| ---------- | ------------------- |
| Opcode     | 0x00030003          |
| Sequence   | varies              |
| SysMessage | 0x00000000          |
| Direction  | clientToLoginServer |

---

## Header

Standard 64-byte UCGO packet header. See `0x00030000` for field layout.

---

## Body Structure

Reconstructed from `Opcode0x30003.java` server-side parsing.

| Offset | Size | Type     | Description                                              |
| ------ | ---- | -------- | -------------------------------------------------------- |
| 0x40   | 4    | uint32   | Account ID (BE) — validated against session              |
| 0x44   | 14   | bytes    | Unknown / skipped by server (`skipAhead(14)`)            |
| 0x52   | 1    | byte     | Gender (0 = female, 1 = male — inferred)                 |
| 0x53   | 1    | byte     | Unknown — ignored by server                              |
| 0x54   | 1    | byte     | Faction (0 = Earth Federation, 1 = Zeon — inferred)      |
| 0x55   | 20   | bytes    | Unknown / skipped by server (`skipAhead(20)`)            |
| 0x69   | 1    | byte     | Face type                                                |
| 0x6A   | 1    | byte     | Unknown — ignored by server                              |
| 0x6B   | 1    | byte     | Hair style                                               |
| 0x6C   | 26   | bytes    | Unknown / skipped by server (`skipAhead(26)`)            |
| 0x86   | 1    | byte     | Skin color                                               |
| 0x87   | 1    | byte     | Unknown — ignored by server                              |
| 0x88   | 1    | byte     | Hair color                                               |
| 0x89   | 9    | bytes    | Unknown / skipped by server (`skipAhead(9)`)             |
| 0x92   | 1    | byte     | `0x80 \| character_name_length`                          |
| 0x93   | var  | UTF-16LE | Character name                                           |
| var    | 1    | byte     | Unknown — ignored by server                              |
| var    | 1    | byte     | Starting location index (see table below)                |
| var    | 4    | uint32   | Unknown (BE)                                             |
| var    | 1    | byte     | Must be `0x83` — validation sentinel                     |
| var    | 4    | uint32   | Strength attribute (BE)                                  |
| var    | 4    | uint32   | Spirit attribute (BE)                                    |
| var    | 4    | uint32   | Luck attribute (BE)                                      |
| var    | 4    | uint32   | Sum of Strength + Spirit + Luck — must equal 170 (BE)    |

---

## Starting Location Index

| Value | Location       | Coordinates (approx)           |
| ----- | -------------- | ------------------------------ |
| 0     | Sydney         | `72536537, -59308704`          |
| 1     | Perth          | `55469796, -58348671`          |
| 2     | Canberra       | `71572874, -60098021`          |
| 3     | Adelaide       | `66390755, -59786294`          |
| 4     | Melbourne      | `69404973, -61194815`          |
| 5     | Darwin         | `62637658, -49079842`          |
| 6     | Brisbane       | `73447582, -56285669`          |
| 7     | Southern Cross | `57289989, -58213606`          |
| other | Wilderness     | `66666666, -54000000`          |

All starting locations are on the continent of Australia (the game's initial release area — "Dawn of Australia").

---

## Attribute Validation

The server enforces:
```
strength + spirit + luck == 170
sum_field == (strength + spirit + luck)
```

If either check fails, character creation is rejected.

---

## Validation Sentinel

The byte immediately before the attribute block must equal `0x83`. If it does not, the packet is rejected:
```java
if ((int) (pd.readByte() & 0xFF) != 0x83) {
    System.out.println("Opcode 0x30003: Invalid packet format.");
    return;
}
```

---

## Login Flow Position

```
(after character selection screen loads)
Client → Server   0x00030003   ← this packet (create character)
Server → Client   0x00038003   Character creation response
```

---

## Source Reference

Full parsing logic from `Opcode0x30003.java`.

---

## Unknowns / Open Questions

- Exact content of the 14-byte skip at 0x44 (likely additional appearance or metadata fields)
- Exact content of the 20-byte skip at 0x55
- Exact content of the 26-byte skip at 0x6C
- Exact content of the 9-byte skip at 0x89
- Gender and faction encoding (values inferred, not confirmed from captures)
- Whether the unknown byte before starting location carries semantic meaning
