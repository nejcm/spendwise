import type { LoginFormProps } from './components/login-form';
import { useRouter } from 'expo-router';

import * as React from 'react';
import { FocusAwareStatusBar } from '@/components/ui';
import { LoginForm } from './components/login-form';
import { signIn } from './use-auth-store';

export function LoginScreen() {
  const router = useRouter();

  const onSubmit: LoginFormProps['onSubmit'] = (_data) => {
    signIn({ access: 'access-token', refresh: 'refresh-token' });
    router.push('/');
  };

  return (
    <>
      <FocusAwareStatusBar />
      <LoginForm onSubmit={onSubmit} />
    </>
  );
}
