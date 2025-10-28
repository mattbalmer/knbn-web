import fs from 'fs';
import path from 'path';

export const getCWD = (): string => {
  return process.env.KNBN_CWD || process.cwd();
}

// Cache configuration
const CACHE_TTL_MS = 5000; // 5 seconds cache TTL

interface CacheEntry {
  data: Array<{ name: string; path: string }>;
  timestamp: number;
}

// Simple in-memory cache
const knbnFilesCache = new Map<string, CacheEntry>();

function findKnbnFilesRecursiveUncached(dir: string, baseDir: string): Array<{ name: string; path: string }> {
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

export function findKnbnFilesRecursive(dir: string, baseDir: string = dir): Array<{ name: string; path: string }> {
  const cacheKey = `${dir}|${baseDir}`;
  const now = Date.now();

  // Check if we have a valid cached entry
  const cached = knbnFilesCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
    return cached.data;
  }

  // Cache miss or expired - fetch fresh data
  const results = findKnbnFilesRecursiveUncached(dir, baseDir);

  // Store in cache
  knbnFilesCache.set(cacheKey, {
    data: results,
    timestamp: now
  });

  return results;
}