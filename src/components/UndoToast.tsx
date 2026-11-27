import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptics } from '@/lib/haptics';
import { theme } from '@/theme/tokens';

import { Icon } from './Icon';

const DISMISS_MS = 4000;

type Toast = {
  id: number;
  message: string;
  undo?: () => Promise<void>;
};

type ShowToast = (message: string, undo?: () => Promise<void>) => void;

const UndoContext = createContext<ShowToast>(() => {});

export function useUndoToast(): ShowToast {
  return use(UndoContext);
}

export function UndoProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const show = useCallback<ShowToast>((message, undo) => {
    setToast({ id: Date.now(), message, undo });
  }, []);
  const dismiss = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <UndoContext value={show}>
      {children}
      {toast != null ? <UndoBanner key={toast.id} toast={toast} onClose={dismiss} /> : null}
    </UndoContext>
  );
}

function UndoBanner({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const timer = setTimeout(onClose, DISMISS_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.wrap, { bottom: insets.bottom + theme.space.xl + theme.space.lg }]}
    >
      <Text style={styles.message}>{toast.message}</Text>
      {toast.undo != null ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="取り消す"
          onPress={() => {
            haptics.select();
            const undo = toast.undo;
            onClose();
            if (undo != null) {
              void undo();
            }
          }}
          style={({ pressed }) => [styles.undo, pressed && styles.undoPressed]}
        >
          <Icon name="arrow.uturn.backward" size={16} color={theme.color.leafDark} />
          <Text style={styles.undoLabel}>取り消す</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: theme.space.md,
    right: theme.space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    minHeight: theme.hit,
    paddingLeft: theme.space.md,
    paddingRight: theme.space.xs,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    backgroundColor: theme.color.white,
  },
  message: {
    flex: 1,
    color: theme.color.ink,
    fontSize: theme.font.body,
  },
  undo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xs,
    minHeight: theme.hit,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.sm,
    borderCurve: 'continuous',
  },
  undoPressed: {
    backgroundColor: theme.color.press,
  },
  undoLabel: {
    color: theme.color.leafDark,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
});
