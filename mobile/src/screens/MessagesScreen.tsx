/** Messagerie : liste des conversations (personnel : tout ; parent : ses propres fils). */
import React from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { Avatar, Empty, ErrorState, Loading, Pill } from '../ui';
import { formatDate, truncate } from '../format';
import { useApiQuery } from '../useApiQuery';
import { api } from '../api';
import type { Thread } from '../types';

function threadDate(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  return sameDay
    ? `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    : formatDate(value);
}

export default function MessagesScreen() {
  const navigation = useNavigation<{ navigate(name: string, params?: object): void }>();
  const { data, error, loading, reload } = useApiQuery<{ threads: Thread[] }>(
    () => api.get<{ threads: Thread[] }>('/threads'),
    [],
  );

  const threads = data?.threads ?? [];

  return (
    <View style={styles.screen}>
      {loading && !data ? (
        <Loading />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : threads.length === 0 ? (
        <Empty
          title="Aucune conversation"
          sub="Démarrez une conversation avec l’école via le bouton ＋."
        />
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={false} onRefresh={reload} tintColor={theme.accent} />}
          renderItem={({ item }) => {
            const preview = item.latestMessage?.body ? truncate(item.latestMessage.body, 90) : 'Aucun message';
            const author = item.latestMessage?.sender_name ?? item.creator?.name ?? 'École';
            const unread = Number(item.unread_count ?? 0);

            return (
              <Pressable
                onPress={() => navigation.navigate('Discussion', { threadId: item.id, subject: item.subject })}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                accessibilityRole="button"
              >
                <Avatar name={author} size={44} />
                <View style={styles.rowInfo}>
                  <View style={styles.rowTop}>
                    <Text style={styles.subject} numberOfLines={1}>{item.subject}</Text>
                    <Text style={styles.time}>{threadDate(item.last_message_at)}</Text>
                  </View>
                  <View style={styles.rowBottom}>
                    <Text style={[styles.preview, unread > 0 && styles.previewUnread]} numberOfLines={1}>
                      {preview}
                    </Text>
                    <View style={styles.rowBadges}>
                      {item.type === 'internal' ? <Pill label="Interne" tone="muted" /> : <Pill label="Parent" tone="accent" />}
                      {unread > 0 ? (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>{unread}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <Pressable
        onPress={() => navigation.navigate('NouveauMessage')}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        accessibilityRole="button"
        accessibilityLabel="Nouvelle conversation"
      >
        <Text style={styles.fabText}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  listContent: { padding: 12, paddingBottom: 110, gap: 8 },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 12,
    borderRadius: theme.radius,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
  },
  rowPressed: { backgroundColor: theme.surfaceAlt },
  rowInfo: { flex: 1, gap: 3 },
  rowTop: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  subject: { flex: 1, color: theme.ink, fontSize: 13.5, fontWeight: '700' },
  time: { color: theme.faint, fontSize: 10 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  preview: { flex: 1, color: theme.faint, fontSize: 11.5 },
  previewUnread: { color: '#c9d4ff', fontWeight: '600' },
  rowBadges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: theme.accentStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.accentStrong,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#5b7cfa',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  fabPressed: { opacity: 0.85 },
  fabText: { color: '#fff', fontSize: 26, lineHeight: 30, fontWeight: '500' },
});
