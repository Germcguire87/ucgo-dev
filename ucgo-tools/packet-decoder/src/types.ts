export type PacketDirection = "clientToServer" | "serverToClient" | "unknown";

export interface CapturePacketMeta {
  frameNumber: number;
  timestamp?: string | undefined;
  transport?: string | undefined;
  direction: PacketDirection;
  streamOffset?: number | undefined;
  streamConsumed?: number | undefined;
}

export interface CapturedFrame {
  meta: CapturePacketMeta;
  frameBytes: Buffer;
  srcIp?: string | undefined;
  dstIp?: string | undefined;
  srcPort?: number | undefined;
  dstPort?: number | undefined;
  tcpSeq?: number | undefined;
  tcpAck?: number | undefined;
  tcpPayloadLength?: number | undefined;
}

export interface TcpSegment {
  meta: CapturePacketMeta;
  srcIp: string;
  dstIp: string;
  srcPort: number;
  dstPort: number;
  sequence: number;
  ack?: number | undefined;
  payload: Buffer;
  declaredPayloadLength?: number | undefined;
}

export interface ReassembledTcpStream {
  streamKey: string;
  segments: TcpSegment[];
  data: Buffer;
}

export interface ParsedHeader {
  rawLength: number;
  magicHead: string;
  keyOffset: number;
  sysMessage: number;
  sequence: number;
  xorSize: number;
  blowfishSize: number;
  opcodeCandidate: number;
  unknownInts: number[];
  magicTail: string;
  headerValid: boolean;
}

export interface ParsedPacket {
  meta: CapturePacketMeta;
  bytes: Buffer;
  header: ParsedHeader;
  payload: Buffer;
  payloadRelevant: Buffer;
  payloadPadding: Buffer;
}

export interface TcpCandidateChunk {
  meta: CapturePacketMeta;
  streamKey: string;
  sequence: number;
  length: number;
  bytes: Buffer;
}
