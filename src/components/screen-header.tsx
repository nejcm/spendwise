import type { ImperativeRouter } from 'expo-router';
import type { IconButtonProps } from './ui';
import { useRouter } from 'expo-router';
import { goBackOrFallback } from '@/lib/routing';
import { ArrowLeftIcon, IconButton, Text, View } from './ui';

export type ScreenHeaderProps = {
  title: string;
  back?: boolean;
  /** Used when there is no navigation history (e.g. deep link); avoids unhandled GO_BACK. */
  backHref?: Parameters<ImperativeRouter['replace']>[0];
  children?: React.ReactNode;
  prefix?: React.ReactNode;
};

export function BackButton({ size, backHref }: { size?: IconButtonProps['size']; backHref?: ScreenHeaderProps['backHref'] }) {
  const router = useRouter();
  return (
    <IconButton color="none" onPress={() => goBackOrFallback(router, backHref || '/')} size={size}>
      <ArrowLeftIcon className="text-muted-foreground" size={20} />
    </IconButton>
  );
}

export default function ScreenHeader({
  title,
  back = true,
  backHref = '/settings',
  children,
  prefix,
}: ScreenHeaderProps) {
  return (
    <View className="w-full flex-row items-center justify-start gap-1 border-b border-border bg-muted px-4 dark:bg-gray-900">
      {back && <BackButton backHref={backHref} />}
      {prefix}
      <Text className="min-w-0 py-3 text-center text-lg font-medium text-foreground" numberOfLines={1}>{title}</Text>
      {children}
    </View>
  );
}
