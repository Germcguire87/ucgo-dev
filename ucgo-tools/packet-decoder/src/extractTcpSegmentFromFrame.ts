import { isServerPort } from "./serverPorts";
import type { CapturedFrame, TcpSegment } from "./types";

export function extractTcpSegmentFromFrame(frame: CapturedFrame): TcpSegment | null {
  const bytes = frame.frameBytes;

  if (bytes.length < 20) {
    return null;
  }

  let ipOffset: number | null = null;

  // Ethernet II
  if (bytes.length >= 14 + 20 && bytes.readUInt16BE(12) === 0x0800) {
    ipOffset = 14;
  }

  // 802.1Q VLAN tagged Ethernet
  if (
    ipOffset === null &&
    bytes.length >= 18 + 20 &&
    bytes.readUInt16BE(12) === 0x8100 &&
    bytes.readUInt16BE(16) === 0x0800
  ) {
    ipOffset = 18;
  }

  // Linux cooked capture (SLL)
  if (
    ipOffset === null &&
    bytes.length >= 16 + 20 &&
    bytes.readUInt16BE(14) === 0x0800
  ) {
    ipOffset = 16;
  }

  // Raw IPv4 without link-layer header
  if (ipOffset === null) {
    const versionIhl = bytes[0];
    if (versionIhl !== undefined && (versionIhl >> 4) === 4) {
      ipOffset = 0;
    }
  }

  if (ipOffset === null) {
    return null;
  }
  const versionIhl = bytes[ipOffset];
  if (versionIhl === undefined) {
    return null;
  }

  const ipVersion = versionIhl >> 4;
  const ipHeaderLength = (versionIhl & 0x0f) * 4;
  if (ipVersion !== 4 || ipHeaderLength < 20) {
    return null;
  }

  const totalLength = bytes.readUInt16BE(ipOffset + 2);
  const protocol = bytes[ipOffset + 9];
  if (protocol !== 6) {
    return null;
  }

  const tcpOffset = ipOffset + ipHeaderLength;
  if (bytes.length < tcpOffset + 20) {
    return null;
  }

  const srcPortFromBytes = bytes.readUInt16BE(tcpOffset);
  const dstPortFromBytes = bytes.readUInt16BE(tcpOffset + 2);
  const seqFromBytes = bytes.readUInt32BE(tcpOffset + 4);
  const ackFromBytes = bytes.readUInt32BE(tcpOffset + 8);

  const tcpDataOffsetByte = bytes[tcpOffset + 12];
  if (tcpDataOffsetByte === undefined) {
    return null;
  }

  const tcpHeaderLength = ((tcpDataOffsetByte >> 4) & 0x0f) * 4;
  if (tcpHeaderLength < 20) {
    return null;
  }

  const payloadOffset = tcpOffset + tcpHeaderLength;
  const ipEnd = ipOffset + totalLength;

  if (payloadOffset > ipEnd || ipEnd > bytes.length) {
    return null;
  }

  const payload = bytes.subarray(payloadOffset, ipEnd);

  const srcIpFromBytes = `${bytes[ipOffset + 12]}.${bytes[ipOffset + 13]}.${bytes[ipOffset + 14]}.${bytes[ipOffset + 15]}`;
  const dstIpFromBytes = `${bytes[ipOffset + 16]}.${bytes[ipOffset + 17]}.${bytes[ipOffset + 18]}.${bytes[ipOffset + 19]}`;

  const srcIp = frame.srcIp ?? srcIpFromBytes;
  const dstIp = frame.dstIp ?? dstIpFromBytes;
  const srcPort = frame.srcPort ?? srcPortFromBytes;
  const dstPort = frame.dstPort ?? dstPortFromBytes;
  const sequence = frame.tcpSeq ?? seqFromBytes;
  const ack = frame.tcpAck ?? ackFromBytes;

  let direction = frame.meta.direction;
  if (direction === "unknown") {
    if (isServerPort(dstPort)) {
      direction = "clientToServer";
    } else if (isServerPort(srcPort)) {
      direction = "serverToClient";
    }
  }

  if (!srcIp || !dstIp || srcPort === undefined || dstPort === undefined || sequence === undefined) {
    return null;
  }

  return {
    meta: {
      ...frame.meta,
      direction,
    },
    srcIp,
    dstIp,
    srcPort,
    dstPort,
    sequence,
    ack,
    payload,
    declaredPayloadLength: frame.tcpPayloadLength,
  };
}
