/**
 * Partage la liste des enfants du parent connecté entre les écrans
 * « Bulletin », « Absences » et « Finances », avec la sélection active.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api, ApiError } from './api';
import { theme } from './theme';
import type { Child } from './types';
import { fullName } from './format';
import { useAuth } from './auth';

interface ChildrenContextValue {
  children: Child[];
  loading: boolean;
  error: string | null;
  reload(): void;
  selectedId: number | null;
  select(id: number): void;
  selectedChild: Child | null;
}

const ChildrenContext = createContext<ChildrenContextValue | null>(null);

export function ParentChildrenProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isParent = user?.role === 'parent';
  const [kids, setKids] = useState<Child[]>([]);
  const [loading, setLoading] = useState(isParent);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const reload = useCallback(() => {
    if (!isParent) return;
    setLoading(true);
    setError(null);
    api.get<{ children: Child[] }>('/parent/children')
      .then((result) => {
        setKids(result.children ?? []);
        setSelectedId((current) => current ?? result.children?.[0]?.id ?? null);
        setLoading(false);
      })
      .catch((exception: unknown) => {
        setError(exception instanceof ApiError ? exception.displayMessage : 'Chargement impossible.');
        setLoading(false);
      });
  }, [isParent]);

  useEffect(() => {
    if (isParent) reload();
  }, [isParent, reload]);

  const select = useCallback((id: number) => setSelectedId(id), []);

  const value = useMemo<ChildrenContextValue>(() => {
    const selectedChild = kids.find((kid) => kid.id === selectedId) ?? kids[0] ?? null;

    return {
      children: kids,
      loading,
      error,
      reload,
      selectedId: selectedChild?.id ?? null,
      select,
      selectedChild,
    };
  }, [kids, loading, error, reload, selectedId, select]);

  return <ChildrenContext.Provider value={value}>{children}</ChildrenContext.Provider>;
}

export function useChildren(): ChildrenContextValue {
  const context = useContext(ChildrenContext);
  if (!context) {
    throw new Error('useChildren doit être utilisé dans <ParentChildrenProvider>.');
  }

  return context;
}

/** Sélecteur d'enfant affiché en tête des écrans parent (masqué si un seul enfant). */
export function ChildSelector() {
  const { children, selectedId, select } = useChildren();

  if (children.length <= 1) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {children.map((child) => {
        const active = child.id === selectedId;

        return (
          <Pressable
            key={child.id}
            onPress={() => select(child.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
              {fullName(child)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4, paddingRight: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.line,
    maxWidth: 180,
  },
  chipActive: {
    backgroundColor: theme.accentSoft,
    borderColor: theme.accentStrong,
  },
  chipText: { color: theme.faint, fontSize: 12.5, fontWeight: '600' },
  chipTextActive: { color: '#dfe6ff' },
});
