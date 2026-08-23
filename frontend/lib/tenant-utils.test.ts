import { afterEach, describe, expect, it } from 'vitest';
import { getTenantSlug } from './tenant-utils';

function mockWindow(hostname: string, search = '') {
  (globalThis as any).window = { location: { hostname, search } };
}

afterEach(() => {
  delete (globalThis as any).window;
});

describe('getTenantSlug', () => {
  it('resolves brand domains without a ?tenant param', () => {
    mockWindow('www.pizzaparty.sk');
    expect(getTenantSlug()).toBe('partypizza');
    mockWindow('pizzavnudzi.sk');
    expect(getTenantSlug()).toBe('pizzavnudzi');
    mockWindow('www.p0rnopizza.sk');
    expect(getTenantSlug()).toBe('pornopizza');
  });

  it('lets an explicit ?tenant override the domain and normalizes aliases', () => {
    mockWindow('www.p0rnopizza.sk', '?tenant=pizzaparty');
    expect(getTenantSlug()).toBe('partypizza');
    mockWindow('localhost', '?tenant=p0rnopizza');
    expect(getTenantSlug()).toBe('pornopizza');
  });

  it('defaults to pornopizza on localhost without a param and on the server', () => {
    mockWindow('localhost');
    expect(getTenantSlug()).toBe('pornopizza');
    delete (globalThis as any).window;
    expect(getTenantSlug()).toBe('pornopizza');
  });
});
