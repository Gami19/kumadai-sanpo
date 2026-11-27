import { StyleSheet, Text, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { Icon, type IconName } from '@/components/Icon';
import { theme } from '@/theme/tokens';

import { FRAME_INNER, FRAME_OUTER, framePath, STAMP_BOX, type FrameKind } from './geometry';
import { StampLanding } from './StampLanding';

type Props = {
  frame: FrameKind;
  size: number;
  /** ready は押せる空欄。blocked はまだ押せない。 */
  tone: 'ready' | 'blocked';
  icon?: IconName | null;
  caption?: string | null;
};

const STROKE = 1.7;

/** 押す前の枠。区画の形を先に見せ、押せない理由はアイコンと短い文字で足す。 */
export function StampBlank({ frame, size, tone, icon = null, caption = null }: Props) {
  const color = tone === 'ready' ? theme.color.vermilion : theme.color.inkMuted;
  const showCaption = caption != null && caption.length > 0 && size >= 72;
  const iconSize = Math.max(14, Math.round(size * 0.16));
  return (
    <StampLanding size={size} pad={false}>
      <View style={{ width: size, height: size }} accessible={false}>
        <Svg width={size} height={size} viewBox={`0 0 ${STAMP_BOX} ${STAMP_BOX}`}>
          <Path
            d={framePath(frame, FRAME_OUTER)}
            fill={theme.color.paper}
            stroke={color}
            strokeWidth={STROKE}
            strokeDasharray="2.6 1.8"
          />
          <Path
            d={framePath(frame, FRAME_INNER)}
            fill="none"
            stroke={color}
            strokeWidth={1}
            strokeDasharray="2 1.6"
          />
        </Svg>
        {icon != null || showCaption ? (
          <View pointerEvents="none" style={styles.fore}>
            {icon != null ? <Icon name={icon} size={iconSize} color={theme.color.ink} /> : null}
            {showCaption ? (
              <Text style={styles.caption} maxFontSizeMultiplier={1.3} numberOfLines={1}>
                {caption}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </StampLanding>
  );
}

const styles = StyleSheet.create({
  fore: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.xs,
  },
  caption: {
    color: theme.color.ink,
    fontSize: theme.font.caption,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
});
