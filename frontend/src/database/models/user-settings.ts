import { supabaseInstance } from '@/config/supabase.config';
import config from '@/config/config';
import { db } from '@/database/models/db';
import type { UserSettingsType } from '@/types/generic.types';
import { SupabaseError } from '@/types/error.types';
import { Entity } from 'dexie';
import type AppDB from './app-db';

const DEFAULT_DAILY_NEW_LESSON_LIMIT = 1;

export default class UserSettings extends Entity<AppDB> implements UserSettingsType {
  id!: string;
  max_new_lessons_per_day!: number;
  updated_at!: string;

  static async getOrCreate(userId: string): Promise<UserSettingsType> {
    const existing = await db.users.get(userId);
    if (existing) return existing;

    const settings: UserSettingsType = {
      id: userId,
      max_new_lessons_per_day: DEFAULT_DAILY_NEW_LESSON_LIMIT,
      updated_at: config.database.epochStartDate,
    };
    await db.users.put(settings);
    return settings;
  }

  static async updateDailyNewLessonLimit(userId: string, limit: number): Promise<UserSettingsType> {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error('Daily new lesson limit must be a positive integer.');
    }

    const settings = await this.getOrCreate(userId);
    const updated = {
      ...settings,
      max_new_lessons_per_day: limit,
      updated_at: new Date().toISOString(),
    };
    await db.users.put(updated);
    return updated;
  }

  static async syncFromRemote(userId: string): Promise<void> {
    await this.getOrCreate(userId);
    const { data, error } = await supabaseInstance
      .from('users')
      .select('id, max_new_lessons_per_day, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw new SupabaseError('Failed to fetch user settings from Supabase', error);
    const local = await this.getOrCreate(userId);
    if (!data) {
      await this.pushLocalSettings(local);
      return;
    }

    const remote = data as UserSettingsType;
    if (Date.parse(local.updated_at) > Date.parse(remote.updated_at)) {
      await this.pushLocalSettings(local);
      return;
    }

    await db.users.put(remote);
  }

  static removeLocal(userId: string): Promise<void> {
    return db.users.delete(userId);
  }

  private static async pushLocalSettings(settings: UserSettingsType): Promise<void> {
    const { error } = await supabaseInstance
      .from('users')
      .update({ max_new_lessons_per_day: settings.max_new_lessons_per_day })
      .eq('id', settings.id);

    if (error) throw new SupabaseError('Failed to update user settings in Supabase', error);
  }
}
