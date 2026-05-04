import type { Recommendation } from '../types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, ScrollView } from 'react-native';
import { SolidButton, Text, View } from '@/components/ui';
import { GhostButton } from '@/components/ui/ghost-button';
import { AlertTriangle, Bell, BrainCircuit, Lightbulb, TrendingUp, X } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { SkeletonBox, SkeletonGrid } from '@/components/ui/skeleton';
import { setAiDraftQuestion } from '@/features/ai/store';
import { translate } from '@/lib/i18n';
import { selectIsAiEnabled, useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import { getRecommendationCopy } from '../helpers';
import { useVisibleRecommendations } from '../hooks';

function RecommendationIcon({ kind }: { kind: Recommendation['kind'] }) {
  switch (kind) {
    case 'upcoming_cashflow':
      return <AlertTriangle size={20} className="text-warning-600" />;
    case 'subscription_reminder':
      return <Bell size={20} className="text-primary" />;
    case 'category_anomaly':
    case 'unusual_spending':
      return <TrendingUp size={20} className="text-danger-500" />;
    case 'budget_suggestion':
    default:
      return <Lightbulb size={20} className="text-success-600" />;
  }
}

function navigateToTarget(router: ReturnType<typeof useRouter>, target: Recommendation['primaryTarget']) {
  switch (target) {
    case 'accounts':
      router.push('/accounts');
      break;
    case 'categories':
      router.push('/categories');
      break;
    case 'scheduled':
      router.push('/scheduled');
      break;
    case 'stats':
      router.push('/stats');
      break;
    case 'transactions':
    default:
      router.push('/transactions');
      break;
  }
}

function getRecommendationCardGradient(kind: Recommendation['kind']) {
  switch (kind) {
    case 'upcoming_cashflow':
      return `from-warning-500/18 dark:from-warning-500/15 bg-linear-to-br to-warning-500/3 dark:to-warning-500/1`;
    case 'subscription_reminder':
      return `from-primary/18 dark:from-primary/15 bg-linear-to-br to-primary/3 dark:to-primary/1`;
    case 'category_anomaly':
    case 'unusual_spending':
      return `from-danger-500/18 dark:from-danger-500/15 bg-linear-to-br to-danger-500/3 dark:to-danger-500/1`;
    case 'budget_suggestion':
    default:
      return `from-success-500/18 dark:from-success-500/15 bg-linear-to-br to-success-500/3 dark:to-success-500/1`;
  }
}

function RecommendationCard({
  recommendation,
  onDismiss,
}: {
  recommendation: Recommendation;
  onDismiss: (id: string) => void;
}) {
  const router = useRouter();
  const currency = useAppStore.use.currency();
  const isAiEnabled = useAppStore(selectIsAiEnabled);
  const copy = getRecommendationCopy(recommendation, currency);

  return (
    <View className={`w-[280] rounded-2xl border border-border/60 p-3 2xs:w-[320] ${getRecommendationCardGradient(recommendation.kind)}`}>
      <View className="mb-2 flex-row items-start justify-between gap-2">
        <View className="flex-1 flex-row items-center gap-3">
          <RecommendationIcon kind={recommendation.kind} />
          <View className="min-w-0 flex-1">
            <Text className="mb-0.5 text-sm/tight font-medium text-foreground">{copy.title}</Text>
            <Text className="text-xs/snug font-medium tracking-[0.03rem] text-muted-foreground uppercase">
              {translate(`recommendations.severity.${recommendation.severity}` as const)}
              {' '}
              <Text className="text-xs/snug font-medium tracking-[0.03rem] text-muted-foreground uppercase"></Text>
            </Text>
          </View>
        </View>
        <IconButton size="xs" color="none" onPress={() => onDismiss(recommendation.id)} className="size-6 self-start rounded-full bg-black/15 px-0">
          <X size={16} colorClassName="accent-muted-foreground" />
        </IconButton>
      </View>

      <Text className="mb-3 text-xs/snug text-muted-foreground">{copy.summary}</Text>

      <View className="mt-auto flex-row flex-wrap items-center gap-1">
        <SolidButton
          size="xs"
          color="secondary"
          className="rounded-full bg-black/10 px-3 dark:bg-black/25"
          textClassName="text-foreground"
          label={copy.actionLabel}
          onPress={() => navigateToTarget(router, recommendation.primaryTarget)}
        />
        {isAiEnabled && (
          <GhostButton
            size="xs"
            className="px-3"
            iconLeft={<BrainCircuit size={15} className="mr-1.5" colorClassName="accent-primary" />}
            label={copy.askAiLabel}
            onPress={() => {
              setAiDraftQuestion(recommendation.question);
              router.push('/ai');
            }}
          />
        )}
      </View>
    </View>
  );
}

function HomeRecommendationsBody() {
  const { recommendations, isLoading, dismiss } = useVisibleRecommendations();

  if (isLoading) {
    return (
      <View className="gap-2">
        <SkeletonBox height={26} width={120} />
        <SkeletonGrid rows={1} cols={2} heights={[140, 140]} />
      </View>
    );
  }

  if (recommendations.length === 0) return null;
  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between gap-2">
        <Text className="text-lg font-medium">{translate('recommendations.section_title')}</Text>
        <Pressable onPress={() => recommendations.forEach((recommendation) => dismiss(recommendation.id))}>
          <Text className="text-sm text-muted-foreground">{translate('recommendations.dismiss_all')}</Text>
        </Pressable>
      </View>
      <ScrollView style={defaultStyles.transparentBg} horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {recommendations.slice(0, 4).map((recommendation) => (
            <RecommendationCard key={recommendation.id} recommendation={recommendation} onDismiss={dismiss} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export function HomeRecommendations() {
  const recommendationsEnabled = useAppStore.use.recommendationsEnabled();
  if (!recommendationsEnabled) return null;
  return <HomeRecommendationsBody />;
}
