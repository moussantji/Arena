/** Comptes parents (direction) : liste, création, réinitialisation, suppression. */
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api, ApiError } from '../api';
import { theme } from '../theme';
import { Avatar, Empty, ErrorState, Loading, Pill } from '../ui';
import { formatDate } from '../format';
import { useApiQuery } from '../useApiQuery';
import type { ParentAccount } from '../types';

export default function ParentsScreen() {
  const navigation = useNavigation<{ navigate(name: string, params?: object): void }>();
  const { data, error, loading, reload } = useApiQuery<{ users: ParentAccount[] }>(
    () => api.get<{ users: ParentAccount[] }>('/users?role=parent'),
    [],
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const remove = (account: ParentAccount) => {
    Alert.alert(
      'Supprimer ce compte parent',
      `« ${account.name} » ne pourra plus se connecter. Ses liaisons avec les élèves seront supprimées. Cette action est définitive.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(account.id);
            try {
              await api.delete(`/users/${account.id}`);
              reload();
            } catch (exception) {
              Alert.alert(
                'Suppression impossible',
                exception instanceof ApiError ? exception.displayMessage : 'Réessayez.',
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const menu = (account: ParentAccount) => {
    Alert.alert(account.name, account.email, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Réinitialiser le mot de passe',
        onPress: () => navigation.navigate('ParentPassword', { userId: account.id, name: account.name }),
      },
      { text: 'Supprimer le compte', style: 'destructive', onPress: () => remove(account) },
    ]);
  };

  const parents = data?.users ?? [];

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.count}>
          {parents.length} compte{parents.length > 1 ? 's' : ''} parent{parents.length > 1 ? 's' : ''}
        </Text>
        <Pressable
          onPress={() => navigation.navigate('ParentForm')}
          style={({ pressed }) => [styles.addButton, pressed && styles.addPressed]}
          accessibilityRole="button"
          accessibilityLabel="Créer un compte parent"
        >
          <Text style={styles.addButtonText}>＋ Nouveau</Text>
        </Pressable>
      </View>

      {loading && !data ? (
        <Loading />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : parents.length === 0 ? (
        <Empty
          title="Aucun compte parent"
          sub="Créez un compte pour que les parents consultent notes, absences et finances de leurs enfants."
          action={(
            <Pressable onPress={() => navigation.navigate('ParentForm')} style={styles.emptyCta}>
              <Text style={styles.emptyCtaText}>Créer le premier compte</Text>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={parents}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={false} onRefresh={reload} tintColor={theme.accent} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => menu(item)}
              onLongPress={() => menu(item)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed, deletingId === item.id && styles.rowDeleting]}
            >
              <Avatar name={item.name} size={44} />
              <View style={styles.rowInfo}>
                <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.rowEmail} numberOfLines={1}>{item.email}</Text>
                <View style={styles.rowFooter}>
                  {item.children.length > 0 ? (
                    <Pill
                      label={item.children.length === 1 ? item.children[0].name : `${item.children.length} enfants liés`}
                      tone="accent"
                    />
                  ) : (
                    <Pill label="Aucun enfant lié" tone="copper" />
                  )}
                  <Text style={styles.created}>Créé le {formatDate(item.created_at)}</Text>
                </View>
              </View>
              <Text style={styles.chevron}>⋯</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  count: { color: theme.faint, fontSize: 12 },
  addButton: {
    backgroundColor: theme.accentStrong,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addPressed: { opacity: 0.85 },
  addButtonText: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
  listContent: { paddingHorizontal: 12, paddingBottom: 32, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: theme.radius,
    padding: 12,
  },
  rowPressed: { backgroundColor: theme.surfaceAlt },
  rowDeleting: { opacity: 0.5 },
  rowInfo: { flex: 1, gap: 2 },
  rowName: { color: theme.ink, fontSize: 13.5, fontWeight: '700' },
  rowEmail: { color: theme.faint, fontSize: 10.5 },
  rowFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' },
  created: { color: 'rgba(167, 182, 255, 0.4)', fontSize: 9 },
  chevron: { color: theme.faint, fontSize: 18, paddingHorizontal: 4 },
  emptyCta: {
    backgroundColor: theme.accentStrong,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyCtaText: { color: '#fff', fontWeight: '700' },
});
