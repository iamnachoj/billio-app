import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

function setupWorker(clients: object[] = []) {
  const handlers: Record<string, (event: never) => void> = {};
  const openWindow = vi.fn().mockResolvedValue(undefined);
  const self = {
    addEventListener: (name: string, handler: (event: never) => void) => {
      handlers[name] = handler;
    },
    clients: { matchAll: vi.fn().mockResolvedValue(clients), openWindow },
  };
  runInNewContext(readFileSync('public/sw.js', 'utf8'), { self });
  return { handlers, openWindow };
}

describe('notification click', () => {
  it('uses the payload URL for an existing client', async () => {
    const client = {
      navigate: vi.fn(),
      focus: vi.fn().mockResolvedValue(undefined),
    };
    const { handlers } = setupWorker([client]);
    let task: Promise<unknown> | undefined;
    const close = vi.fn();
    handlers.notificationclick({
      notification: { close, data: { url: '/es/dashboard/groups/g1' } },
      waitUntil: (promise: Promise<unknown>) => {
        task = promise;
      },
    } as never);
    await task;
    expect(close).toHaveBeenCalledOnce();
    expect(client.navigate).toHaveBeenCalledWith('/es/dashboard/groups/g1');
    expect(client.focus).toHaveBeenCalledOnce();
  });

  it('lets the proxy negotiate the locale when the URL is missing', async () => {
    const { handlers, openWindow } = setupWorker();
    let task: Promise<unknown> | undefined;
    handlers.notificationclick({
      notification: { close: vi.fn(), data: {} },
      waitUntil: (promise: Promise<unknown>) => {
        task = promise;
      },
    } as never);
    await task;
    expect(openWindow).toHaveBeenCalledWith('/dashboard');
  });
});
