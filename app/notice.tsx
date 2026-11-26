import { Stack } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { notices } from '@/copy/notices';
import { peekNotice, type NoticeRequest } from '@/lib/sheet/session';
import { theme } from '@/theme/tokens';

function titleFor(request: NoticeRequest | null): string {
  if (request == null) {
    return '説明';
  }
  if (request.kind === 'sources') {
    return '出典';
  }
  return notices[request.id].title;
}

export default function NoticeScreen() {
  const [request] = useState(peekNotice);

  return (
    <>
      <Stack.Screen
        options={{
          title: titleFor(request),
          headerLargeTitleEnabled: false,
          presentation: 'formSheet',
          sheetAllowedDetents: [0.45, 0.9],
          sheetGrabberVisible: true,
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        {request == null ? (
          <Text style={styles.body}>説明を開けませんでした。</Text>
        ) : request.kind === 'info' ? (
          notices[request.id].paragraphs.map((paragraph) => (
            <Text key={paragraph} style={styles.body}>
              {paragraph}
            </Text>
          ))
        ) : (
          <View>
            {request.sources.map((source, index) => (
              <Pressable
                key={source.url}
                accessibilityRole="link"
                accessibilityLabel={`${source.title}を開く`}
                onPress={() => {
                  void Linking.openURL(source.url);
                }}
                style={({ pressed }) => [
                  styles.link,
                  index < request.sources.length - 1 ? styles.separator : null,
                  pressed && styles.pressed,
                ]}
              >
                <Icon name="link" size={18} color={theme.color.leafDark} />
                <Text style={styles.linkLabel}>{source.title}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.space.lg,
    paddingBottom: theme.space.xl,
    gap: theme.space.md,
  },
  body: {
    color: theme.color.ink,
    fontSize: theme.font.body,
    lineHeight: theme.font.body + theme.space.sm,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    minHeight: 44,
    paddingVertical: theme.space.sm,
  },
  separator: {
    borderBottomWidth: theme.border.hairline,
    borderBottomColor: theme.color.separator,
  },
  pressed: {
    backgroundColor: theme.color.press,
  },
  linkLabel: {
    flex: 1,
    color: theme.color.ink,
    fontSize: theme.font.body,
  },
});
