import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenLink } from '@/components/ScreenLink';
import type { Building } from '@/lib/content/buildings';
import type { Person } from '@/lib/content/people';
import { useBuildings } from '@/lib/content/useBuildings';
import { usePeople } from '@/lib/content/usePeople';
import { formatNotebookTime, type FavoriteRecord } from '@/lib/notebook/parse';
import { useNotebook } from '@/lib/notebook/useNotebook';
import { theme } from '@/theme/tokens';

import { BuildingRecordButtons, PersonFavoriteButton } from './RecordControls';

function byRecent(a: FavoriteRecord, b: FavoriteRecord): number {
  return Date.parse(b.savedAt) - Date.parse(a.savedAt);
}

export function NotebookHome() {
  const insets = useSafeAreaInsets();
  const buildings = useBuildings();
  const people = usePeople();
  const notebook = useNotebook();
  const stampedCount = buildings.filter((building) =>
    notebook.stamps.some((stamp) => stamp.buildingId === building.id),
  ).length;
  const favoriteBuildings = notebook.favoriteBuildings
    .filter((record) => buildings.some((building) => building.id === record.id))
    .slice()
    .sort(byRecent);
  const favoritePeople = notebook.favoritePeople
    .filter((record) => people.some((person) => person.id === record.id))
    .slice()
    .sort(byRecent);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + theme.space.lg,
          paddingBottom: insets.bottom + theme.space.xl,
        },
      ]}
    >
      <Text style={styles.title}>さんぽ帳</Text>
      <Text style={styles.lead}>
        訪問スタンプとお気に入りは、この端末の中だけに残します。アカウントはなく、サーバーへは送りません。端末を替えると、記録は移りません。位置情報は保存しません。
      </Text>
      <Text style={styles.lead}>
        スタンプは、建物の詳細か、下の「訪問した」から手で付けます。近くにいるだけで自動では付きません。
      </Text>
      {!notebook.ready ? <Text style={styles.lead}>記録を読み込んでいます。</Text> : null}
      {notebook.loadError ? (
        <Text style={styles.warning}>この端末の記録を読み込めませんでした。</Text>
      ) : null}

      <View style={styles.block}>
        <Text style={styles.section}>訪問スタンプ</Text>
        <Text style={styles.body}>
          {buildings.length}件中{stampedCount}件に、訪問スタンプが付いています。
        </Text>
        {buildings.map((building) => (
          <BuildingStampCard key={building.id} building={building} />
        ))}
      </View>

      <View style={styles.block}>
        <Text style={styles.section}>お気に入りの建物</Text>
        {favoriteBuildings.length === 0 ? (
          <Text style={styles.body}>まだありません。建物の詳細で入れられます。</Text>
        ) : (
          favoriteBuildings.map((record) => {
            const building = buildings.find((item) => item.id === record.id);
            return building == null ? null : (
              <FavoriteBuildingCard key={record.id} building={building} savedAt={record.savedAt} />
            );
          })
        )}
      </View>

      <View style={styles.block}>
        <Text style={styles.section}>お気に入りの人物</Text>
        {favoritePeople.length === 0 ? (
          <Text style={styles.body}>まだありません。人物の詳細で入れられます。</Text>
        ) : (
          favoritePeople.map((record) => {
            const person = people.find((item) => item.id === record.id);
            return person == null ? null : (
              <FavoritePersonCard key={record.id} person={person} savedAt={record.savedAt} />
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

function BuildingStampCard({ building }: { building: Building }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{building.name}</Text>
      <Text style={styles.meta}>{building.campus}</Text>
      {building.positionEstimated ? (
        <Text style={styles.estimate}>位置は推定です。確定した場所としては扱いません。</Text>
      ) : null}
      <ScreenLink
        href={{ pathname: '/building/[id]', params: { id: building.id } }}
        label="建物の詳細"
        tone="text"
      />
      <BuildingRecordButtons buildingId={building.id} buildingName={building.name} />
    </View>
  );
}

function FavoriteBuildingCard({ building, savedAt }: { building: Building; savedAt: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{building.name}</Text>
      <Text style={styles.meta}>{formatNotebookTime(savedAt)}に追加</Text>
      {building.positionEstimated ? (
        <Text style={styles.estimate}>位置は推定です。確定した場所としては扱いません。</Text>
      ) : null}
      <ScreenLink
        href={{ pathname: '/building/[id]', params: { id: building.id } }}
        label="建物の詳細"
        tone="text"
      />
      <BuildingRecordButtons buildingId={building.id} buildingName={building.name} favoriteOnly />
    </View>
  );
}

function FavoritePersonCard({ person, savedAt }: { person: Person; savedAt: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{person.name}</Text>
      <Text style={styles.meta}>{formatNotebookTime(savedAt)}に追加</Text>
      <ScreenLink
        href={{ pathname: '/people/[id]', params: { id: person.id } }}
        label="人物の詳細"
        tone="text"
      />
      <PersonFavoriteButton personId={person.id} personName={person.name} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.space.lg,
    gap: theme.space.md,
  },
  title: {
    color: theme.color.ink,
    fontSize: theme.font.title,
    fontWeight: '700',
  },
  lead: {
    color: theme.color.inkMuted,
    fontSize: theme.font.body,
    lineHeight: theme.font.body + theme.space.sm,
  },
  warning: {
    color: theme.color.clay,
    fontSize: theme.font.caption,
    lineHeight: theme.font.caption + theme.space.xs,
  },
  block: {
    gap: theme.space.sm,
  },
  section: {
    color: theme.color.moss,
    fontSize: theme.font.caption,
    fontWeight: '700',
  },
  body: {
    color: theme.color.ink,
    fontSize: theme.font.body,
    lineHeight: theme.font.body + theme.space.sm,
  },
  card: {
    backgroundColor: theme.color.card,
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: theme.border.hairline,
    padding: theme.space.md,
    gap: theme.space.sm,
  },
  cardTitle: {
    color: theme.color.ink,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
  meta: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
  },
  estimate: {
    color: theme.color.clay,
    fontSize: theme.font.caption,
    lineHeight: theme.font.caption + theme.space.xs,
  },
});
