import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

/** Sortable, filesystem-safe timestamp for filenames, e.g. feedback/build-evaluation-<slug>.md */
export function timestampSlug(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

/** Day-granularity slug for filenames, e.g. exercises/build-mode/spec-<slug>-<topic>.md */
export function dateSlug(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Writes `content` to both a timestamped file and a `latest-*` file, so history isn't
 * clobbered but downstream commands always have an unambiguous default input. */
export async function writeTimestampedAndLatest(
  dir: string,
  timestampedName: string,
  latestName: string,
  content: string,
): Promise<void> {
  await ensureDir(dir);
  await Promise.all([
    writeFile(path.join(dir, timestampedName), content),
    writeFile(path.join(dir, latestName), content),
  ]);
}
