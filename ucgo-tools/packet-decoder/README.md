# UCGO Packet Decoder

Purpose: decode UCGO packets from TCP captures, reassemble streams, decrypt, and output canonical hex dumps and JSON for protocol documentation.

## Features
- Stream reassembly (TCP segments in order; handles gaps and overlaps).
- Sliding-window packet detection (scan every offset).
- UCGO decrypt pipeline (XOR table plus Blowfish key).
- Outputs console summary plus detailed dump and JSON.

## Quick Start
1. Open a terminal in this folder.
2. Run `npm install`.
3. Put .pcap or Wireshark .txt exports in parse-target/.
4. Run `npm run decode:packet`.
5. Results are written to parsed-output/<capture-name>.txt.

## Inputs
- .pcap: classic PCAP files, parsed directly (no external tools required).
- .txt: Wireshark "Export Packet Dissections" with packet bytes.

## Crypto Setup
- Requires XOR table at data/xortable.dat (or data/XORTable.dat).
- Default Blowfish key is `chrTCPPassword`.
- See docs/CRYPTO.md for details.

## Optional CLI Usage
- Single file: `npm run decode:packet -- <capture.txt|capture.pcap>`.
- Override keys: `npm run decode:packet -- <capture> --bfKey <key> --xorKey <key> --xorTable <path>`.
- Exports: `npm run decode:packet -- <capture> --dumpFile out.txt --jsonFile out.json`.

## Output
- Console summary per packet.
- Full dump in classic hex format with ASCII preview.
- JSON with header and payload hex plus metadata.

## Notes and Limitations
- If the server changes the XOR table or Blowfish key, decoding will fail until updated.
- If traffic is TLS-encrypted, plaintext UCGO packets will not be visible to this tool.
