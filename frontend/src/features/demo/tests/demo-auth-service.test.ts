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
      error: { message: 'Too many requests', context: { status: 429 } },
    });

    await expect(loginDemo()).rejects.toThrow('RATE_LIMIT');
  });
});
