/**
 * Browser Notification Service
 * Handles permission requests and sending notifications for stock recommendations
 */

export type NotificationPermission = 'granted' | 'denied' | 'default';

/**
 * Check if browser notifications are supported
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission as NotificationPermission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported in this browser');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Send a stock recommendation notification
 */
export function sendStockNotification(
  ticker: string,
  action: 'buy' | 'watch' | 'avoid',
  reason: string
): void {
  if (getNotificationPermission() !== 'granted') {
    console.log('Notifications not permitted');
    return;
  }

  const actionEmoji = action === 'buy' ? '🚀' : action === 'watch' ? '👀' : '⚠️';
  const actionText = action === 'buy' ? 'Buy Signal' : action === 'watch' ? 'Watch List' : 'Caution';

  const notification = new Notification(`${actionEmoji} ${ticker}: ${actionText}`, {
    body: reason,
    icon: '/vite.svg', // Uses the app icon
    tag: `stock-${ticker}`, // Prevents duplicate notifications
    requireInteraction: action === 'buy', // Buy signals stay until dismissed
  });

  notification.onclick = () => {
    window.focus();
    window.location.href = `/stock/${ticker}`;
    notification.close();
  };
}

/**
 * Send daily picks notification
 */
export function sendDailyPicksNotification(pickCount: number, topTicker?: string): void {
  if (getNotificationPermission() !== 'granted') return;

  const title = `📊 Daily Picks Ready`;
  const body = topTicker
    ? `${pickCount} stock${pickCount !== 1 ? 's' : ''} recommended today. Top pick: ${topTicker}`
    : `${pickCount} stock${pickCount !== 1 ? 's' : ''} recommended for today.`;

  new Notification(title, {
    body,
    icon: '/vite.svg',
    tag: 'daily-picks',
  });
}

/**
 * Notification settings stored in localStorage
 */
interface NotificationSettings {
  enabled: boolean;
  dailyPicks: boolean;
  buySignals: boolean;
  priceAlerts: boolean;
}

const SETTINGS_KEY = 'notification_settings';

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  dailyPicks: true,
  buySignals: true,
  priceAlerts: false,
};

export function getNotificationSettings(): NotificationSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveNotificationSettings(settings: Partial<NotificationSettings>): void {
  const current = getNotificationSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
}
