import path from 'path';
import { describe, expect, it } from 'vitest';
import { getStaticAssetContentType, resolveStaticAssetPath } from './static-asset-path';

describe('static asset path resolution', () => {
  it('resolves files from the public asset roots', async () => {
    const resolved = await resolveStaticAssetPath('favicon.ico');

    expect(resolved).toBe(path.join(process.cwd(), 'public', 'favicon.ico'));
    expect(getStaticAssetContentType(resolved || '')).toBe('image/x-icon');
  });

  it('rejects path traversal outside the public asset roots', async () => {
    await expect(resolveStaticAssetPath('../package.json')).resolves.toBeNull();
  });
});
