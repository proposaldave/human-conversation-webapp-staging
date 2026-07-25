import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const moments = JSON.parse(readFileSync(join(root, "feed", "published-moments.json"), "utf8"));
const html = readFileSync(join(root, "feed", "index.html"), "utf8");
const serviceWorker = readFileSync(join(root, "sw.js"), "utf8");

const ids = new Set();
const failures = [];

for (const moment of moments) {
  if (ids.has(moment.id)) failures.push(`Duplicate moment id: ${moment.id}`);
  ids.add(moment.id);

  const assetPath = join(root, "feed", "assets", moment.asset);
  if (!existsSync(assetPath)) failures.push(`Missing audio asset: ${moment.asset}`);
  if (!html.includes(`data-moment-id="${moment.id}"`)) failures.push(`Moment missing from feed: ${moment.id}`);
  if (!html.includes(`./assets/${moment.asset}`)) failures.push(`Asset missing from feed markup: ${moment.asset}`);
  if (!serviceWorker.includes(`./feed/assets/${moment.asset}`)) failures.push(`Asset missing from offline cache: ${moment.asset}`);
}

const renderedMomentCount = [...html.matchAll(/data-moment-id="/g)].length;
if (renderedMomentCount !== moments.length) {
  failures.push(`Manifest has ${moments.length} moments but feed renders ${renderedMomentCount}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Feed verified: ${moments.length} moments across ${new Set(moments.map((item) => item.sourceSession)).size} sessions.`);
