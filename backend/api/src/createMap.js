import { create } from 'domain';
import { stat, opendir } from 'fs/promises';
import { join } from 'path';


async function calculateSizeOfEntries(entries) {
  return Object.entries(entries).reduce(
    (acc, [_, v]) => acc + v.size,
    0
  );
}

export async function createMap(path) {
  const dir = await opendir(path);
    const map = {};

    for(
      let entry = await dir.read();
      entry !== null;
      entry = await dir.read()
    ) {
      const fullPath = join(entry.parentPath, entry.name);

      if (entry.isDirectory()) {
        const entries = await createMap(fullPath);
        const size = await calculateSizeOfEntries(entries);

        map[entry.name] = {
          entries: entries,
          size: size,
        };
      } else if (entry.isFile) {
        const stats = await stat(fullPath);
        map[entry.name] = {
          size: stats.size,
        };
      }
    }

    dir.close();

    return map;
}