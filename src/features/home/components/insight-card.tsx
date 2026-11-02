import { useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { OutlineButton, SolidButton, Text } from '@/components/ui';
import { Sparkle } from '@/components/ui/icon';
import { setAiDraftQuestion } from '@/features/ai/store';
import { getRecommendationCopy } from '@/features/recommendations/helpers';
import { useVisibleRecommendations } from '@/features/recommendations/hooks';
import { translate } from '@/lib/i18n';
import { selectIsAiFeatureOn, useAppStore } from '@/lib/store/store';

export function InsightCard() {
  const recommendationsEnabled = useAppStore.use.recommendationsEnabled();
  const isAiEnabled = useAppStore(selectIsAiFeatureOn('insights'));
  if (!recommendationsEnabled || !isAiEnabled) return null;
  return <InsightCardBody />;
}

function InsightCardBody() {
  const router = useRouter();
  const currency = useAppStore.use.currency();
  const isChatOn = useAppStore(selectIsAiFeatureOn('chat'));
  const { recommendations, dismiss } = useVisibleRecommendations();
  const recommendation = recommendations[0];
  if (!recommendation) return null;

  return (
    <View className="mt-6 gap-2.5 rounded-card border border-accent-line bg-accent-soft px-5 py-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="size-5 items-center justify-center rounded-full bg-primary">
            <Sparkle size={11} strokeWidth={2.5} colorClassName="accent-primary-foreground" />
          </View>
          <Text className="text-meta font-semibold">{translate('home.insight.title')}</Text>
          <Text className="text-meta text-muted-foreground">{`· ${translate('home.insight.label')}`}</Text>
        </View>
        <Text className="text-xs text-muted-foreground">{translate('home.insight.now')}</Text>
      </View>
      <Text className="text-row/snug">{getRecommendationCopy(recommendation, currency).summary}</Text>
      <View className="flex-row gap-2 pt-0.5">
        {isChatOn && (
          <SolidButton
            size="xs"
            color="primary"
            className="h-9 px-4"
            textClassName="text-meta font-semibold"
            label={translate('home.insight.ask')}
            onPress={() => {
              setAiDraftQuestion(recommendation.question);
              router.push('/ai');
            }}
          />
        )}
        <OutlineButton
          size="xs"
          color="default"
          className="h-9 border-accent-line px-4"
          textClassName="text-meta font-medium"
          label={translate('home.insight.dismiss')}
          onPress={() => dismiss(recommendation.id)}
        />
      </View>
    </View>
  );
}
