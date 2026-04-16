import type { Router } from 'expo-router';
import { useRouter } from 'expo-router';
import { goBackOrFallback } from '@/lib/routing';
import { ArrowLeftIcon, IconButton, Text, View } from './ui';

export type ScreenHeaderProps = {
  title: string;
  back?: boolean;
  /** Used when there is no navigation history (e.g. deep link); avoids unhandled GO_BACK. */
  backHref?: Parameters<Router['replace']>[0];
  children?: React.ReactNode;
};

export default function ScreenHeader({
  title,
  back = true,
  backHref = '/settings',
  children,
}: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View className="w-full flex-row items-center justify-start gap-1 border-b border-border bg-muted px-4 dark:bg-gray-900">
      {back && (
        <IconButton color="none" onPress={() => goBackOrFallback(router, backHref)}>
          <ArrowLeftIcon className="text-muted-foreground" size={20} />
        </IconButton>
      )}
      <Text className="py-3 text-center text-lg font-medium text-foreground">{title}</Text>
      {children}
    </View>
  );
}
