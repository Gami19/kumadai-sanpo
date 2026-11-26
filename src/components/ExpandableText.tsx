import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { theme } from '@/theme/tokens';

type Props = {
  text: string;
  /** 折りたたみ中は出さない本文。続きの中だけ。 */
  more?: readonly string[];
  /** 読み上げ。「説明の続き」の「説明」。 */
  label?: string;
};

/**
 * 見えている本文は2行。開いたあとの高さは動かさない。
 * 行数は非表示の全文と、2行に切った本文の高さを比べて決める。
 */
export function ExpandableText({ text, more = [], label = '説明' }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [width, setWidth] = useState(0);
  const [overflows, setOverflows] = useState(false);
  const fullHeight = useRef(0);
  const clampHeight = useRef(0);
  const extras = more.filter((paragraph) => paragraph.length > 0);

  const noteOverflow = () => {
    if (clampHeight.current > 0 && fullHeight.current > clampHeight.current + 4) {
      setOverflows(true);
    }
  };

  const needsToggle = overflows || extras.length > 0;

  return (
    <View
      style={styles.block}
      onLayout={(event) => {
        const next = Math.round(event.nativeEvent.layout.width);
        setWidth((current) => (current === next ? current : next));
      }}
    >
      {width > 0 ? (
        <View
          pointerEvents="none"
          collapsable={false}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.measure, { width }]}
          onLayout={(event) => {
            fullHeight.current = event.nativeEvent.layout.height;
            noteOverflow();
          }}
        >
          <Text style={styles.body}>{text}</Text>
        </View>
      ) : null}
      <Text
        selectable
        numberOfLines={expanded ? undefined : 2}
        style={styles.body}
        onLayout={(event) => {
          if (expanded) {
            return;
          }
          clampHeight.current = event.nativeEvent.layout.height;
          noteOverflow();
        }}
      >
        {text}
      </Text>
      {expanded
        ? extras.map((paragraph, index) => (
            <Text key={`${index}:${paragraph.slice(0, 24)}`} selectable style={styles.body}>
              {paragraph}
            </Text>
          ))
        : null}
      {needsToggle ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? `${label}を閉じる` : `${label}の続き`}
          onPress={() => {
            haptics.select();
            setExpanded((value) => !value);
          }}
          style={({ pressed }) => [styles.more, pressed && styles.pressed]}
        >
          <Text style={styles.moreLabel}>{expanded ? '閉じる' : '続き'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: theme.space.sm,
  },
  body: {
    color: theme.color.ink,
    fontSize: theme.font.body,
    lineHeight: theme.font.body + theme.space.sm,
  },
  measure: {
    position: 'absolute',
    opacity: 0,
    left: 0,
    top: 0,
  },
  more: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: theme.hit,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.sm,
    borderCurve: 'continuous',
  },
  pressed: {
    backgroundColor: theme.color.press,
  },
  moreLabel: {
    color: theme.color.leafDark,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
});
