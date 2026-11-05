/**
 * Liste des élèves premium : recherche, filtres de classe, pagination,
 * portraits cerclés d'or et accès à la fiche.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { api, ApiError } from '../api';
import { theme } from '../theme';
import {
  Aurora,
  Avatar,
  Chip,
  ChipRow,
  Empty,
  ErrorState,
  Loading,
  Pill,
  ScreenHeader,
  SearchBar,
  type PillTone,
} from '../ui';
import { fullName } from '../format';
import { useApiQuery } from '../useApiQuery';
import type { SchoolClassSummary, StudentListPage, StudentRow } from '../types';
import type { RootStackParamList } from '../RootNavigator';

function statusTone(status?: string | null): PillTone {
  const value = (status ?? '').toLowerCase();
  if (value.includes('actif')) return 'ok';
  if (value.includes('inact') || value.includes('sort')) return 'muted';
  if (value.includes('attent')) return 'copper';
  return 'accent';
}

export default function StudentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [classId, setClassId] = useState<number | null>(null);
  const [items, setItems] = useState<StudentRow[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const classesQuery = useApiQuery<{ classes: SchoolClassSummary[] }>(
    () => api.get<{ classes: SchoolClassSummary[] }>('/classes'),
    [],
  );
  const classes = useMemo(() => classesQuery.data?.classes ?? [], [classesQuery.data]);

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
    if (classId != null) params.set('class_id', String(classId));

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
  }, [debounced, classId]);

  const loadMore = () => {
    if (loadingMore || page >= lastPage) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const params = new URLSearchParams({ per_page: '25', page: String(nextPage) });
    if (debounced) params.set('q', debounced);
    if (classId != null) params.set('class_id', String(classId));

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
      <Aurora />
      <View style={styles.head}>
        <ScreenHeader title="Élèves" sub={`${items.length ? `${items.length} affichés · ` : ''}annuaire de l’établissement`} />
        <View style={styles.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un élève (nom, matricule)…"
            accessibilityLabel="Recherche d'élève"
          />
        </View>
        <ChipRow style={styles.chips}>
          <Chip label="Tous" active={classId == null} onPress={() => setClassId(null)} small />
          {classes.map((entry) => (
            <Chip
              key={entry.id}
              label={entry.name}
              active={entry.id === classId}
              onPress={() => setClassId(entry.id === classId ? null : entry.id)}
              small
            />
          ))}
        </ChipRow>
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
          showsVerticalScrollIndicator={false}
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
              <Avatar name={fullName(item)} size={46} ring />
              <View style={styles.rowInfo}>
                <Text style={styles.rowName} numberOfLines={1}>{fullName(item)}</Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {item.school_class?.name ?? 'Sans classe'} · {item.matricule ?? 'Sans matricule'}
                </Text>
              </View>
              <View style={styles.rowRight}>
                {item.status ? <Pill label={item.status} tone={statusTone(item.status)} /> : null}
                {item.average != null ? (
                  <Text style={styles.average}>Moy. {Number(item.average).toFixed(1)}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.ghost} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  head: { paddingHorizontal: 16 },
  searchWrap: { marginTop: 6 },
  chips: { marginTop: 12, marginHorizontal: -16 },
  listContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 30, gap: 9 },
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
  rowInfo: { flex: 1, gap: 3 },
  rowName: { color: theme.ink, fontSize: 14, fontWeight: '700' },
  rowMeta: { color: theme.faint, fontSize: 11 },
  rowRight: { alignItems: 'flex-end', gap: 5 },
  average: { color: theme.copper, fontSize: 10.5, fontWeight: '700', fontVariant: ['tabular-nums'] },
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
