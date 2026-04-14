import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';

import { FocusAwareStatusBar, View } from '@/components/ui';
import { setIsFirstTime } from '@/lib/store/store';
import ProfileStep from './Profile';
import SettingsStep from './Settings';
import ThemeStep from './Theme';
import WelcomeStep from './Welcome';

export function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  const onFinish = () => {
    setIsFirstTime(false);
    router.push('/');
  };

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      {step === 0 && <WelcomeStep onNext={() => setStep(1)} currentStep={0} />}
      {step === 1 && <SettingsStep onBack={() => setStep(0)} onNext={() => setStep(2)} currentStep={1} />}
      {step === 2 && <ProfileStep onBack={() => setStep(1)} onNext={() => setStep(3)} currentStep={2} />}
      {step === 3 && <ThemeStep onBack={() => setStep(2)} onNext={onFinish} currentStep={3} />}
    </View>
  );
}
