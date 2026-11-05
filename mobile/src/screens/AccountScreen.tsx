/** Mon compte : profil, changement de mot de passe, déconnexion. */
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { api, ApiError } from '../api';
import { theme } from '../theme';
import { Avatar, Button, Card, Field, Pill, SectionHeader, Divider } from '../ui';
import { useAuth, ROLE_LABELS } from '../auth';

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const changePassword = async () => {
    if (!current || !password || !confirm) {
      Alert.alert('Formulaire incomplet', 'Renseignez le mot de passe actuel et le nouveau.');

      return;
    }
    if (password.length < 10) {
      Alert.alert('Mot de passe trop court', '10 caractères minimum.');

      return;
    }
    if (password !== confirm) {
      Alert.alert('Confirmation différente', 'Les deux saisies du nouveau mot de passe diffèrent.');

      return;
    }
    setSaving(true);
    try {
      await api.post('/me/password', {
        current_password: current,
        password,
        password_confirmation: confirm,
      });
      setCurrent('');
      setPassword('');
      setConfirm('');
      Alert.alert('Mot de passe mis à jour', 'Vos autres sessions ont été fermées.');
    } catch (exception) {
      Alert.alert(
        'Modification impossible',
        exception instanceof ApiError ? exception.displayMessage : 'Réessayez.',
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      'Se déconnecter',
      'Vous devrez saisir à nouveau vos identifiants.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se déconnecter', style: 'destructive', onPress: () => void signOut() },
      ],
    );
  };

  if (!user) return null;

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card style={styles.identityCard}>
        <Avatar name={user.name} size={72} />
        <View style={styles.identityBody}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.pills}>
            <Pill label={ROLE_LABELS[user.role] ?? user.role} tone="accent" />
            {user.is_creator ? <Pill label="Créateur" tone="copper" /> : null}
          </View>
        </View>
      </Card>

      <SectionHeader title="Changer mon mot de passe" />
      <Card style={styles.card}>
        <Field
          label="Mot de passe actuel"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          value={current}
          onChangeText={setCurrent}
          placeholder="Mot de passe actuel"
          textContentType="password"
          autoComplete="current-password"
        />
        <Field
          label="Nouveau mot de passe"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          value={password}
          onChangeText={setPassword}
          placeholder="10 caractères minimum"
          textContentType="newPassword"
          autoComplete="new-password"
        />
        <Field
          label="Confirmer"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Répétez le nouveau mot de passe"
          textContentType="newPassword"
          autoComplete="new-password"
        />
        <Button label="Mettre à jour" onPress={() => void changePassword()} loading={saving} variant="outline" />
      </Card>

      <SectionHeader title="Session" />
      <Card style={styles.card}>
        <Text style={styles.sessionText}>
          La déconnexion ferme le jeton sur cet appareil uniquement. Les autres sessions (téléphone ou PC) restent actives jusqu’à leur expiration ou un changement de mot de passe.
        </Text>
        <Button label="Se déconnecter" variant="danger" onPress={confirmLogout} />
      </Card>

      <Divider />
      <Text style={styles.version}>Kalanso · version {appVersion}</Text>
      <Text style={styles.credit}>Application officielle de l’établissement</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 44 },
  identityCard: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  identityBody: { flex: 1, gap: 5 },
  name: { color: theme.ink, fontSize: 19, fontWeight: '800' },
  email: { color: theme.faint, fontSize: 11.5 },
  pills: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  card: { gap: 10 },
  sessionText: { color: theme.faint, fontSize: 11.5, lineHeight: 16 },
  version: { color: 'rgba(167, 182, 255, 0.45)', fontSize: 10.5, textAlign: 'center', letterSpacing: 0.5 },
  credit: { color: 'rgba(167, 182, 255, 0.3)', fontSize: 9.5, textAlign: 'center', marginTop: 2 },
});
