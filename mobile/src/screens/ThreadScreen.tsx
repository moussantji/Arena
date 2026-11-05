/** Fil de discussion : historique + réponse. */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { useRoute, type RouteProp } from '@react-navigation/native';
import type { ScrollViewInstance } from 'react-native';
import { api, ApiError } from '../api';
import { theme } from '../theme';
import { Empty, ErrorState, Loading } from '../ui';
import { formatTime } from '../format';
import { useAuth, isStaff } from '../auth';
import { useApiQuery } from '../useApiQuery';
import type { Message, Thread } from '../types';
import type { RootStackParamList } from '../RootNavigator';

export default function ThreadScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Discussion'>>();
  const { threadId } = route.params;
  const { user } = useAuth();
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const thread = useApiQuery<{ thread: Thread }>(
    () => api.get<{ thread: Thread }>(`/threads/${threadId}`),
    [threadId],
  );

  // Fil marqué comme lu à l'ouverture et après chaque réponse.
  const markRead = useCallback(() => {
    void api.post(`/threads/${threadId}/read`).catch(() => undefined);
  }, [threadId]);

  useEffect(() => {
    if (thread.data) markRead();
  }, [thread.data, markRead]);

  const messages = thread.data?.thread.messages ?? [];

  const send = async () => {
    const body = reply.trim();
    if (!body) return;
    Keyboard.dismiss();
    setSending(true);
    try {
      await api.post(`/threads/${threadId}/messages`, {
        body,
        sender_type: isStaff(user?.role) ? 'staff' : 'guardian',
      });
      setReply('');
      thread.reload();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    } catch (exception) {
      Alert.alert('Envoi impossible', exception instanceof ApiError ? exception.displayMessage : 'Réessayez.');
    } finally {
      setSending(false);
    }
  };

  if (thread.loading && !thread.data) return <Loading />;
  if (!thread.data) {
    return (
      <View style={styles.fill}>
        <ErrorState message={thread.error ?? undefined} onRetry={thread.reload} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.length === 0 ? (
          <Empty title="Aucun message" sub="Soyez le premier à écrire dans ce fil." />
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} mine={message.sender_id === user?.id} />
          ))
        )}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          style={styles.composerInput}
          value={reply}
          onChangeText={setReply}
          placeholder="Votre message…"
          placeholderTextColor={theme.faint}
          multiline
          maxLength={5000}
          selectionColor={theme.accent}
          accessibilityLabel="Votre message"
        />
        <Pressable
          onPress={() => void send()}
          disabled={sending || reply.trim().length === 0}
          style={({ pressed }) => [
            styles.sendButton,
            (sending || reply.trim().length === 0) && styles.sendDisabled,
            pressed && styles.sendPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Envoyer le message"
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendIcon}>➤</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message, mine }: { message: Message; mine: boolean }) {
  const senderLabel = mine ? 'Vous' : (message.sender_name ?? (message.sender_type === 'guardian' ? 'Parent' : 'École'));

  return (
    <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        {!mine ? <Text style={styles.sender}>{senderLabel}</Text> : null}
        <Text style={styles.body}>{message.body}</Text>
        <Text style={[styles.time, mine && styles.timeMine]}>{formatTime(message.sent_at)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  fill: { flex: 1, backgroundColor: theme.bg },
  scroll: { flex: 1 },
  messages: { padding: 14, gap: 8 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '82%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 3,
  },
  bubbleMine: {
    backgroundColor: theme.accentStrong,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.line,
    borderBottomLeftRadius: 4,
  },
  sender: { color: theme.faint, fontSize: 9.5, fontWeight: '700', letterSpacing: 0.3 },
  body: { color: theme.ink, fontSize: 13.5, lineHeight: 18 },
  time: { color: theme.faint, fontSize: 9, alignSelf: 'flex-end' },
  timeMine: { color: 'rgba(255, 255, 255, 0.75)' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'android' ? 10 : 18,
    borderTopWidth: 1,
    borderTopColor: theme.line,
    backgroundColor: '#080d28',
  },
  composerInput: {
    flex: 1,
    backgroundColor: theme.surfaceAlt,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.line,
    color: theme.ink,
    fontSize: 14,
    maxHeight: 120,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.accentStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.35 },
  sendPressed: { opacity: 0.8 },
  sendIcon: { color: '#fff', fontSize: 17 },
});
