import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const CONTENT_TYPES: Record<string, string> = {
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function getContentType(filePath: string): string {
  return CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function getCandidateRoots(): string[] {
  const cwd = process.cwd();
  return [path.join(cwd, 'public'), path.join(cwd, 'frontend', 'public')];
}

async function resolveAssetPath(relativeAssetPath: string): Promise<string | null> {
  const safePath = relativeAssetPath.split('/').filter(Boolean);

  for (const root of getCandidateRoots()) {
    const candidate = path.join(root, ...safePath);
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

export async function serveStaticAsset(relativeAssetPath: string): Promise<NextResponse> {
  const resolved = await resolveAssetPath(relativeAssetPath);
  if (!resolved) {
    return NextResponse.json({ error: 'Asset not found', path: relativeAssetPath }, { status: 404 });
  }

  const fileBuffer = await fs.readFile(resolved);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': getContentType(resolved),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
