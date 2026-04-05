export type UcgoServerName = "InfoServer" | "LoginServer" | "CMSServer" | "GameServer";

const SERVER_PORTS: Record<number, UcgoServerName> = {
  24012: "InfoServer",
  24018: "LoginServer",
  24016: "CMSServer",
  24010: "GameServer",
};

export function getServerName(port?: number): UcgoServerName | null {
  if (port === undefined) {
    return null;
  }

  return SERVER_PORTS[port] ?? null;
}

export function getServerNameForConnection(
  srcPort?: number,
  dstPort?: number,
): UcgoServerName | null {
  return getServerName(dstPort) ?? getServerName(srcPort);
}

export function isServerPort(port?: number): boolean {
  return getServerName(port) !== null;
}
