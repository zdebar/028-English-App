import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  setSession: vi.fn(),
  functionsInvoke: vi.fn(),
}));

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {
    auth: {
      setSession: (...args: unknown[]) => mocks.setSession(...args),
    },
    functions: {
      invoke: (...args: unknown[]) => mocks.functionsInvoke(...args),
    },
  },
}));

import { loginDemo } from '@/features/demo/demo-auth-service';

function createResponseContext(status: number, body: Record<string, unknown>): Response {
  return {
    status,
    clone() {
      return {
        json: async () => body,
        text: async () => JSON.stringify(body),
      } as Response;
    },
  } as Response;
}

describe('loginDemo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.setSession.mockResolvedValue({ error: null });
    mocks.functionsInvoke.mockResolvedValue({ data: {}, error: null });
  });

  it('invokes demo-session and sets session', async () => {
    mocks.functionsInvoke.mockResolvedValue({
      data: {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      },
      error: null,
    });

    await loginDemo();

    expect(mocks.functionsInvoke).toHaveBeenCalledWith('demo-session', {
      body: {},
    });
    expect(mocks.setSession).toHaveBeenCalledWith({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });
  });

  it('maps rate limit error status', async () => {
    mocks.functionsInvoke.mockResolvedValue({
      data: null,
      error: {
        message: 'Too many requests',
        context: createResponseContext(429, { message: 'Too many requests' }),
      },
    });

    await expect(loginDemo()).rejects.toThrow('RATE_LIMIT');
  });

  it('maps invalid credentials from 401 payload', async () => {
    mocks.functionsInvoke.mockResolvedValue({
      data: null,
      error: {
        message: 'Unauthorized',
        context: createResponseContext(401, { error: 'Invalid login credentials' }),
      },
    });

    await expect(loginDemo()).rejects.toThrow('DEMO_INVALID_CREDENTIALS');
  });

  it('throws when session payload is missing tokens', async () => {
    mocks.functionsInvoke.mockResolvedValue({
      data: {},
      error: null,
    });

    await expect(loginDemo()).rejects.toThrow('Invalid demo session payload');
    expect(mocks.setSession).not.toHaveBeenCalled();
  });

  it('propagates setSession error message', async () => {
    mocks.functionsInvoke.mockResolvedValue({
      data: {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      },
      error: null,
    });
    mocks.setSession.mockResolvedValue({ error: { message: 'session failed' } });

    await expect(loginDemo()).rejects.toThrow('session failed');
  });
});
