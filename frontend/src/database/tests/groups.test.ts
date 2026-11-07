import { describe, expect, it, vi } from 'vitest';

vi.mock('@/database/models/db', () => ({ db: { groups: {} } }));

import Groups from '@/database/models/groups';

describe('Groups.syncSelect', () => {
  it('selects sound classification fields with group rows', () => {
    expect(Groups.syncSelect).toContain('sound_class');
    expect(Groups.syncSelect).toContain('sound_category');
  });
});
