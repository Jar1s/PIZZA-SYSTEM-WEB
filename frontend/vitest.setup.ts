import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import React from 'react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// Mock Next.js Image - prevent fill/priority props from leaking
vi.mock('next/image', () => ({
  default: (props: any) => {
    const { fill, priority, ...imgProps } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', imgProps);
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Suppress console.log in tests unless DEBUG is set
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

if (process.env.NODE_ENV !== 'development' || !process.env.DEBUG) {
  console.log = vi.fn();
  console.error = vi.fn();
  console.warn = vi.fn();
}

// Restore for debugging if needed
global.console = {
  ...console,
  log: process.env.DEBUG ? originalLog : vi.fn(),
  error: process.env.DEBUG ? originalError : vi.fn(),
  warn: process.env.DEBUG ? originalWarn : vi.fn(),
};
