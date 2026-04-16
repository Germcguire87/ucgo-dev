# ucgo-info-server

A pre-login status server for the UCGO protocol. Before a client attempts to log in, it pings this server to check whether the service is online. The info server responds with a single status byte and closes.

**Default port:** `24012`

---

## Overview

The info server is deliberately minimal. It handles exactly one opcode and has no knowledge of accounts, characters, or sessions.

```
Client                    Info Server (port 24012)
  |                              |
  |-- CLIENT_INFO_REQUEST -----> |
  |<-- SERVER_INFO_RESPONSE ---- |
  |         (status: online)     |
```

---

## Prerequisites

- Node.js 18+
- `xortable.dat` (131,072 bytes) — the XOR key table required for transport crypto

The server defaults to looking for `xortable.dat` at `ucgo-tools/packet-decoder/data/xortable.dat` relative to the project root. Override with the `UCGO_XORTABLE` environment variable.

---

## Running

```bash
npm install
npm start
```

To point at a different XOR table:

```bash
UCGO_XORTABLE=/path/to/xortable.dat npm start
```

---

## Configuration

Configuration is set in `src/bootstrap/createServer.ts`. The relevant options are:

| Option | Default | Description |
|--------|---------|-------------|
| `host` | `0.0.0.0` | Interface to bind |
| `port` | `24012` | TCP port to listen on |
| `transportKey` | `QQzXzQnpzTpnXz` | Blowfish key for transport crypto (UCGOhost clients) |

---

## Opcode Support Matrix

| Opcode | Name | Direction | Status |
|--------|------|-----------|--------|
| `0x00000000` | `CLIENT_INFO_REQUEST` | Client → Server | Handled |
| `0x00008000` | `SERVER_INFO_RESPONSE` | Server → Client | Sent |

The server always responds with status `0x00` (online). There is no offline or maintenance mode at this layer — if the server is not running, the client simply gets no response.

---

## Project Structure

```
src/
  bootstrap/
    createServer.ts       # Wires config, XOR table, dispatcher, and TCP server
    createDispatcher.ts   # Registers opcode handlers
  handlers/
    handle00000InfoRequest.ts   # CLIENT_INFO_REQUEST handler
  net/
    InfoTcpServer.ts      # TCP listener
    InfoConnection.ts     # Per-connection lifecycle
    PacketStreamAssembler.ts    # Reassembles framed packets from TCP stream
  types/
    InfoHandlerContext.ts # Handler context interface (send helper)
  config/
    config.ts             # InfoServerConfig interface
  index.ts                # Entry point
```

---

## Dependencies

| Package | Role |
|---------|------|
| `ucgo-core` | Protocol codecs, crypto, dispatcher |
| `tsx` | TypeScript execution (dev) |
| `typescript` | Type checking |
