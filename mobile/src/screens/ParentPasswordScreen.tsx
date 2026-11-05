/** Réinitialisation du mot de passe d'un compte parent (direction). */
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { api, ApiError } from '../api';
import { theme } from '../theme';
import { Button, Card, SectionHeader } from '../ui';
import type { RootStackParamList } from '../RootNavigator';

const PWD_CHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generatePassword(): string {
  let out = '';
  for (let i = 0; i < 12; i += 1) {
    out += PWD_CHARS[Math.floor(Math.random() * PWD_CHARS.length)];
  }

  return out;
}

export default function ParentPasswordScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ParentPassword'>>();
  const navigation = useNavigation<{ goBack(): void }>();
  const { userId, name } = route.params;

  const [password, setPassword] = useState(generatePassword());
  const [showPassword, setShowPassword] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (password.length < 10) {
      Alert.alert('Mot de passe trop court', '10 caractères minimum.');

      return;
    }
    setSaving(true);
    try {
      await api.patch(`/users/${userId}`, { password });
      setDone(true);
    } catch (exception) {
      Alert.alert(
        'Réinitialisation impossible',
        exception instanceof ApiError ? exception.displayMessage : 'Réessayez.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Card style={styles.successCard}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={30} color={theme.ok} />
          </View>
          <Text style={styles.successTitle}>Mot de passe réinitialisé</Text>
          <Text style={styles.successSub}>
            {name} devra utiliser ce mot de passe à sa prochaine connexion.
            Toutes ses sessions précédentes ont été fermées.
          </Text>
          <View style={styles.credBox}>
            <Text style={styles.credLabel}>NOUVEAU MOT DE PASSE</Text>
            <Text style={styles.credValue} selectable>{password}</Text>
          </View>
          <Text style={styles.warning}>
            Transmettez-le de façon confidentielle. Il ne sera plus jamais affiché ici.
          </Text>
          <Button label="Terminer" onPress={() => navigation.goBack()} style={styles.doneButton} />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <SectionHeader title="Réinitialiser le mot de passe" />
      <Card style={styles.card}>
        <Text style={styles.helpText}>
          Un nouveau mot de passe sera attribué à <Text style={styles.helpStrong}>{name}</Text>.
          Toutes ses sessions actives seront fermées immédiatement.
        </Text>
        <View>
          <Text style={styles.fieldLabel}>NOUVEAU MOT DE PASSE</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor={theme.accent}
              placeholderTextColor={theme.faint}
              accessibilityLabel="Nouveau mot de passe"
            />
            <Switch
              value={showPassword}
              onValueChange={setShowPassword}
              trackColor={{ true: theme.accentStrong, false: '#232c58' }}
              accessibilityLabel="Afficher le mot de passe"
            />
          </View>
          <Text style={styles.generateHint}>Généré automatiquement — 12 caractères, mélangés.</Text>
        </View>
        <Button
          label="Réinitialiser le mot de passe"
          variant="danger"
          onPress={() => void submit()}
          loading={saving}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  card: { gap: 14 },
  helpText: { color: theme.faint, fontSize: 12.5, lineHeight: 18 },
  helpStrong: { color: theme.ink, fontWeight: '700' },
  fieldLabel: { color: theme.faint, fontSize: 9.5, letterSpacing: 1.1, fontWeight: '700', marginBottom: 6 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  passwordInput: {
    flex: 1,
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radiusSm,
    color: theme.ink,
    fontSize: 16,
    letterSpacing: 1.2,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  generateHint: { color: theme.faint, fontSize: 10, marginTop: 6 },
  successCard: { gap: 12, marginTop: 10 },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(111, 227, 176, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(111, 227, 176, 0.4)',
  },
  successTitle: { color: theme.ok, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  successSub: { color: theme.faint, fontSize: 12, lineHeight: 17 },
  credBox: {
    backgroundColor: theme.surfaceAlt,
    borderRadius: theme.radiusSm,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 14,
    gap: 4,
    alignItems: 'center',
  },
  credLabel: { color: theme.faint, fontSize: 8.5, letterSpacing: 1.2, fontWeight: '700' },
  credValue: { color: theme.ink, fontSize: 20, fontWeight: '800', letterSpacing: 1.5 },
  warning: { color: theme.copper, fontSize: 10.5, lineHeight: 15, textAlign: 'center' },
  doneButton: { marginTop: 4 },
});
