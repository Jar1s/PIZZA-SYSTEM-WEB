import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';
import { getStaticAssetContentType, resolveStaticAssetPath } from './static-asset-path';

export async function serveStaticAsset(relativeAssetPath: string): Promise<NextResponse> {
  const resolved = await resolveStaticAssetPath(relativeAssetPath);
  if (!resolved) {
    return NextResponse.json({ error: 'Asset not found', path: relativeAssetPath }, { status: 404 });
  }

  const fileBuffer = await fs.readFile(resolved);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': getStaticAssetContentType(resolved),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
