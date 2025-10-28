import fs from 'fs';
import path from 'path';

export const getCWD = (): string => {
  return process.env.KNBN_CWD || process.cwd();
}

export function findKnbnFilesRecursiveUncached(dir: string, baseDir: string = dir): Array<{ name: string; path: string }> {
  const results: Array<{ name: string; path: string }> = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip hidden directories
        if (!entry.name.startsWith('.')) {
          results.push(...findKnbnFilesRecursiveUncached(fullPath, baseDir));
        }
      } else if (entry.isFile() && entry.name.endsWith('.knbn')) {
        // Calculate relative path from base directory
        const relativePath = path.relative(baseDir, fullPath);
        results.push({
          name: relativePath,
          path: fullPath
        });
      }
    }
  } catch (error) {
    // Silently skip directories we can't read
  }

  return results;
}