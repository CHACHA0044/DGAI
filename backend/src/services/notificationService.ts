import { prisma } from '../config/database';

export const NotificationTypes = {
  UPCOMING_DEADLINE: 'UPCOMING_DEADLINE',
  EMERGENCY_MODE: 'EMERGENCY_MODE',
  PLAN_STALE: 'PLAN_STALE',
  OVERDUE: 'OVERDUE',
  HIGH_WORKLOAD: 'HIGH_WORKLOAD',
  RISK_INCREASED: 'RISK_INCREASED',
} as const;

/** Create a single notification alert */
export async function createNotification(taskId: string | null, type: string, message: string) {
  // Prevent duplicate unread notifications of the exact same message to avoid noise
  const existing = await prisma.notification.findFirst({
    where: {
      type,
      message,
      read: false,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.notification.create({
    data: {
      taskId,
      type,
      message,
      read: false,
    },
  });
}

/** Retrieve all notifications (ordered by unread, then latest first) */
export async function listNotifications() {
  return prisma.notification.findMany({
    orderBy: [
      { read: 'asc' },
      { createdAt: 'desc' },
    ],
    take: 50,
  });
}

/** Mark a specific notification alert as read */
export async function markNotificationAsRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { read: true },
  });
}

/** Bulk mark all unread notifications as read */
export async function markAllAsRead() {
  return prisma.notification.updateMany({
    where: { read: false },
    data: { read: true },
  });
}

/** Delete older notifications to prevent table bloating (keep last 100) */
export async function pruneNotifications() {
  const total = await prisma.notification.count();
  if (total <= 100) return;

  const keepList = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: { id: true },
  });

  const idsToKeep = keepList.map(n => n.id);

  return prisma.notification.deleteMany({
    where: {
      id: { notIn: idsToKeep },
    },
  });
}
