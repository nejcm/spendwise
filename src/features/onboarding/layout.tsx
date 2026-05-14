import { cn } from 'tailwind-variants';
import { Text, View } from '../../components/ui';
import IntroNav from './Nav';

export interface OnboardingLayoutProps {
  title: string;
  currentStep: number;
  children: React.ReactNode;
  footer: React.ReactNode;
  className?: string;
}

export default function OnboardingLayout({ title, currentStep, children, footer, className }: OnboardingLayoutProps) {
  return (
    <View className="max-h-full flex-1">
      <View className="flex-row items-center justify-center gap-3 p-6">
        <Text className="text-2xl font-bold text-black dark:text-white">
          {title}
        </Text>
      </View>
      <IntroNav current={currentStep} />
      <View className={cn('px-6 pt-12 pb-4', className)}>
        {children}
      </View>
      <View className="mt-auto w-full flex-row items-center gap-2 px-6 pt-4 pb-6">
        {footer}
      </View>
    </View>
  );
}
