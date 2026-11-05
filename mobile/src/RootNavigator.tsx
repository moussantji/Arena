/** Navigation : pile racine (connexion / onglets / écrans) + onglets par rôle. */
import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DarkTheme, useNavigation, type Theme as NavigationTheme } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationProp, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { gradients, theme } from './theme';
import { useAuth } from './auth';
import { Avatar } from './ui';
import type { Role } from './types';

import LoginScreen from './screens/LoginScreen';
import StaffHomeScreen from './screens/StaffHomeScreen';
import ParentHomeScreen from './screens/ParentHomeScreen';
import ReportCardScreen from './screens/ReportCardScreen';
import ParentAbsencesScreen from './screens/ParentAbsencesScreen';
import ParentFinancesScreen from './screens/ParentFinancesScreen';
import NotesScreen from './screens/NotesScreen';
import CallScreen from './screens/CallScreen';
import StudentsScreen from './screens/StudentsScreen';
import StudentDetailScreen from './screens/StudentDetailScreen';
import FinancesScreen from './screens/FinancesScreen';
import TimetableScreen from './screens/TimetableScreen';
import ParentsScreen from './screens/ParentsScreen';
import ParentFormScreen from './screens/ParentFormScreen';
import ParentPasswordScreen from './screens/ParentPasswordScreen';
import MessagesScreen from './screens/MessagesScreen';
import NewThreadScreen from './screens/NewThreadScreen';
import ThreadScreen from './screens/ThreadScreen';
import AccountScreen from './screens/AccountScreen';

export type TabsParamList = {
  Accueil: undefined;
  Bulletin: undefined;
  Absences: undefined;
  Finances: undefined;
  Notes: undefined;
  Appel: undefined;
  Eleves: undefined;
  Parents: undefined;
  Messages: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  Login: undefined;
  Compte: undefined;
  Eleve: { studentId: number };
  Horaire: undefined;
  Discussion: { threadId: number; subject?: string };
  NouveauMessage: undefined;
  ParentForm: undefined;
  ParentPassword: { userId: number; name: string };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type TabsScreenProps<T extends keyof TabsParamList> =
  NativeStackScreenProps<TabsParamList & RootStackParamList, T>;

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabsParamList>();

const navigationTheme: NavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.bg,
    card: theme.bg,
    text: theme.ink,
    border: theme.line,
    primary: theme.accent,
    notification: theme.danger,
  },
};

function HeaderAvatar() {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Pressable
      onPress={() => navigation.navigate('Compte')}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Ouvrir mon compte"
      style={styles.avatarButton}
    >
      <Avatar name={user?.name} size={32} ring />
    </Pressable>
  );
}

const headerOptions = {
  headerStyle: { backgroundColor: 'rgba(7, 11, 31, 0.92)' },
  headerTintColor: theme.ink,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 16 },
  headerShadowVisible: false,
  headerRight: () => <HeaderAvatar />,
};

type TabName = keyof TabsParamList;

function tabIcon(name: TabName, focused: boolean): keyof typeof Ionicons.glyphMap {
  switch (name) {
    case 'Accueil':
      return focused ? 'home' : 'home-outline';
    case 'Bulletin':
      return focused ? 'document-text' : 'document-text-outline';
    case 'Absences':
      return focused ? 'time' : 'time-outline';
    case 'Finances':
      return focused ? 'card' : 'card-outline';
    case 'Notes':
      return focused ? 'create' : 'create-outline';
    case 'Appel':
      return focused ? 'checkbox' : 'checkbox-outline';
    case 'Eleves':
      return focused ? 'people' : 'people-outline';
    case 'Parents':
      return focused ? 'person-circle' : 'person-circle-outline';
    case 'Messages':
      return focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
    default:
      return 'ellipse-outline';
  }
}

const tabScreenOptions = {
  ...headerOptions,
  tabBarStyle: {
    backgroundColor: 'rgba(11, 16, 48, 0.94)',
    borderTopColor: theme.line,
    borderTopWidth: 1,
  },
  tabBarActiveTintColor: '#A8BCFF',
  tabBarInactiveTintColor: theme.ghost,
  tabBarLabelStyle: { fontSize: 9.5, fontWeight: '600' as const, marginBottom: 3 },
  tabBarHideOnKeyboard: true,
};

function staffTabs(role: Role): TabName[] {
  switch (role) {
    case 'direction':
      return ['Accueil', 'Eleves', 'Parents', 'Finances', 'Messages'];
    case 'comptable':
      return ['Accueil', 'Eleves', 'Finances', 'Messages'];
    case 'secretariat':
      return ['Accueil', 'Eleves', 'Messages'];
    case 'enseignant':
      return ['Accueil', 'Notes', 'Appel', 'Eleves', 'Messages'];
    default:
      return ['Accueil'];
  }
}

const parentTabs: TabName[] = ['Accueil', 'Bulletin', 'Absences', 'Finances', 'Messages'];

const TAB_TITLES: Record<TabName, string> = {
  Accueil: 'Accueil',
  Bulletin: 'Bulletin',
  Absences: 'Absences',
  Finances: 'Finances',
  Notes: 'Notes',
  Appel: 'Appel',
  Eleves: 'Élèves',
  Parents: 'Parents',
  Messages: 'Messages',
};

function TabScreen({ name, role }: { name: TabName; role: Role }) {
  switch (name) {
    case 'Accueil':
      return role === 'parent'
        ? <ParentHomeScreen />
        : <StaffHomeScreen role={role} />;
    case 'Bulletin':
      return <ReportCardScreen />;
    case 'Absences':
      return role === 'parent' ? <ParentAbsencesScreen /> : <CallScreen />;
    case 'Finances':
      return role === 'parent' ? <ParentFinancesScreen /> : <FinancesScreen />;
    case 'Notes':
      return <NotesScreen />;
    case 'Appel':
      return <CallScreen />;
    case 'Eleves':
      return <StudentsScreen />;
    case 'Parents':
      return <ParentsScreen />;
    case 'Messages':
      return <MessagesScreen />;
    default:
      return null;
  }
}

function RoleTabs() {
  const { user } = useAuth();
  const role = (user?.role ?? 'parent') as Role;
  const tabs = role === 'parent' ? parentTabs : staffTabs(role);

  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      {tabs.map((name) => (
        <Tab.Screen
          key={name}
          name={name}
          options={{
            title: TAB_TITLES[name],
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={tabIcon(name, focused)} size={size - 2} color={color} />
            ),
          }}
        >
          {() => <TabScreen name={name} role={role} />}
        </Tab.Screen>
      ))}
    </Tab.Navigator>
  );
}

function Splash() {
  return (
    <View style={styles.splash}>
      <LinearGradient colors={gradients.gold} style={styles.splashRing}>
        <View style={styles.splashCore}>
          <Image source={require('../assets/icon.png')} style={styles.splashLogo} resizeMode="contain" />
        </View>
      </LinearGradient>
      <Text style={styles.splashName}>KALANSO</Text>
      <ActivityIndicator color={theme.accent} style={styles.splashSpinner} />
    </View>
  );
}

export default function RootNavigator() {
  const { user, ready } = useAuth();

  if (!ready) {
    return <Splash />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: 'rgba(7, 11, 31, 0.92)' },
          headerTintColor: theme.ink,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Tabs" component={RoleTabs} options={{ headerShown: false }} />
            <Stack.Screen name="Compte" component={AccountScreen} options={{ title: 'Mon compte' }} />
            <Stack.Screen name="Eleve" component={StudentDetailScreen} options={{ title: 'Fiche élève' }} />
            <Stack.Screen name="Horaire" component={TimetableScreen} options={{ title: 'Emploi du temps' }} />
            <Stack.Screen name="Discussion" component={ThreadScreen} options={({ route }) => ({ title: route.params.subject ?? 'Conversation' })} />
            <Stack.Screen name="NouveauMessage" component={NewThreadScreen} options={{ title: 'Nouveau message' }} />
            <Stack.Screen name="ParentForm" component={ParentFormScreen} options={{ title: 'Nouveau compte parent' }} />
            <Stack.Screen name="ParentPassword" component={ParentPasswordScreen} options={({ route }) => ({ title: `Mot de passe — ${route.params.name}` })} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg, gap: 12 },
  splashRing: {
    width: 126,
    height: 126,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashCore: {
    width: 120,
    height: 120,
    borderRadius: 31,
    backgroundColor: theme.bg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: { width: 96, height: 96, borderRadius: 24 },
  splashName: { color: theme.ink, fontSize: 22, fontWeight: '800', letterSpacing: 6, marginTop: 6 },
  splashSpinner: { marginTop: 4 },
  avatarButton: { marginRight: 4, borderRadius: 16 },
});
