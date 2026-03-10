/* eslint-disable react-refresh/only-export-components */
import type { SvgProps } from 'react-native-svg';
import {
  Bell,
  ChartPie,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Github as GithubIcon,
  Globe,
  HandHeart,
  House,
  Languages,
  Plus,
  Receipt,
  Settings as SettingsIcon,
  Share2,
  Star,
  User,
  Wallet as WalletIcon,
} from 'lucide-react-native';
import * as React from 'react';
import { StyleSheet } from 'react-native';

import colors from '@/components/ui/colors';
import { isRTL } from '@/lib/i18n';

type IconProps = SvgProps & {
  size?: number | string;
  absoluteStrokeWidth?: boolean;
};

type IconComponent = React.ComponentType<IconProps>;

function withDefaults(Icon: IconComponent, defaults: IconProps) {
  return function WrappedIcon({
    color = defaults.color,
    size = defaults.size,
    strokeWidth = defaults.strokeWidth,
    ...props
  }: IconProps) {
    return <Icon color={color} size={size} strokeWidth={strokeWidth} {...props} />;
  };
}

export function ArrowRight({
  color = '#CCC',
  size = 16,
  strokeWidth = 2.25,
  style,
  ...props
}: IconProps) {
  return (
    <ChevronRight
      color={color}
      size={size}
      strokeWidth={strokeWidth}
      {...props}
      style={StyleSheet.flatten([
        style,
        {
          transform: [{ scaleX: isRTL ? -1 : 1 }],
        },
      ])}
    />
  );
}

export const ArrowLeft = withDefaults(ChevronLeft, { color: '#CCC', size: 16, strokeWidth: 2.25 });
export const CaretDown = withDefaults(ChevronDown, { color: colors.black, size: 16, strokeWidth: 2 });
export const Github = withDefaults(GithubIcon, { color: colors.neutral[500], size: 24, strokeWidth: 1.75 });
export const Home = withDefaults(House, { color: colors.black, size: 24, strokeWidth: 2 });
export const Language = withDefaults(Languages, { color: colors.black, size: 24, strokeWidth: 2 });
export const PieChart = withDefaults(ChartPie, { color: colors.black, size: 24, strokeWidth: 2 });
export const Rate = withDefaults(Star, { color: colors.neutral[500], size: 24, strokeWidth: 1.75 });
export const Settings = withDefaults(SettingsIcon, { color: colors.black, size: 24, strokeWidth: 2 });
export const Share = withDefaults(Share2, { color: colors.neutral[500], size: 24, strokeWidth: 1.75 });
export const Support = withDefaults(HandHeart, { color: colors.neutral[500], size: 24, strokeWidth: 1.75 });
export const Wallet = withDefaults(WalletIcon, { color: colors.black, size: 24, strokeWidth: 2 });
export const Website = withDefaults(Globe, { color: colors.neutral[500], size: 24, strokeWidth: 1.75 });
export const ReceiptIcon = withDefaults(Receipt, { color: colors.black, size: 24, strokeWidth: 2 });
export { ReceiptIcon as Receipt };
export const BellIcon = withDefaults(Bell, { color: colors.black, size: 24, strokeWidth: 2 });
export const UserIcon = withDefaults(User, { color: colors.black, size: 24, strokeWidth: 2 });
export const PlusIcon = withDefaults(Plus, { color: colors.white, size: 28, strokeWidth: 2 });
