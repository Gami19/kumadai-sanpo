import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { ScreenLink } from '@/components/ScreenLink';

export default function HomeScreen() {
  return (
    <PlaceholderScreen
      title="熊大さんぽ"
      lead="熊本大学の歴史的建造物と、ゆかりの人物を歩きながら知るアプリです。下のタブか、次のリンクから各画面へ移動できます。"
    >
      <ScreenLink href="/map" label="絵本マップ" />
      <ScreenLink href="/building" label="建物のクイズ" />
      <ScreenLink href="/people" label="人物" />
      <ScreenLink href="/notebook" label="さんぽ帳" />
    </PlaceholderScreen>
  );
}
