import type { HostInstance, TextInput } from 'react-native';
import type { TransactionFormApi } from '../hooks/form';
import type { OptionType } from '@/components/ui';
import type { Account } from '@/features/accounts/types';
import type { Category } from '@/features/categories/types';
import { useStore } from '@tanstack/react-form';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Card, Chip, FilterChip, FlagCircle, Input, ListRow, Options, Text, useModalSheet } from '@/components/ui';
import { DateInput } from '@/components/ui/date-input';
import { getFieldError } from '@/components/ui/form-utils';
import { ChevronDown, ChevronRight, CircleAlert } from '@/components/ui/icon';
import { useCategories } from '@/features/categories/api';
import { CategoryPicker } from '@/features/categories/category-picker';
import { CURRENCIES_MAP } from '@/features/currencies';
import { CurrencySheet } from '@/features/currencies/components/currency-sheet';
import { formatDate } from '@/features/formatting/helpers';
import { useTagNames } from '@/features/transactions/api';
import { categoryTiles, MAX_TAG_LENGTH, MAX_TAGS, normalizeTag, tagKey } from '@/features/transactions/helpers';
import { cn } from '@/lib/cn';
import { dateToUnix, isValidISODate } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { easeOut } from '@/lib/theme/motion';
import { FieldNodesContext } from '../hooks/form';

const CATEGORY_TILE_LIMIT = 8;
const TAG_SUGGESTION_LIMIT = 8;
const rowInputClassName = 'h-12 min-w-[140px] rounded-none border-0 bg-transparent px-0 text-right text-row';
function rowClassName(first = false) {
  return cn('min-h-13.5 py-0', !first && 'border-t border-border');
}

const errorEntering = FadeIn.duration(150).easing(easeOut);
const errorExiting = FadeOut.duration(120);

function AnimatedError({ message, children }: { message?: string; children: React.ReactNode }) {
  if (!message) return null;
  return <Animated.View entering={errorEntering} exiting={errorExiting}>{children}</Animated.View>;
}

function FieldError({ message }: { message?: string }) {
  return (
    <AnimatedError message={message}>
      <View className="flex-row items-center justify-center gap-1.5 pt-2">
        <CircleAlert size={15} colorClassName="accent-negative" />
        <Text className="text-sm font-medium text-negative">{message}</Text>
      </View>
    </AnimatedError>
  );
}

function useFieldNode(name?: string) {
  const register = React.use(FieldNodesContext);
  return React.useCallback((node: HostInstance | null) => {
    if (register && name) register(name, node);
  }, [register, name]);
}

// Field errors wait for the first save attempt; form-level onChange validation would flag untouched fields on a type switch.
const selectSubmitted = (s: { submissionAttempts: number }) => s.submissionAttempts > 0;

export function RowError({ message }: { message?: string }) {
  return <AnimatedError message={message}><Text className="text-meta text-negative">{message}</Text></AnimatedError>;
}

export function RowLabel({ children }: { children: string }) {
  return <Text className="text-row text-muted-foreground">{children}</Text>;
}

export function AmountField({ form, amountRef, signed = false }: {
  form: TransactionFormApi;
  amountRef: React.RefObject<TextInput | null>;
  /** Shows a sign toggle, for an opening balance. */
  signed?: boolean;
}) {
  const currencyModal = useModalSheet();
  const submitted = useStore(form.store, selectSubmitted);
  return (
    <form.Field
      name="currency"
      children={(currencyField) => (
        <View className="items-center pt-8 pb-6">
          <form.Field
            name="amount"
            children={(field) => {
              const error = submitted ? getFieldError(field) : undefined;
              return (
                <>
                  <View className="max-w-full flex-row items-baseline justify-center gap-2 px-5">
                    {signed && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={translate('transactions.form.toggle_sign')}
                        onPress={() => field.handleChange(field.state.value.startsWith('-') ? field.state.value.slice(1) : `-${field.state.value}`)}
                        hitSlop={8}
                      >
                        <Text className="text-3xl font-semibold text-muted-foreground">±</Text>
                      </Pressable>
                    )}
                    <Text className="text-3xl font-semibold text-muted-foreground">{CURRENCIES_MAP[currencyField.state.value].symbol}</Text>
                    <Input
                      ref={amountRef}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChangeText={field.handleChange}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      testID="amount-input"
                      accessibilityLabel={translate('transactions.amount')}
                      accessibilityHint={error}
                      autoFocus={!form.getFieldValue('amount')}
                      containerClassName="min-w-[120px] shrink"
                      className="h-auto rounded-none border-0 bg-transparent px-0 text-6xl font-bold tracking-tighter tabular-nums web:field-sizing-content"
                    />
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={translate('common.currency')}
                    onPress={currencyModal.present}
                    className="mt-2 h-8.5 flex-row items-center gap-1.5 rounded-full bg-card pr-2.5 pl-1.25"
                  >
                    <FlagCircle currency={currencyField.state.value} size={24} />
                    <Text className="text-[13px] font-semibold">{currencyField.state.value}</Text>
                    <ChevronDown size={14} colorClassName="accent-muted-foreground" />
                  </Pressable>
                  <FieldError message={error} />
                </>
              );
            }}
          />
          <CurrencySheet
            ref={currencyModal.ref}
            value={currencyField.state.value}
            stackBehavior="push"
            onSelect={currencyField.handleChange}
          />
        </View>
      )}
    />
  );
}

function CategoryTile({ category, selected, invalid, onPress }: {
  category: Category;
  selected: boolean;
  invalid: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={category.name}
      accessibilityHint={invalid ? translate('transactions.form.category_error') : undefined}
      onPress={onPress}
      className={cn(
        'h-19.5 max-w-28 min-w-19.5 items-center justify-center gap-1 rounded-[18px] border-2 px-2',
        selected ? 'border-foreground bg-card' : invalid ? 'border-negative/40 bg-negative/10' : 'border-transparent bg-card',
      )}
    >
      <Text className="text-[22px]">{category.icon}</Text>
      <Text numberOfLines={1} className="text-xs font-medium">{category.name}</Text>
    </Pressable>
  );
}

export function CategorySection({ form }: { form: TransactionFormApi }) {
  const type = useStore(form.store, (s) => s.values.type);
  const submitted = useStore(form.store, selectSubmitted);
  const { data: categories = [] } = useCategories(type);
  const fieldNode = useFieldNode('category_id');
  if (type === 'transfer') return null;

  return (
    <form.Field
      name="category_id"
      children={(field) => {
        const error = submitted ? getFieldError(field) : undefined;
        const tiles = categoryTiles(categories, field.state.value, CATEGORY_TILE_LIMIT);
        return (
          <View>
            <View className="flex-row items-center gap-2 px-5 pb-2.5">
              <Text ref={fieldNode} className="text-sm font-semibold">{translate('transactions.category')}</Text>
              <AnimatedError message={error}><Text className="text-sm text-negative">{error}</Text></AnimatedError>
              <CategoryPicker
                type={type}
                selectedId={field.state.value}
                onSelect={(category) => field.handleChange(category.id)}
                containerClassName="ml-auto"
                inputClassName="h-auto border-0 bg-transparent px-0"
                showChevron={false}
                renderSelectedItem={() => <Text className="text-[13px] text-muted-foreground">{translate('transactions.form.all_categories')}</Text>}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-5" accessibilityRole="radiogroup">
              {tiles.map((category) => (
                <CategoryTile
                  key={category.id}
                  category={category}
                  selected={field.state.value === category.id}
                  invalid={!!error}
                  onPress={() => field.handleChange(category.id)}
                />
              ))}
            </ScrollView>
          </View>
        );
      }}
    />
  );
}

export function AccountRow({ name, label, accounts, value, onChange, error, first }: {
  /** Registers the row for scroll-to-error when inside a FieldNodesContext. */
  name?: string;
  label: string;
  first?: boolean;
  accounts: Account[];
  value: string | null;
  onChange: (id: string) => void;
  error?: string;
}) {
  const sheet = useModalSheet();
  const fieldNode = useFieldNode(name);
  const selected = accounts.find((a) => a.id === value);
  const options = React.useMemo(() => accounts.map((a) => ({ value: a.id, label: a.icon ? `${a.icon} ${a.name}` : a.name })), [accounts]);
  return (
    <>
      <ListRow
        ref={fieldNode}
        className={rowClassName(first)}
        title={<RowLabel>{label}</RowLabel>}
        meta={<RowError message={error} />}
        chevron
        onPress={sheet.present}
        trailing={<Text className="max-w-[60%] text-row" numberOfLines={1}>{selected ? `${selected.icon ?? ''} ${selected.name}`.trim() : ''}</Text>}
      />
      <Options
        ref={sheet.ref}
        options={options}
        value={value ?? undefined}
        stackBehavior="push"
        onSelect={(option: OptionType) => {
          sheet.close();
          onChange(String(option.value));
        }}
      />
    </>
  );
}

function TextRow({ name, label, value, placeholder, onChange, onBlur, error, symbol, inputClassName }: {
  name: string;
  symbol?: string;
  inputClassName?: string;
  label: string;
  value: string | null;
  placeholder: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
}) {
  const fieldNode = useFieldNode(name);
  const inputRef = React.useRef<TextInput>(null);
  const currencyFormat = useAppStore.use.currencyFormat();
  return (
    <ListRow
      focusInput={inputRef}
      className={rowClassName()}
      title={<RowLabel>{label}</RowLabel>}
      meta={<RowError message={error} />}
      trailing={(
        <View className="flex-row items-center gap-1">
          {symbol && currencyFormat.endsWith('before') && <Text className="text-row text-muted-foreground">{symbol}</Text>}
          <Input
            ref={(node) => {
              inputRef.current = node;
              fieldNode(node);
            }}
            value={value ?? ''}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            accessibilityLabel={label}
            accessibilityHint={error}
            className={cn(rowInputClassName, inputClassName)}
          />
          {symbol && currencyFormat.endsWith('after') && <Text className="text-row text-muted-foreground">{symbol}</Text>}
        </View>
      )}
    />
  );
}

function TagsRow({ value, onChange, onBlur, error, commitRef }: {
  value: string[];
  onChange: (tags: string[]) => void;
  onBlur: () => void;
  error?: string;
  commitRef: React.Ref<() => void>;
}) {
  const fieldNode = useFieldNode('tags');
  const { data: tagNames = [] } = useTagNames();
  const [text, setText] = React.useState('');
  const chosen = new Set(value.map(tagKey));
  const query = tagKey(normalizeTag(text));
  const suggestions = tagNames.filter((name) => !chosen.has(tagKey(name)) && tagKey(name).includes(query)).slice(0, TAG_SUGGESTION_LIMIT);
  const [tooLong, setTooLong] = React.useState(false);
  const inputRef = React.useRef<TextInput>(null);
  const add = (raw: string) => {
    const tag = normalizeTag(raw);
    setTooLong(tag.length > MAX_TAG_LENGTH);
    if (tag.length > MAX_TAG_LENGTH) return;
    if (tag && !chosen.has(tagKey(tag))) onChange([...value, tag]);
    setText('');
  };
  const addAndKeepFocus = (raw: string) => {
    add(raw);
    inputRef.current?.focus();
  };
  React.useImperativeHandle(commitRef, () => () => add(text));
  return (
    <View ref={fieldNode} className={cn(rowClassName(), 'gap-2.5 py-3.5')}>
      <RowLabel>{translate('transactions.tags')}</RowLabel>
      {value.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {value.map((tag) => <FilterChip key={tagKey(tag)} label={tag} onRemove={() => onChange(value.filter((t) => tagKey(t) !== tagKey(tag)))} />)}
        </View>
      )}
      {value.length < MAX_TAGS && (
        <Input
          ref={inputRef}
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => addAndKeepFocus(text)}
          onBlur={() => {
            add(text);
            onBlur();
          }}
          maxLength={MAX_TAG_LENGTH}
          returnKeyType="done"
          submitBehavior="submit"
          placeholder={translate('transactions.form.add_tag')}
          accessibilityLabel={translate('transactions.form.add_tag')}
          className="h-10 rounded-none border-0 bg-transparent px-0 text-row"
        />
      )}
      {value.length < MAX_TAGS && suggestions.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {suggestions.map((name) => <Chip key={tagKey(name)} label={name} onPress={() => (text ? addAndKeepFocus(name) : add(name))} />)}
        </View>
      )}
      <RowError message={tooLong ? translate('transactions.form.too_long', { max: MAX_TAG_LENGTH }) : error} />
    </View>
  );
}

function AccountRows({ form, accounts }: { form: TransactionFormApi; accounts: Account[] }) {
  return (
    <form.Subscribe
      selector={(s) => ({ type: s.values.type, paired: s.values.type === 'transfer' && s.values.to_account_id !== null, submitted: selectSubmitted(s) })}
      children={({ type, paired, submitted }) => (
        <>
          <form.Field
            name="account_id"
            children={(field) => (
              <AccountRow
                first
                name="account_id"
                label={translate(type === 'income' ? 'transactions.form.to' : type === 'transfer' && !paired ? 'transactions.account' : 'transactions.form.from')}
                accounts={accounts}
                value={field.state.value}
                onChange={field.handleChange}
                error={submitted ? getFieldError(field) : undefined}
              />
            )}
          />
          {paired && (
            <form.Field
              name="to_account_id"
              children={(field) => (
                <AccountRow
                  name="to_account_id"
                  label={translate('transactions.form.to')}
                  accounts={accounts}
                  value={field.state.value}
                  onChange={field.handleChange}
                  error={submitted ? getFieldError(field) : undefined}
                />
              )}
            />
          )}
        </>
      )}
    />
  );
}

export function DetailsCard({ form, accounts, isAdjustment, showBaseAmount, onBaseAmountEdited, commitTagRef }: {
  form: TransactionFormApi;
  accounts: Account[];
  isAdjustment: boolean;
  showBaseAmount: boolean;
  onBaseAmountEdited: () => void;
  commitTagRef: React.Ref<() => void>;
}) {
  const preferredCurrency = useAppStore.use.currency();
  const currencyFormat = useAppStore.use.currencyFormat();
  const baseSymbol = currencyFormat.startsWith('code') ? preferredCurrency : CURRENCIES_MAP[preferredCurrency]?.symbol;
  const [showLocation, setShowLocation] = React.useState(() => !!form.getFieldValue('location'));
  const submitted = useStore(form.store, selectSubmitted);
  const tagItemError = useStore(form.store, (s) => Object.entries(s.fieldMeta).find(([name, meta]) => name.startsWith('tags[') && meta?.errors.length)?.[1]?.errors[0]?.message);
  const dateNode = useFieldNode('date');
  return (
    <>
      <Card className="mx-5 mt-4.5 rounded-card px-4">
        {!isAdjustment && <AccountRows form={form} accounts={accounts} />}
        <form.Field
          name="date"
          children={(field) => (
            <ListRow
              className={rowClassName(isAdjustment)}
              title={<RowLabel>{translate('transactions.form.when')}</RowLabel>}
              meta={<RowError message={submitted ? getFieldError(field) : undefined} />}
              trailing={(
                <View className="flex-row items-center gap-1">
                  <DateInput
                    ref={dateNode}
                    value={field.state.value}
                    onChange={field.handleChange}
                    accessibilityLabel={translate('transactions.form.when')}
                    className={rowInputClassName}
                    displayValue={isValidISODate(field.state.value) ? formatDate(dateToUnix(field.state.value)) : undefined}
                  />
                  <ChevronRight size={18} colorClassName="accent-muted-foreground" />
                </View>
              )}
            />
          )}
        />
        {showBaseAmount && (
          <form.Field
            name="baseAmount"
            children={(field) => (
              <TextRow
                name="baseAmount"
                label={translate('transactions.base_amount')}
                symbol={baseSymbol}
                inputClassName="min-w-0 w-24"
                value={field.state.value}
                placeholder="0.00"
                error={submitted ? getFieldError(field) : undefined}
                onBlur={field.handleBlur}
                onChange={(text) => {
                  onBaseAmountEdited();
                  field.handleChange(text);
                }}
              />
            )}
          />
        )}
        <form.Field
          name="merchant_name"
          children={(field) => (
            <TextRow name="merchant_name" label={translate('transactions.form.merchant')} value={field.state.value} placeholder={translate('common.optional')} onBlur={field.handleBlur} onChange={field.handleChange} error={submitted ? getFieldError(field) : undefined} />
          )}
        />
        <form.Field
          name="note"
          children={(field) => (
            <TextRow name="note" label={translate('transactions.note')} value={field.state.value} placeholder={translate('transactions.form.note_placeholder')} onBlur={field.handleBlur} onChange={field.handleChange} error={submitted ? getFieldError(field) : undefined} />
          )}
        />
        <form.Field
          name="tags"
          children={(field) => (
            <TagsRow
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              error={submitted ? getFieldError(field) ?? tagItemError : undefined}
              commitRef={commitTagRef}
            />
          )}
        />
        {showLocation && (
          <form.Field
            name="location"
            children={(field) => (
              <TextRow name="location" label={translate('transactions.location')} value={field.state.value} placeholder={translate('common.optional')} onBlur={field.handleBlur} onChange={field.handleChange} error={submitted ? getFieldError(field) : undefined} />
            )}
          />
        )}
      </Card>
      {!showLocation && (
        <Pressable accessibilityRole="button" onPress={() => setShowLocation(true)} className="items-center p-3">
          <Text className="text-sm text-muted-foreground">{translate('transactions.form.add_location')}</Text>
        </Pressable>
      )}
    </>
  );
}
