/** Création d'un compte parent : identité, mot de passe initial, enfants liés. */
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { api, ApiError } from '../api';
import { theme } from '../theme';
import { Avatar, Button, Card, SectionHeader } from '../ui';
import { fullName } from '../format';
import type { StudentRow } from '../types';

const PWD_CHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
const PWD_LENGTH = 12;

function generatePassword(): string {
  let out = '';
  for (let i = 0; i < PWD_LENGTH; i += 1) {
    out += PWD_CHARS[Math.floor(Math.random() * PWD_CHARS.length)];
  }

  return out;
}

export default function ParentFormScreen() {
  const navigation = useNavigation<{ goBack(): void }>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(generatePassword());
  const [showPassword, setShowPassword] = useState(true);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ name: string; email: string; password: string } | null>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StudentRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<StudentRow[]>([]);

  const selectedIds = useMemo(() => new Set(selected.map((child) => child.id)), [selected]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);

      return undefined;
    }
    setSearching(true);
    const handle = setTimeout(() => {
      const params = new URLSearchParams({ q, per_page: '8' });
      api.get<{ data: StudentRow[] }>(`/students?${params.toString()}`)
        .then((result) => setResults(result.data ?? []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);

    return () => {
      clearTimeout(handle);
      setSearching(false);
    };
  }, [query]);

  const toggleChild = (child: StudentRow) => {
    setSelected((prev) => (prev.some((entry) => entry.id === child.id)
      ? prev.filter((entry) => entry.id !== child.id)
      : [...prev, child]));
  };

  const submit = async () => {
    Keyboard.dismiss();
    const trimmedEmail = email.trim().toLowerCase();
    if (!name.trim() || !trimmedEmail) {
      Alert.alert('Formulaire incomplet', 'Renseignez le nom et l’adresse e-mail du parent.');

      return;
    }
    if (password.length < 10) {
      Alert.alert('Mot de passe trop court', '10 caractères minimum.');

      return;
    }
    if (selected.length === 0) {
      Alert.alert('Aucun enfant lié', 'Liez au moins un élève au compte parent.');

      return;
    }

    setSaving(true);
    try {
      await api.post('/users', {
        name: name.trim(),
        email: trimmedEmail,
        password,
        role: 'parent',
        student_ids: selected.map((child) => child.id),
      });
      setCreated({ name: name.trim(), email: trimmedEmail, password });
    } catch (exception) {
      Alert.alert(
        'Création impossible',
        exception instanceof ApiError ? exception.displayMessage : 'Réessayez.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (created) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Card style={styles.successCard}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={30} color={theme.ok} />
          </View>
          <Text style={styles.successTitle}>Compte parent créé</Text>
          <Text style={styles.successSub}>
            Transmettez ces identifiants au parent. Il pourra changer son mot de passe
            depuis l’application (Compte → Changer le mot de passe).
          </Text>
          <View style={styles.credBox}>
            <Cred label="Nom" value={created.name} />
            <Cred label="E-mail" value={created.email} />
            <Cred label="Mot de passe" value={created.password} />
          </View>
          <Button label="Terminer" onPress={() => navigation.goBack()} style={styles.doneButton} />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <SectionHeader title="Identité" />
      <Card style={styles.card}>
        <LabeledInput
          label="Nom du parent"
          value={name}
          onChangeText={setName}
          placeholder="Fatou Traoré"
          autoCapitalize="words"
          autoComplete="name"
        />
        <LabeledInput
          label="Adresse e-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="parent@exemple.com"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <View>
          <Text style={styles.fieldLabel}>MOT DE PASSE INITIAL</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.passwordInput, styles.passwordTouch]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Mot de passe initial"
            />
            <Pressable
              onPress={() => setShowPassword((value) => !value)}
              hitSlop={8}
              style={styles.passwordToggle}
              accessibilityLabel={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              <Text style={styles.passwordToggleText}>{showPassword ? 'Masquer' : 'Afficher'}</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => setPassword(generatePassword())} style={styles.generateLink} accessibilityRole="button">
            <Text style={styles.generateLinkText}>Générer un nouveau mot de passe</Text>
          </Pressable>
        </View>
      </Card>

      <SectionHeader title="Enfants liés" />
      <Card style={styles.card}>
        {selected.length > 0 && (
          <View style={styles.selectedRow}>
            {selected.map((child) => (
              <Pressable
                key={child.id}
                onPress={() => toggleChild(child)}
                style={styles.selectedChip}
                accessibilityRole="button"
                accessibilityLabel={`Retirer ${fullName(child)}`}
              >
                <Text style={styles.selectedChipText}>{fullName(child)}</Text>
                <Ionicons name="close" size={13} color="#b9c8ff" />
              </Pressable>
            ))}
          </View>
        )}
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher un élève (nom ou matricule)…"
          placeholderTextColor={theme.faint}
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="Recherche d'élève à lier"
        />
        {searching ? (
          <ActivityIndicator color={theme.accent} style={styles.searching} />
        ) : (
          <>
            {results.map((child) => {
              const checked = selectedIds.has(child.id);

              return (
                <Pressable
                  key={child.id}
                  onPress={() => toggleChild(child)}
                  style={[styles.resultRow, checked && styles.resultRowChecked]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                >
                  <Avatar name={fullName(child)} size={34} />
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName} numberOfLines={1}>{fullName(child)}</Text>
                    <Text style={styles.resultMeta} numberOfLines={1}>
                      {child.matricule ?? '—'} · {child.school_class?.name ?? 'Sans classe'}
                    </Text>
                  </View>
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked ? <Ionicons name="checkmark" size={15} color="#ffffff" /> : null}
                  </View>
                </Pressable>
              );
            })}
            {query.trim().length >= 2 && results.length === 0 && !searching ? (
              <Text style={styles.noResult}>Aucun élève ne correspond à « {query.trim()} ».</Text>
            ) : null}
          </>
        )}
      </Card>

      <Button
        label={`Créer le compte (${selected.length} enfant${selected.length > 1 ? 's' : ''})`}
        onPress={() => void submit()}
        loading={saving}
        style={styles.submitButton}
      />
    </ScrollView>
  );
}

function LabeledInput({ label, ...input }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={theme.faint}
        selectionColor={theme.accent}
        {...input}
      />
    </View>
  );
}

function Cred({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.credRow}>
      <Text style={styles.credLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.credValue} selectable>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48 },
  card: { gap: 12 },
  fieldLabel: { color: theme.faint, fontSize: 9.5, letterSpacing: 1.1, fontWeight: '700', marginBottom: 6 },
  input: {
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radiusSm,
    color: theme.ink,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  passwordInput: {
    flex: 1,
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radiusSm,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  passwordTouch: { color: theme.ink, letterSpacing: 1.5 },
  passwordToggle: { paddingHorizontal: 6, paddingVertical: 10 },
  passwordToggleText: { color: theme.accent, fontSize: 11, fontWeight: '700' },
  generateLink: { marginTop: 8, alignSelf: 'flex-start' },
  generateLinkText: { color: theme.accent, fontSize: 11.5, fontWeight: '600' },
  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(109, 139, 255, 0.45)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  selectedChipText: { color: '#dfe6ff', fontSize: 11.5, fontWeight: '600' },
  searchInput: {
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radiusSm,
    color: theme.ink,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: 4,
  },
  searching: { marginVertical: 8 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 9,
    borderRadius: theme.radiusSm,
    borderWidth: 1,
    borderColor: 'transparent',
    marginTop: 6,
  },
  resultRowChecked: { backgroundColor: theme.accentSoft, borderColor: theme.lineStrong },
  resultInfo: { flex: 1 },
  resultName: { color: theme.ink, fontSize: 12.5, fontWeight: '700' },
  resultMeta: { color: theme.faint, fontSize: 9.5, marginTop: 1 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: theme.accentStrong, borderColor: theme.accentStrong },
  noResult: { color: theme.faint, fontSize: 11.5, textAlign: 'center', paddingVertical: 10 },
  submitButton: { marginTop: 16 },
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
    marginBottom: 2,
  },
  successTitle: { color: theme.ok, fontSize: 19, fontWeight: '800', textAlign: 'center' },
  successSub: { color: theme.faint, fontSize: 12, lineHeight: 17 },
  credBox: {
    backgroundColor: theme.surfaceAlt,
    borderRadius: theme.radiusSm,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 12,
    gap: 10,
  },
  credRow: { gap: 2 },
  credLabel: { color: theme.faint, fontSize: 8.5, letterSpacing: 1.1, fontWeight: '700' },
  credValue: { color: theme.ink, fontSize: 15, fontWeight: '700' },
  doneButton: { marginTop: 4 },
});
