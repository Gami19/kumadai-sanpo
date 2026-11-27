import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { MasteryStamp } from '@/components/stamp/MasteryStamp';
import { campuses, type CampusId } from '@/features/map/campuses';
import type { Building } from '@/lib/content/buildings';
import { campusBuildings } from '@/lib/notebook/districts';
import { theme } from '@/theme/tokens';

const SEAL = 88;

type Props = {
  buildings: readonly Building[];
  stampedIds: ReadonlySet<string>;
  onOpenDistrict: (campusId: CampusId) => void;
  onOpenFull: () => void;
};

/** 建物印とは別の『制覇の印』欄。 */
export function MasterySection({ buildings, stampedIds, onOpenDistrict, onOpenFull }: Props) {
  const totalBuildings = buildings.length;
  const stampedCount = buildings.filter((building) => stampedIds.has(building.id)).length;
  const fullDone = totalBuildings > 0 && stampedCount === totalBuildings;

  return (
    <View style={styles.wrap}>
      <Text style={styles.section}>制覇の印</Text>
      <View style={styles.list}>
        {campuses.map((campus) => {
          const group = campusBuildings(buildings, campus.id);
          const got = group.filter((building) => stampedIds.has(building.id)).length;
          const total = group.length;
          const done = total > 0 && got === total;
          const remaining = group.filter((building) => !stampedIds.has(building.id));
          const left = total - got;
          return (
            <Pressable
              key={campus.id}
              accessibilityRole="button"
              accessibilityLabel={
                done
                  ? `${campus.label}制覇。${got}/${total}`
                  : `${campus.label}制覇はまだ。${got}/${total}。あと${left}件`
              }
              onPress={() => {
                onOpenDistrict(campus.id);
              }}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <View style={styles.copy}>
                <Text style={styles.title}>{campus.label} 制覇</Text>
                <Text style={styles.progress}>
                  {got}/{total}
                </Text>
                {done ? (
                  <Text style={styles.done}>そろいました</Text>
                ) : (
                  <Text style={styles.remain} numberOfLines={2}>
                    あと{left}件
                    {remaining.length > 0 ? `：${remaining.map((item) => item.name).join('、')}` : ''}
                  </Text>
                )}
              </View>
              <View style={styles.seal}>
                {done ? (
                  <MasteryStamp campusId={campus.id} size={SEAL} />
                ) : (
                  <View style={styles.lockPad}>
                    <Icon name="lock" size={22} color={theme.color.inkMuted} />
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            fullDone
              ? `全制覇。${stampedCount}/${totalBuildings}`
              : `全制覇はまだ。${stampedCount}/${totalBuildings}`
          }
          onPress={onOpenFull}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <View style={styles.copy}>
            <Text style={styles.title}>全制覇</Text>
            <Text style={styles.progress}>
              {stampedCount}/{totalBuildings}
            </Text>
            {fullDone ? (
              <Text style={styles.done}>{totalBuildings}件すべてそろいました</Text>
            ) : (
              <Text style={styles.remain}>あと{Math.max(0, totalBuildings - stampedCount)}件</Text>
            )}
          </View>
          <View style={styles.seal}>
            {fullDone ? (
              <MasteryStamp size={SEAL} />
            ) : (
              <View style={styles.lockPad}>
                <Icon name="lock" size={22} color={theme.color.inkMuted} />
              </View>
            )}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: theme.space.lg,
    gap: theme.space.sm,
  },
  section: {
    color: theme.color.leafDark,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
  list: {
    gap: theme.space.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    minHeight: theme.hit + theme.space.lg,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    backgroundColor: theme.color.white,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: theme.color.ink,
    fontFamily: theme.font.heading,
    fontSize: theme.font.body,
  },
  progress: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
    fontVariant: ['tabular-nums'],
  },
  done: {
    color: theme.color.shikon,
    fontSize: theme.font.caption,
    fontWeight: '700',
  },
  remain: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
  },
  seal: {
    width: SEAL,
    height: SEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockPad: {
    width: SEAL * 0.78,
    height: SEAL * 0.78,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
});
