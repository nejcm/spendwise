import { useForm } from '@tanstack/react-form';

import * as React from 'react';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import * as z from 'zod';

import { Input, SolidButton, Text, View } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { translate } from '@/lib/i18n';

const schema = z.object({
  name: z.string().optional(),
  email: z
    .email(translate('auth.email_required')),
  password: z
    .string({
      message: translate('auth.password_required'),
    })
    .min(1, translate('auth.password_required'))
    .min(6, translate('auth.password_min_length')),
});

export type FormType = z.infer<typeof schema>;

export type LoginFormProps = {
  onSubmit?: (data: FormType) => void;
};

export function LoginForm({ onSubmit = () => {} }: LoginFormProps) {
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },

    validators: {
      onChange: schema as any,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={10}>
      <View className="flex-1 justify-center p-4">
        <View className="items-center justify-center">
          <Text testID="form-title" className="pb-6 text-center text-4xl font-bold">
            {translate('auth.sign_in')}
          </Text>

          <Text className="mb-6 max-w-xs text-center text-gray-500">
            {translate('auth.welcome_demo')}
          </Text>
        </View>

        <form.Field
          name="name"
          children={(field) => (
            <Input
              testID="name"
              label={translate('auth.name')}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              error={getFieldError(field)}
            />
          )}
        />

        <form.Field
          name="email"
          children={(field) => (
            <Input
              testID="email-input"
              label={translate('auth.email')}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              error={getFieldError(field)}
            />
          )}
        />

        <form.Field
          name="password"
          children={(field) => (
            <Input
              testID="password-input"
              label={translate('auth.password')}
              placeholder={translate('auth.password_placeholder')}
              secureTextEntry={true}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              error={getFieldError(field)}
            />
          )}
        />

        <form.Subscribe
          selector={(state) => [state.isSubmitting]}
          children={([isSubmitting]) => (
            <SolidButton testID="login-button" label={translate('auth.login')} onPress={form.handleSubmit} loading={isSubmitting} />
          )}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
