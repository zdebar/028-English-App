import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn<(url: string, key: string, options: unknown) => { client: string }>(
    () => ({ client: 'supabase' }),
  ),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.createClient,
}));

import { supabaseInstance } from '@/config/supabase.config';

describe('supabaseInstance', () => {
  it('uses PKCE and detects sessions returned in the redirect URL', () => {
    expect(supabaseInstance).toEqual({ client: 'supabase' });
    expect(mocks.createClient.mock.calls[0]?.[2]).toEqual({
      auth: {
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
  });
});
