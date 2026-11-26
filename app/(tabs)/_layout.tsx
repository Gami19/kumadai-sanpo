import { NativeTabs } from 'expo-router/native-tabs';

import { theme } from '@/theme/tokens';

const screenBackground = { backgroundColor: theme.color.paper };

export const unstable_settings = {
  anchor: 'map',
};

export default function TabLayout() {
  return (
    <NativeTabs tintColor={theme.color.leafDark}>
      <NativeTabs.Trigger name="map" disableAutomaticContentInsets contentStyle={screenBackground}>
        <NativeTabs.Trigger.Label>地図</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'map', selected: 'map.fill' }} md="map" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="quiz" disableAutomaticContentInsets contentStyle={screenBackground}>
        <NativeTabs.Trigger.Label>クイズ</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'questionmark.bubble', selected: 'questionmark.bubble.fill' }}
          md="quiz"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="people" disableAutomaticContentInsets contentStyle={screenBackground}>
        <NativeTabs.Trigger.Label>人物</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} md="group" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="notebook"
        disableAutomaticContentInsets
        contentStyle={screenBackground}
      >
        <NativeTabs.Trigger.Label>さんぽ帳</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'book.closed', selected: 'book.closed.fill' }}
          md="menu_book"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
