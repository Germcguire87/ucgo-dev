/**
 * ucgo-info-server entry point.
 *
 * XOR table path defaults to the shared copy in ucgo-tools/packet-decoder/data/.
 * Override with the UCGO_XORTABLE env var for other layouts.
 */

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createServer } from "./bootstrap/createServer.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const XOR_TABLE_PATH =
  process.env["UCGO_XORTABLE"] ??
  resolve(__dirname, "../../../ucgo-tools/packet-decoder/data/xortable.dat");

async function main(): Promise<void> {
  console.log("[ucgo-info-server] Starting...");
  console.log(`[ucgo-info-server] XOR table: ${XOR_TABLE_PATH}`);

  const server = await createServer(XOR_TABLE_PATH);
  await server.listen();

  // Graceful shutdown on SIGINT / SIGTERM
  const shutdown = (): void => {
    console.log("\n[ucgo-info-server] Shutting down...");
    server.close().then(() => process.exit(0)).catch(() => process.exit(1));
  };

  process.on("SIGINT",  shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[ucgo-info-server] Fatal: ${msg}`);
  process.exit(1);
});
