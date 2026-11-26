import { NativeTabs } from 'expo-router/native-tabs';

import { theme } from '@/theme/tokens';

const screenBackground = { backgroundColor: theme.color.paper };

export default function TabLayout() {
  return (
    <NativeTabs tintColor={theme.color.moss}>
      <NativeTabs.Trigger name="index" disableAutomaticContentInsets contentStyle={screenBackground}>
        <NativeTabs.Trigger.Label>ホーム</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="map" disableAutomaticContentInsets contentStyle={screenBackground}>
        <NativeTabs.Trigger.Label>マップ</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'map', selected: 'map.fill' }} md="map" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="building" disableAutomaticContentInsets contentStyle={screenBackground}>
        <NativeTabs.Trigger.Label>建物</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'building.2', selected: 'building.2.fill' }}
          md="apartment"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="people" disableAutomaticContentInsets contentStyle={screenBackground}>
        <NativeTabs.Trigger.Label>人物</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} md="group" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notebook" disableAutomaticContentInsets contentStyle={screenBackground}>
        <NativeTabs.Trigger.Label>さんぽ帳</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'book.closed', selected: 'book.closed.fill' }}
          md="menu_book"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
