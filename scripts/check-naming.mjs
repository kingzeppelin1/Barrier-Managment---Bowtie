#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Naming-convention guardrail.
 *
 * Scans tracked source files for forbidden strings that would violate the
 * STAR Suite design-system + methodology naming rules:
 *
 *   - "Escalation Factor" (any case)        → use "Degradation Factor"
 *   - "EscalationFactor" (PascalCase)       → use "DegradationFactor"
 *   - "Star Suite"  (lowercase 's')         → use "STAR Suite"
 *   - "StarSuite"   (no space)              → use "STAR Suite"
 *   - "BowtieXP" or competitor product name → no competitor names in source
 *
 * Failures cause a non-zero exit. Wired into the turbo build pipeline so a
 * naming violation breaks both local builds and Vercel deploys.
 *
 * To exempt a specific file (e.g. CLAUDE.md, glossary, or a docstring that
 * intentionally says "never use 'Escalation Factor'"), add it to EXEMPT.
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

const RULES = [
  {
    name: 'Escalation Factor',
    pattern: /Escalation[\s_-]*Factor/gi,
    fix: 'Use "Degradation Factor" / "Degradation Control"',
  },
  {
    name: 'EscalationFactor (PascalCase)',
    pattern: /\bEscalationFactor\b/g,
    fix: 'Use "DegradationFactor" / "DegradationControl"',
  },
  {
    name: 'Star Suite (lowercase S)',
    // Match "Star Suite" but NOT "STAR Suite". The negative lookbehind
    // rejects an upper-case "T" before "tar Suite" via the prefix "S".
    pattern: /(?<![A-Z])Star Suite\b/g,
    fix: 'Use "STAR Suite" — STAR is always uppercase',
  },
  {
    name: 'StarSuite (no space)',
    pattern: /\bStarSuite\b/g,
    fix: 'Use "STAR Suite" with a space',
  },
  {
    name: 'BowtieXP / competitor product name',
    pattern: /\bBowtieXP\b/gi,
    fix: 'No competitor product names in source',
  },
];

/**
 * Files / directories that are allowed to mention the forbidden strings,
 * because they DOCUMENT the prohibition (a "never write X" rule has to
 * write X to be readable).
 */
const EXEMPT = [
  // The script itself.
  /scripts\/check-naming\.mjs$/,
  // Operating manual + reconciliation notes.
  /^CLAUDE\.md$/,
  // Spec docs that document the prohibition.
  /^docs\//,
  // Schema docstring: "Never 'Escalation Factor' / 'EFB'".
  /^packages\/shared\/src\/types\.ts$/,
  // Detail panel + wizard step include the methodology note user-facing
  // ("never &ldquo;Escalation Factor&rdquo;"). Both render the prohibited
  // term as a readable explanation, not as a name in use.
  /^apps\/web\/components\/bowtie\/detail-panel\.tsx$/,
  /^apps\/web\/components\/bowtie\/wizard\/steps-8-9\.tsx$/,
  // Translation message bundles can contain prohibited strings as long as
  // they're framed in helper text. None today, but reserve.
  /^apps\/web\/i18n\/messages\//,
];

/** Directories never to descend into. */
const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  '.turbo',
  '.git',
  'dist',
  'coverage',
  'playwright-report',
  'test-results',
  '.cache',
]);

/** Only check these extensions. */
const EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.mdx',
  '.html',
  '.css',
  '.scss',
]);

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

function isExempt(rel) {
  return EXEMPT.some((re) => re.test(rel));
}

function hasInterestingExt(path) {
  const idx = path.lastIndexOf('.');
  if (idx < 0) return false;
  return EXTENSIONS.has(path.slice(idx));
}

async function main() {
  let violations = 0;
  let scanned = 0;

  for await (const path of walk(ROOT)) {
    const rel = relative(ROOT, path);
    if (isExempt(rel)) continue;
    if (!hasInterestingExt(path)) continue;

    scanned += 1;

    let content;
    try {
      content = await readFile(path, 'utf8');
    } catch {
      continue;
    }

    for (const rule of RULES) {
      // Reset for global regex.
      rule.pattern.lastIndex = 0;
      let match;
      while ((match = rule.pattern.exec(content)) !== null) {
        violations += 1;
        const before = content.slice(0, match.index);
        const line = before.split('\n').length;
        const col = match.index - before.lastIndexOf('\n');
        console.error(
          `[31m✗[0m ${rel}:${line}:${col}  ${rule.name}\n  ${rule.fix}\n  matched: "${match[0]}"`,
        );
      }
    }
  }

  if (violations > 0) {
    console.error(
      `\n[31m${violations} naming violation${violations === 1 ? '' : 's'}[0m across ${scanned} files. Fix the matches above or add the file to EXEMPT in scripts/check-naming.mjs if it documents the prohibition.`,
    );
    process.exit(1);
  }

  console.log(`[32m✓[0m naming-check: 0 violations across ${scanned} source files.`);
}

main().catch((err) => {
  console.error('naming-check crashed:', err);
  process.exit(2);
});
