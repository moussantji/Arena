/** Liste des élèves (personnel) : recherche, pagination, accès à la fiche. */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api, ApiError } from '../api';
import { theme } from '../theme';
import { Avatar, Empty, ErrorState, Loading, Pill } from '../ui';
import { fullName } from '../format';
import type { StudentListPage, StudentRow } from '../types';
import type { RootStackParamList } from '../RootNavigator';

export default function StudentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [items, setItems] = useState<StudentRow[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(query.trim()), 350);

    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ per_page: '25', page: '1' });
    if (debounced) params.set('q', debounced);

    api.get<StudentListPage>(`/students?${params.toString()}`)
      .then((result) => {
        if (cancelled) return;
        setItems(result.data ?? []);
        setPage(result.current_page ?? 1);
        setLastPage(result.last_page ?? 1);
        setLoading(false);
      })
      .catch((exception) => {
        if (cancelled) return;
        setError(exception instanceof ApiError ? exception.displayMessage : 'Chargement impossible.');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const loadMore = () => {
    if (loadingMore || page >= lastPage) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const params = new URLSearchParams({ per_page: '25', page: String(nextPage) });
    if (debounced) params.set('q', debounced);

    api.get<StudentListPage>(`/students?${params.toString()}`)
      .then((result) => {
        setItems((prev) => [...prev, ...(result.data ?? [])]);
        setPage(result.current_page ?? nextPage);
        setLastPage(result.last_page ?? lastPage);
        setLoadingMore(false);
      })
      .catch(() => setLoadingMore(false));
  };

  return (
    <View style={styles.screen}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher un élève (nom, matricule)…"
          placeholderTextColor={theme.faint}
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="Recherche d'élève"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Effacer la recherche">
            <Text style={styles.clearButton}>✕</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <Loading label="Chargement des élèves…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setDebounced((value) => value)} />
      ) : items.length === 0 ? (
        <Empty
          title={debounced ? 'Aucun résultat' : 'Aucun élève'}
          sub={debounced ? `Aucun élève ne correspond à « ${debounced} ».` : 'Aucun élève actif dans l’établissement.'}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          ListFooterComponent={(
            <View style={styles.footer}>
              {loadingMore ? <ActivityIndicator color={theme.accent} /> : null}
              {page < lastPage && !loadingMore ? (
                <Pressable onPress={loadMore} style={styles.loadMoreButton}>
                  <Text style={styles.loadMoreText}>Charger plus</Text>
                </Pressable>
              ) : null}
            </View>
          )}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('Eleve', { studentId: item.id })}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              accessibilityRole="button"
            >
              <Avatar name={fullName(item)} size={44} />
              <View style={styles.rowInfo}>
                <Text style={styles.rowName} numberOfLines={1}>{fullName(item)}</Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {item.matricule ?? 'Sans matricule'} · {item.school_class?.name ?? 'Sans classe'}
                </Text>
                <View style={styles.rowFooter}>
                  {item.status ? <Pill label={item.status} tone="muted" /> : null}
                  {item.average != null ? (
                    <Text style={styles.average}>Moy. {Number(item.average).toFixed(2)}</Text>
                  ) : null}
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    height: 46,
    backgroundColor: theme.surfaceAlt,
    borderRadius: theme.radiusSm,
    borderWidth: 1,
    borderColor: theme.line,
  },
  searchInput: { flex: 1, color: theme.ink, fontSize: 14 },
  clearButton: { color: theme.faint, fontSize: 15, paddingHorizontal: 4 },
  listContent: { paddingHorizontal: 12, paddingBottom: 30, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.surface,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 12,
  },
  rowPressed: { backgroundColor: theme.surfaceAlt },
  rowInfo: { flex: 1, gap: 2 },
  rowName: { color: theme.ink, fontSize: 13.5, fontWeight: '700' },
  rowMeta: { color: theme.faint, fontSize: 10.5 },
  rowFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 3 },
  average: { color: theme.accent, fontSize: 10.5, fontWeight: '700', fontVariant: ['tabular-nums'] },
  chevron: { color: theme.faint, fontSize: 22 },
  footer: { alignItems: 'center', paddingVertical: 14, gap: 8 },
  loadMoreButton: {
    borderWidth: 1,
    borderColor: theme.lineStrong,
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 999,
  },
  loadMoreText: { color: theme.ink, fontWeight: '600', fontSize: 12.5 },
});
