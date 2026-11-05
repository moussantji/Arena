/** Barre d'onglets personnalisée : capsule flottante, icônes Ionicons, état actif surligné. */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { theme } from './theme';

const TAB_ICONS: Record<string, { focused: keyof typeof Ionicons.glyphMap; outline: keyof typeof Ionicons.glyphMap }> = {
  Accueil: { focused: 'home', outline: 'home-outline' },
  Bulletin: { focused: 'document-text', outline: 'document-text-outline' },
  Absences: { focused: 'calendar-clear', outline: 'calendar-clear-outline' },
  Finances: { focused: 'wallet', outline: 'wallet-outline' },
  Notes: { focused: 'create', outline: 'create-outline' },
  Appel: { focused: 'megaphone', outline: 'megaphone-outline' },
  Eleves: { focused: 'people', outline: 'people-outline' },
  Parents: { focused: 'people-circle', outline: 'people-circle-outline' },
  Messages: { focused: 'chatbubbles', outline: 'chatbubbles-outline' },
};

export default function PremiumTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        { paddingBottom: Math.max(insets.bottom, 10) + 10 },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.bar} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const focused = state.index === index;
          const icons = TAB_ICONS[route.name] ?? { focused: 'ellipse', outline: 'ellipse-outline' };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? String(label)}
              style={({ pressed }) => [styles.tab, focused && styles.tabActive, pressed && styles.tabPressed]}
            >
              <Ionicons
                name={(focused ? icons.focused : icons.outline) as keyof typeof Ionicons.glyphMap}
                size={21}
                color={focused ? '#cdd8ff' : theme.faint}
              />
              <Text
                style={[styles.label, focused && styles.labelActive]}
                numberOfLines={1}
                allowFontScaling={false}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.tabBar,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(167, 182, 255, 0.18)',
    padding: 6,
    shadowColor: '#050a24',
    shadowOpacity: 0.65,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: 'rgba(91, 124, 250, 0.22)',
    borderColor: 'rgba(109, 139, 255, 0.4)',
  },
  tabPressed: { opacity: 0.7 },
  label: {
    color: theme.faint,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  labelActive: { color: '#dbe4ff', fontWeight: '800' },
});
