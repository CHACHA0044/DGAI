import { prisma } from '../config/database';
import { AppTheme } from '@prisma/client';

// ─────────────────────────────────────────────────────────────
// Single-row settings (id = "default" — no auth required)
// ─────────────────────────────────────────────────────────────

const SETTINGS_ID = 'default';

export interface UpdateSettingsInput {
  workStartHour?: number;       // 0-23
  workEndHour?: number;         // 0-23
  breakDurationMinutes?: number; // 5-60
  focusIntervalMinutes?: number; // 15-120
  emergencyThresholdHours?: number; // 0.5-24
  notificationsEnabled?: boolean;
  theme?: 'DARK' | 'LIGHT' | 'SYSTEM';
}

/** Get settings, creating defaults if not yet stored */
export async function getSettings() {
  const existing = await prisma.userSettings.findUnique({ where: { id: SETTINGS_ID } });
  if (existing) return existing;

  // First-time: create defaults
  return prisma.userSettings.create({
    data: { id: SETTINGS_ID },
  });
}

/** Upsert settings */
export async function updateSettings(input: UpdateSettingsInput) {
  // Clamp values to safe ranges
  const data: Record<string, unknown> = {};
  if (input.workStartHour !== undefined)        data.workStartHour = Math.min(12, Math.max(0, input.workStartHour));
  if (input.workEndHour !== undefined)          data.workEndHour = Math.min(23, Math.max(13, input.workEndHour));
  if (input.breakDurationMinutes !== undefined) data.breakDurationMinutes = Math.min(60, Math.max(5, input.breakDurationMinutes));
  if (input.focusIntervalMinutes !== undefined) data.focusIntervalMinutes = Math.min(120, Math.max(15, input.focusIntervalMinutes));
  if (input.emergencyThresholdHours !== undefined) data.emergencyThresholdHours = Math.min(24, Math.max(0.5, input.emergencyThresholdHours));
  if (input.notificationsEnabled !== undefined) data.notificationsEnabled = input.notificationsEnabled;
  if (input.theme !== undefined)                data.theme = input.theme as AppTheme;

  return prisma.userSettings.upsert({
    where: { id: SETTINGS_ID },
    update: data,
    create: { id: SETTINGS_ID, ...data },
  });
}
