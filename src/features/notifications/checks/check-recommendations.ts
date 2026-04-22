import type { SQLiteDatabase } from 'expo-sqlite';

import type { NotificationSettings } from '../types';
import { getRecommendationCopy } from '@/features/recommendations/helpers';
import { getRecommendations } from '@/features/recommendations/queries';
import { translate } from '@/lib/i18n';
import { storage } from '@/lib/storage';
import { getAppState } from '@/lib/store/store';
import { send } from '../send';

function recommendationAlertKey(id: string) {
  return `notif.recommendation.${id}`;
}

export async function checkRecommendations(
  db: SQLiteDatabase,
  settings: NotificationSettings,
): Promise<void> {
  if (settings.recommendations !== true) return;

  const appState = getAppState();
  if (!appState.recommendationsEnabled) return;

  const currency = appState.currency;
  const recommendations = await getRecommendations(db);

  const urgentRecommendations = recommendations.filter((recommendation) => (
    recommendation.severity === 'high'
    || recommendation.kind === 'subscription_reminder'
  ));

  for (const recommendation of urgentRecommendations.slice(0, 2)) {
    const key = recommendationAlertKey(recommendation.id);
    if (storage.getString(key) === '1') continue;

    const copy = getRecommendationCopy(recommendation, currency);
    await send(translate('notifications.recommendations_title'), copy.summary);
    storage.set(key, '1');
  }
}
