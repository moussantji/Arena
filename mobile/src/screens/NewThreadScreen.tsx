/** Nouvelle conversation (messagerie). */
import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api, ApiError } from '../api';
import { theme } from '../theme';
import { Button, Card, SectionHeader } from '../ui';
import { useAuth, isStaff } from '../auth';
import type { Thread } from '../types';

export default function NewThreadScreen() {
  const navigation = useNavigation<{ goBack(): void }>();
  const { user } = useAuth();
  const staff = isStaff(user?.role);

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<'parent' | 'internal'>('parent');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    Keyboard.dismiss();
    if (!subject.trim()) {
      Alert.alert('Sujet manquant', 'Indiquez un sujet pour la conversation.');

      return;
    }
    if (!body.trim()) {
      Alert.alert('Message vide', 'Écrivez votre message avant l’envoi.');

      return;
    }

    setSaving(true);
    try {
      await api.post<{ thread: Thread }>('/threads', {
        subject: subject.trim(),
        body: body.trim(),
        type: staff ? type : 'parent',
      });
      navigation.goBack();
    } catch (exception) {
      Alert.alert(
        'Envoi impossible',
        exception instanceof ApiError ? exception.displayMessage : 'Réessayez.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <SectionHeader title="Sujet" />
        <TextInput
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
          placeholder="Ex. : Question sur les frais de scolarité"
          placeholderTextColor={theme.faint}
          maxLength={180}
          selectionColor={theme.accent}
          accessibilityLabel="Sujet"
        />

        {staff ? (
          <>
            <SectionHeader title="Type de conversation" />
            <View style={styles.typeRow}>
              <TypeChip label="Parent / Famille" active={type === 'parent'} onPress={() => setType('parent')} />
              <TypeChip label="Interne (personnel)" active={type === 'internal'} onPress={() => setType('internal')} />
            </View>
          </>
        ) : null}

        <SectionHeader title="Votre message" />
        <TextInput
          style={[styles.input, styles.bodyInput]}
          value={body}
          onChangeText={setBody}
          placeholder="Détaillez votre demande…"
          placeholderTextColor={theme.faint}
          multiline
          maxLength={5000}
          textAlignVertical="top"
          selectionColor={theme.accent}
          accessibilityLabel="Message"
        />

        <Button
          label="Envoyer"
          onPress={() => void submit()}
          loading={saving}
          style={styles.submit}
        />
        <Text style={styles.hint}>
          La direction reçoit votre message. Une réponse vous sera faite dans les meilleurs délais.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TypeChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.typeChip, active && styles.typeChipActive]}
    >
      <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48 },
  input: {
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radiusSm,
    color: theme.ink,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  bodyInput: { minHeight: 140, marginTop: 2 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.line,
  },
  typeChipActive: { backgroundColor: theme.accentSoft, borderColor: theme.accentStrong },
  typeChipText: { color: theme.faint, fontSize: 12, fontWeight: '600' },
  typeChipTextActive: { color: '#dfe6ff' },
  submit: { marginTop: 16 },
  hint: { color: theme.faint, fontSize: 11, textAlign: 'center', marginTop: 12, lineHeight: 16 },
});
