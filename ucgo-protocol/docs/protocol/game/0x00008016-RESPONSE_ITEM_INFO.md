# RESPONSE_ITEM_INFO (0x00008016)

## Status

🟢 HIGH CONFIDENCE (ROLE + STRUCTURE CONFIRMED VIA MULTIPLE SERVER IMPLEMENTATIONS)

## Direction

Game Server → Client

## Summary

Returns **container/item state data** in response to `0x00000016` requests.

This packet is sent in bursts during initial world load and is responsible for delivering:

* inventory contents
* equipped items
* nested container data
* item/container relationship updates

---

## Capture Metadata (Representative)

| Field        | Value                                 |
| ------------ | ------------------------------------- |
| Opcode       | `0x00008016`                          |
| Direction    | Game → Client                         |
| Occurrence   | Burst (matches `0x00000016` requests) |
| XORSize      | Variable                              |
| BlowfishSize | Variable                              |

---

## Header

Standard 64-byte UCGO packet header.

---

## Confirmed Structure (Common Pattern)

Both Titans and UCGOHost implementations confirm a shared structure:

### Prefix

| Offset | Size | Type   | Description                        |
| ------ | ---- | ------ | ---------------------------------- |
| `0x40` | 4    | uint32 | Constant `0x00020002`              |
| `0x44` | 4    | uint32 | Player character ID                |
| `0x48` | 4    | uint32 | Primary container / item unique ID |
| `0x4C` | 4    | uint32 | Container format / type            |

---

## Body Structure

After the prefix, the packet contains a **mode-dependent payload**:

1. Container header data (variable)
2. `0x0B` marker (start of item section)
3. Variable-length item/container data
4. Size field(s) for payload segments
5. Tail data (container relationships)
6. `0xFF` terminator

---

## UCGOHost Concrete Layout

The simpler UCGOHost implementation shows the wire format clearly:

```text
u32  0x00020002
u32  character_id
u32  container_id
u32  container_tail
u32  parent_container_id
u32  parent_container_tail
u32  static_item_id
u32  parent_static_item_id
u32  0x0000000B
var  size counter
var  container data
u8   0xFF
```

---

## Titans Implementation Behavior

Titans confirms the same structure but models it through container abstractions:

* container format/type
* dynamic header generation (`createHeader()`)
* dynamic tail generation (`createTail()`)
* optional extra size fields in special cases (e.g. vehicles)

---

## Response Variants

The response structure varies based on the request context:

### InitializeContainerInfo

Returns full container contents.

### InitializeChildContainerInfo

Returns nested/child container relationships.

### ModifyContainerInfo

Returns updates to container contents or structure.

---

## Interpretation

This packet is the **primary data transport for container and item state** in UCGO.

It is used to deliver:

* player inventory
* equipped items
* nested containers
* object relationships
* vehicle/container interactions

---

## Flow Context

```text
Client → 0x00000016   RequestItemInfo (burst)
Server → 0x00008016   ResponseItemInfo (burst)
```

---

## Key Observations

* Each request produces a corresponding response
* Payload size varies significantly per packet
* Always terminates with `0xFF`
* Appears heavily during initial world load

---

## Open Questions

* Exact structure of container data payload
* Meaning of container format/type field
* Full encoding of header/tail byte arrays
* Differences between response variants at the byte level

---

## Notes

* Confirmed by both Titans and UCGOHost implementations
* Structure is consistent across implementations, but payload contents vary by container type
* This opcode is a core part of the game world initialization process
