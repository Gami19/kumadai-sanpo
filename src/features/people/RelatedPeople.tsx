import { StyleSheet, Text, View } from 'react-native';

import { ScreenLink } from '@/components/ScreenLink';
import { usePeople } from '@/lib/content/usePeople';
import { theme } from '@/theme/tokens';

type Props = {
  personIds: readonly string[];
};

export function RelatedPeople({ personIds }: Props) {
  const people = usePeople();
  const linked = personIds.flatMap((id) => {
    const person = people.find((item) => item.id === id);
    return person == null ? [] : [person];
  });

  return (
    <View style={styles.block}>
      <Text style={styles.section}>ゆかりの人物</Text>
      {personIds.length === 0 ? (
        <Text style={styles.body}>この地点に結びつけた人物は、いまの内容にはありません。</Text>
      ) : null}
      {personIds.length > 0 && linked.length === 0 ? (
        <Text style={styles.body}>結びつけてあった人物が、いまの内容に見当たりません。</Text>
      ) : null}
      {linked.map((person) => (
        <ScreenLink
          key={person.id}
          href={{ pathname: '/people/[id]', params: { id: person.id } }}
          label={person.name}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
