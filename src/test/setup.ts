import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

// jsdom ships its own AbortSignal, which Node's Request refuses; the tests never abort requests.
class TestRequest extends Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    const { signal: _signal, ...rest } = init ?? {};
    super(input, rest);
  }
}
globalThis.Request = TestRequest as typeof Request;
