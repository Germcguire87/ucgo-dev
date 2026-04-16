#!/usr/bin/env tsx
/**
 * ucgo-test-harness — CLI entry point
 *
 * Usage:
 *   tsx src/index.ts <capture.pcap>              Decode a single PCAP
 *   tsx src/index.ts <capture.pcap> --verbose    Include raw body hex dump
 *   tsx src/index.ts <capture.pcap> --original   Use chrTCPPassword instead of UCGOhost key
 *   tsx src/index.ts --vectors                   Run crypto vector validation only
 *   tsx src/index.ts --vectors <capture.pcap>    Vectors first, then decode capture
 *
 * Batch mode (no file):
 *   Scans ../../protocol/captures/raw/ucgohost-style/login/ for *.pcap files
 */

import { readdirSync, existsSync } from "node:fs";
import { resolve, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

import { runCapture, BF_KEY_UCGOHOST, BF_KEY_ORIGINAL } from "./runCapture.js";
import { runVectorValidation }                            from "./validateVectors.js";
import { c, printRule }                                   from "./print.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_CAPTURE_DIR = resolve(
  __dirname,
  "../../../ucgo-protocol/captures/raw/ucgohost-style/login",
);

function parseArgs(): {
  filePaths: string[];
  runVectors: boolean;
  verbose: boolean;
  useOriginalKey: boolean;
} {
  const args = process.argv.slice(2);
  const filePaths:      string[] = [];
  let runVectors      = false;
  let verbose         = false;
  let useOriginalKey  = false;

  for (const arg of args) {
    if (arg === "--vectors") { runVectors = true; continue; }
    if (arg === "--verbose") { verbose    = true; continue; }
    if (arg === "--original") { useOriginalKey = true; continue; }
    if (!arg.startsWith("--")) filePaths.push(resolve(arg));
  }

  return { filePaths, runVectors, verbose, useOriginalKey };
}

function listCaptures(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => extname(f).toLowerCase() === ".pcap")
    .map(f => join(dir, f))
    .sort();
}

async function main(): Promise<void> {
  const { filePaths, runVectors, verbose, useOriginalKey } = parseArgs();
  const blowfishKey = useOriginalKey ? BF_KEY_ORIGINAL : BF_KEY_UCGOHOST;

  console.log(c.BOLD + "╔══════════════════════════════════════╗" + c.RESET);
  console.log(c.BOLD + "║      ucgo-test-harness               ║" + c.RESET);
  console.log(c.BOLD + "╚══════════════════════════════════════╝" + c.RESET);

  // ── Vector validation (always first if requested) ────────────────────────
  if (runVectors) {
    runVectorValidation();
  }

  // ── Determine what captures to run ────────────────────────────────────────
  let targets = filePaths;

  if (targets.length === 0 && !runVectors) {
    // Batch mode — scan default directory
    targets = listCaptures(DEFAULT_CAPTURE_DIR);
    if (targets.length === 0) {
      console.error(
        `\nNo captures found in ${DEFAULT_CAPTURE_DIR}\n` +
        `\nUsage:\n` +
        `  tsx src/index.ts <capture.pcap> [--verbose] [--original]\n` +
        `  tsx src/index.ts --vectors\n` +
        `  tsx src/index.ts --vectors <capture.pcap>\n`,
      );
      process.exit(1);
    }
    console.log(
      `\n${c.DIM}Batch mode — ${targets.length} capture(s) in ${DEFAULT_CAPTURE_DIR}${c.RESET}`,
    );
  }

  // ── Run captures ────────────────────────────────────────────────────────────
  let failed = 0;
  for (const target of targets) {
    try {
      await runCapture(target, blowfishKey, verbose);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\n${c.RED}ERROR: ${msg}${c.RESET}`);
      failed++;
    }
  }

  if (targets.length > 1) {
    console.log();
    printRule("═");
    console.log(
      c.BOLD + `${targets.length - failed}/${targets.length} captures succeeded.` + c.RESET,
    );
    if (failed > 0) process.exit(1);
  }
}

main().catch(err => {
  console.error(c.RED + (err instanceof Error ? err.stack : String(err)) + c.RESET);
  process.exit(1);
});
