import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { setupStore, type RootState } from '../app/store';

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', preloadedState }: { route?: string; preloadedState?: Partial<RootState> } = {},
) {
  const store = setupStore(preloadedState);
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </Provider>,
    ),
  };
}

/** Minimal fetch stub: maps "METHOD /path" to a JSON response. */
export function stubFetch(routes: Record<string, { status?: number; body: unknown }>) {
  const calls: { method: string; url: string; body?: unknown }[] = [];
  const fetchMock = async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = input instanceof Request ? input : new Request(String(input), init);
    const url = new URL(req.url, 'http://localhost');
    const text = await req.clone().text();
    calls.push({ method: req.method, url: url.pathname + url.search, body: text ? JSON.parse(text) : undefined });
    const match = routes[`${req.method} ${url.pathname}`];
    const status = match?.status ?? (match ? 200 : 404);
    return new Response(JSON.stringify(match ? match.body : { error: 'Not found' }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  globalThis.fetch = fetchMock as typeof fetch;
  return calls;
}
