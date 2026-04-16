export function formatHex(buf: Buffer | Uint8Array): string {
  return Array.from(buf)
    .map(b => b.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");
}

export function hexDump(buf: Buffer | Uint8Array, label?: string): string {
  const bytes = Buffer.from(buf);
  const lines: string[] = [];
  if (label !== undefined) lines.push(label);

  for (let offset = 0; offset < bytes.length; offset += 16) {
    const row = bytes.subarray(offset, offset + 16);
    const hex = Array.from(row)
      .map(b => b.toString(16).padStart(2, "0").toUpperCase())
      .join(" ")
      .padEnd(47);
    const ascii = Array.from(row)
      .map(b => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : "."))
      .join("");
    lines.push(`${offset.toString(16).padStart(4, "0")}  ${hex}  ${ascii}`);
  }

  return lines.join("\n");
}
