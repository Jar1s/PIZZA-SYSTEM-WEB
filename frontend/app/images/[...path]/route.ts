import { serveStaticAsset } from '@/lib/static-asset-response';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return serveStaticAsset(['images', ...path].join('/'));
}
