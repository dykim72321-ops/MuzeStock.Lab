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
    window.location.href = `/analysis/${ticker}`;
  };
}

// === 강화된 알림 기능 ===

/**
 * 목표가 도달 알림
 */
export const sendPriceAlert = (ticker: string, targetPrice: number, currentPrice: number) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  new Notification(`🎯 ${ticker} 목표가 도달!`, {
    body: `목표: $${targetPrice.toFixed(2)} → 현재: $${currentPrice.toFixed(2)}`,
    icon: '/logo.png',
    tag: `price-alert-${ticker}`,
  });
};

/**
 * DNA 점수 급등 알림
 */
export const sendDnaScoreSurge = (ticker: string, oldScore: number, newScore: number) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const increase = newScore - oldScore;
  new Notification(`🚀 ${ticker} DNA 점수 급등!`, {
    body: `${oldScore} → ${newScore} (+${increase.toFixed(0)}점)`,
    icon: '/logo.png',
    tag: `dna-surge-${ticker}`,
  });
};

/**
 * AI 분석 완료 알림
 */
export const sendAnalysisComplete = (ticker: string, verdict: string, score: number) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  new Notification(`🤖 ${ticker} AI 분석 완료`, {
    body: `판정: ${verdict} | DNA 점수: ${score}`,
    icon: '/logo.png',
    tag: `analysis-${ticker}`,
  });
};

/**
 * Internal helper to send notifications
 */
function sendNotification(title: string, options: NotificationOptions): void {
  if (getNotificationPermission() !== 'granted') return;
  
  new Notification(title, {
    icon: '/vite.svg',
    ...options
  });
}

/**
 * Send daily picks notification
 */
export const sendDailyPicksNotification = (count: number, topTicker?: string) => {
  const title = '오늘의 추천 종목 도착';
  const body = topTicker
    ? `오늘 ${count}개의 새로운 추천 종목이 있습니다. ${topTicker}를 확인해 보세요!`
    : `오늘 ${count}개의 새로운 추천 종목이 발견되었습니다.`;

  sendNotification(title, { body, tag: 'daily-picks' });
};

export const sendBuySignalNotification = (ticker: string, dnaScore: number) => {
  sendNotification('강력한 매수 신호 포착', {
    body: `${ticker} 종목의 DNA 점수가 ${dnaScore}점을 기록했습니다. 지금 차트를 확인하세요!`,
    tag: `buy-${ticker}`
  });
};

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
