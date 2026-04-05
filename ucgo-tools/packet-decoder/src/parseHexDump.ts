const HEX_LINE_REGEX = /^[0-9A-Fa-f]{4}\s+(.+)$/;

export function parseHexDumpLines(lines: string[]): Buffer {
  const bytes: number[] = [];

  for (const line of lines) {
    const match = line.match(HEX_LINE_REGEX);
    if (!match) continue;

    const rest = match[1] ?? "";

    // In Wireshark text export the ASCII gutter is on the right.
    // Grab only the first 16 hex byte tokens to avoid the ASCII column.
    const hexTokens = rest.match(/[0-9A-Fa-f]{2}/g) ?? [];
    const hexBytes = hexTokens.slice(0, 16);

    for (const token of hexBytes) {
      bytes.push(parseInt(token, 16));
    }
  }

  return Buffer.from(bytes);
}
