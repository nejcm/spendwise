import { storage } from '@/lib/storage';

const DISMISSED_IDS_KEY = 'recommendations.dismissedIds';

function parseIds(raw: string | undefined) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  }
  catch {
    return [];
  }
}

function saveIds(ids: string[]) {
  storage.set(DISMISSED_IDS_KEY, JSON.stringify(ids.slice(-200)));
}

export function getDismissedRecommendationIds() {
  return parseIds(storage.getString(DISMISSED_IDS_KEY));
}

export function dismissRecommendation(id: string) {
  const ids = getDismissedRecommendationIds();
  if (ids.includes(id)) return;
  saveIds([...ids, id]);
}
