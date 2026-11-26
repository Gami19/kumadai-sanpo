import { Image } from 'expo-image';
import { StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native';

import { thumbColor, thumbSepia } from '@/features/thumbs/sources';
import { theme } from '@/theme/tokens';

type Props = {
  id: string;
  /** 未訪問。色を落としたセピアを出す。 */
  sepia?: boolean;
  style?: StyleProp<ImageStyle>;
  label?: string;
};

export function MapThumb({ id, sepia = false, style, label }: Props) {
  const table = sepia ? thumbSepia : thumbColor;
  const source = id in table ? table[id as keyof typeof table] : null;
  if (source == null) {
    return <View style={[styles.fallback, style]} />;
  }
  return (
    <Image
      source={source}
      style={[styles.image, style]}
      contentFit="cover"
      accessibilityLabel={label}
      accessible={label != null}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    backgroundColor: theme.color.path,
  },
  fallback: {
    width: '100%',
    backgroundColor: theme.color.path,
  },
});
