import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';

import { FocusAwareStatusBar, View } from '@/components/ui';
import { useImportBackup } from '@/features/imports-export/hooks';
import { storage } from '@/lib/storage';
import { setIsFirstTime } from '@/lib/store/store';
import AccountStep from './Account';
import { OnboardingDirectionContext } from './direction-context';
import PrefsStep from './Prefs';
import ProfileStep from './Profile';
import ReadyStep from './Ready';
import WelcomeStep from './Welcome';

// Changing the language reloads the app; this one-shot key brings the user back to Prefs.
const RESUME_STEP_KEY = 'onboarding.resumeStep';

export function OnboardingScreen() {
  const [step, setStep] = useState(() => storage.getNumber(RESUME_STEP_KEY) ?? 0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const router = useRouter();
  const importBackup = useImportBackup();

  React.useEffect(() => {
    storage.remove(RESUME_STEP_KEY);
  }, []);

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const finish = (href: '/' | '/settings/import-export' = '/') => {
    setIsFirstTime(false);
    router.replace(href);
  };

  const restore = () => importBackup.mutate(undefined, {
    onSuccess: (restored) => {
      if (restored) finish();
    },
  });

  return (
    <OnboardingDirectionContext value={direction}>
      <View className="flex-1">
        <FocusAwareStatusBar />
        {step === 0 && <WelcomeStep onNext={() => goTo(1)} onRestore={restore} restoring={importBackup.isPending} />}
        {step === 1 && <ProfileStep onBack={() => goTo(0)} onNext={() => goTo(2)} />}
        {step === 2 && (
          <PrefsStep
            onBack={() => goTo(1)}
            onNext={() => goTo(3)}
            onBeforeLanguageReload={() => storage.set(RESUME_STEP_KEY, 2)}
          />
        )}
        {step === 3 && <AccountStep onBack={() => goTo(2)} onNext={() => goTo(4)} />}
        {step === 4 && <ReadyStep onBack={() => goTo(3)} onFinish={() => finish()} onImportCsv={() => finish('/settings/import-export')} />}
      </View>
    </OnboardingDirectionContext>
  );
}
