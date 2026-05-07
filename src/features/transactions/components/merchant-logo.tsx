import * as React from 'react';
import { Path } from 'react-native-svg';
import { cn } from 'tailwind-variants';
import { StyledSvg, View } from '@/components/ui';
import { hexWithOpacity } from '@/lib/theme/colors';
import { getIconBySlug } from '../merchant-logo/infer';

export type MerchantLogoProps = {
  className?: string;
  withBg?: boolean;
  slug: string | null | undefined;
  size?: number;
};

export function MerchantLogo({ slug, size = 26, className, withBg = true }: MerchantLogoProps) {
  const icon = React.useMemo(() => (slug ? getIconBySlug(slug) : undefined), [slug]);
  if (!icon) return null;

  const fill = `#${icon.hex}`;
  const bg = hexWithOpacity(fill, 20);

  const logo = (
    <StyledSvg width={size} height={size} viewBox="0 0 24 24">
      <Path d={icon.path} fill={fill} />
    </StyledSvg>
  );
  if (!withBg) return logo;
  return (
    <View className={cn('size-10 items-center justify-center rounded-lg', className)} style={{ backgroundColor: bg }}>
      {logo}
    </View>
  );
}
