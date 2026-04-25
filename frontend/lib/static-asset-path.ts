import { promises as fs } from 'fs';
import path from 'path';

const CONTENT_TYPES: Record<string, string> = {
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

export function getStaticAssetContentType(filePath: string): string {
  return CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function getCandidateRoots(): string[] {
  const cwd = process.cwd();
  return [path.join(cwd, 'public'), path.join(cwd, 'frontend', 'public')].map((root) =>
    path.resolve(root)
  );
}

function isSafePathSegment(segment: string): boolean {
  return (
    segment.length > 0 &&
    segment !== '.' &&
    segment !== '..' &&
    !segment.includes('\\') &&
    !segment.includes('\0')
  );
}

function isPathWithinRoot(candidate: string, root: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

export async function resolveStaticAssetPath(relativeAssetPath: string): Promise<string | null> {
  const safePath = relativeAssetPath.split('/').filter(Boolean);
  if (safePath.length === 0 || !safePath.every(isSafePathSegment)) {
    return null;
  }

  for (const root of getCandidateRoots()) {
    const candidate = path.resolve(root, ...safePath);
    if (!isPathWithinRoot(candidate, root)) {
      continue;
    }

    try {
      const stat = await fs.stat(candidate);
      if (stat.isFile()) {
        return candidate;
      }
    } catch {
      // try next candidate
    }
  }

  return null;
}
