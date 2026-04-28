import type { Tag, TagFormData } from './types';
import { useForm } from '@tanstack/react-form';
import { View } from 'react-native';
import * as z from 'zod';

import ColorSelector, { DEFAULT_COLOR } from '@/components/color-selector';
import { Alert, Input, SolidButton, Text } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { OutlineButton } from '@/components/ui/outline-button';
import { translate } from '@/lib/i18n';
import { useCreateTag, useDeleteTag, useUpdateTag } from './hooks';

const schema = z.object({
  name: z.string().min(1, translate('tags.name_required')),
  color: z.string(),
});

const defaultValues: TagFormData = {
  name: '',
  color: DEFAULT_COLOR,
};

type Props = {
  tag?: Tag;
  onSuccess: () => void;
  onCancel: () => void;
};

export function TagForm({ tag, onSuccess }: Props) {
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const form = useForm({
    defaultValues: tag
      ? { name: tag.name, color: tag.color }
      : defaultValues,
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      if (tag) {
        await updateTag.mutateAsync({ id: tag.id, data: value });
      }
      else {
        await createTag.mutateAsync(value);
      }
      onSuccess();
    },
  });

  const handleDelete = () => {
    if (!tag) return;
    Alert.alert(
      translate('common.delete'),
      translate('tags.delete_confirm', { name: tag.name } as never),
      [
        { text: translate('common.cancel'), style: 'cancel' },
        {
          text: translate('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteTag.mutateAsync(tag.id);
            onSuccess();
          },
        },
      ],
    );
  };

  const isPending = createTag.isPending || updateTag.isPending || deleteTag.isPending;

  return (
    <View className="gap-4 px-4 pt-2 pb-8">
      <form.Field
        name="name"
        children={(field) => (
          <View>
            <Input
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              placeholder={translate('tags.name_placeholder')}
              autoFocus={!tag}
              size="lg"
            />
            {getFieldError(field) && (
              <Text className="mt-1 text-sm text-danger-500">{getFieldError(field)}</Text>
            )}
          </View>
        )}
      />

      <form.Field
        name="color"
        children={(field) => (
          <ColorSelector
            value={field.state.value}
            onSelect={(value) => field.handleChange(String(value))}
            label={translate('tags.color')}
          />
        )}
      />

      <View className="flex-row gap-3 pt-2">
        {tag && (
          <OutlineButton
            label={translate('common.delete')}
            color="danger"
            onPress={handleDelete}
            loading={deleteTag.isPending}
            className="flex-1"
          />
        )}
        <SolidButton
          label={translate('common.save')}
          color="primary"
          onPress={form.handleSubmit}
          loading={isPending}
          className="flex-1"
        />
      </View>
    </View>
  );
}
