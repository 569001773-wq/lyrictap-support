import { cp, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const source = fileURLToPath(new URL("../out/", import.meta.url));
const target = fileURLToPath(new URL("../../", import.meta.url));
for (const entry of await readdir(source, { withFileTypes: true })) {
  if (["404.html", "404", "_not-found"].includes(entry.name)) continue;
  await cp(`${source}/${entry.name}`, `${target}/${entry.name}`, { recursive: true });
}
