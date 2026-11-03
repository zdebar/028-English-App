import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  download: vi.fn(),
}));

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {
    storage: {
      from: () => ({
        download: (...args: unknown[]) => mocks.download(...args),
      }),
    },
  },
}));

import { downloadStorageObject } from '@/database/audio/audio-storage';

describe('audio storage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('downloads a blob using the normalized object path', async () => {
    const blob = new Blob(['ok']);
    mocks.download.mockResolvedValue({ data: blob, error: null });

    const result = await downloadStorageObject('bucket-a', '/file.json');

    expect(mocks.download).toHaveBeenCalledWith('file.json');
    expect(result).toBe(blob);
  });

  it('throws when storage download returns an error', async () => {
    mocks.download.mockResolvedValue({ data: null, error: { message: 'not found' } });

    await expect(downloadStorageObject('bucket-a', 'missing.json')).rejects.toThrow(
      'Error fetching file missing.json from bucket bucket-a: not found',
    );
  });
});
