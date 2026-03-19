/**
 * Updates src/lib/sqlite/bundled-rates.json with historical EUR-based weekly
 * exchange rates for all 13 non-EUR currencies supported by SpendWise.
 *
 * Usage:
 *   npx tsx scripts/generate-bundled-rates.ts
 *
 * Incremental: reads the existing JSON to find the latest stored date, then
 * only fetches rates from that date forward. Safe to re-run at any time.
 * Requires internet access to fetch from api.frankfurter.app.
 */

import fs from 'node:fs';
import path from 'node:path';

type Rate = { quote: string; rate: number; date: number };

const CURRENCIES = ['AUD', 'GBP', 'CAD', 'CNY', 'INR', 'JPY', 'MYR', 'PLN', 'KRW', 'CHF', 'ZAR', 'THB', 'USD'];
const OUTPUT_PATH = path.join(__dirname, '../src/lib/sqlite/bundled-rates.json');
const FALLBACK_YEARS = 5;

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function toMidnightUnix(dateStr: string): number {
  return Math.floor(new Date(`${dateStr}T00:00:00Z`).getTime() / 1000);
}

function readExisting(): { rates: Rate[]; latestDate: number | null } {
  if (!fs.existsSync(OUTPUT_PATH)) return { rates: [], latestDate: null };
  const rates: Rate[] = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
  if (rates.length === 0) return { rates: [], latestDate: null };
  const latestDate = Math.max(...rates.map((r) => r.date));
  return { rates, latestDate };
}

async function fetchRatesInRange(from: string, to: string): Promise<Rate[]> {
  const url = `https://api.frankfurter.app/${from}..${to}?from=EUR&to=${CURRENCIES.join(',')}`;
  console.log(`Fetching: ${url}`);

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);

  const data = await resp.json() as { rates: Record<string, Record<string, number>> };
  const dates = Object.keys(data.rates).sort();
  const entries: Rate[] = [];

  // Sample every 7th trading day for weekly granularity
  for (let i = 0; i < dates.length; i += 7) {
    const dateStr = dates[i];
    const dateUnix = toMidnightUnix(dateStr);
    for (const [quote, rate] of Object.entries(data.rates[dateStr])) {
      if (CURRENCIES.includes(quote)) {
        entries.push({ quote, rate, date: dateUnix });
      }
    }
  }

  return entries;
}

/** Split a date range into year-sized chunks to avoid Frankfurter response truncation. */
function buildYearlyChunks(from: Date, to: Date): Array<{ from: string; to: string }> {
  const chunks: Array<{ from: string; to: string }> = [];
  let cursor = new Date(from);

  while (cursor < to) {
    const chunkEnd = new Date(cursor);
    chunkEnd.setFullYear(chunkEnd.getFullYear() + 1);
    chunkEnd.setDate(chunkEnd.getDate() - 1); // one year minus one day
    chunks.push({ from: formatDate(cursor), to: formatDate(chunkEnd < to ? chunkEnd : to) });
    cursor = new Date(chunkEnd);
    cursor.setDate(cursor.getDate() + 1);
  }

  return chunks;
}

async function main() {
  const { rates: existing, latestDate } = readExisting();

  const endDate = new Date();
  let fetchFrom: Date;

  if (latestDate) {
    fetchFrom = new Date((latestDate + 86400) * 1000); // day after last stored date
    console.log(`Existing: ${existing.length} entries up to ${formatDate(new Date(latestDate * 1000))}. Fetching from ${formatDate(fetchFrom)}...`);
  }
  else {
    fetchFrom = new Date();
    fetchFrom.setFullYear(endDate.getFullYear() - FALLBACK_YEARS);
    console.log(`No existing rates. Fetching ${FALLBACK_YEARS} years of history...`);
  }

  if (fetchFrom >= endDate) {
    console.log('Already up to date. Nothing to fetch.');
    return;
  }

  // Fetch year-by-year — Frankfurter silently truncates large date range responses
  const chunks = buildYearlyChunks(fetchFrom, endDate);
  const newEntries: Rate[] = [];

  for (const chunk of chunks) {
    const entries = await fetchRatesInRange(chunk.from, chunk.to);
    newEntries.push(...entries);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`Fetched ${newEntries.length} new entries across ${chunks.length} chunk(s)`);

  // Merge, deduplicate by (quote, date), sort
  const seen = new Set<string>();
  const merged: Rate[] = [];

  for (const entry of [...existing, ...newEntries]) {
    const key = `${entry.quote}:${entry.date}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(entry);
    }
  }

  merged.sort((a, b) => a.date - b.date || a.quote.localeCompare(b.quote));

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(merged, null, 2));
  console.log(`Written ${merged.length} total entries (${existing.length} existing + ${newEntries.length} new) to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
