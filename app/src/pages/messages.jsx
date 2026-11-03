import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar, Btn, Card, Icon, IconBtn, Pill, Tabs,
} from '../ui.jsx';
import {
  useApi, useData, dateTime, time, fullName, initials,
} from '../data.jsx';
import { useActions } from '../actions.jsx';
import { ActionMenu, ListState, SearchInput } from '../forms.jsx';
import { PageHead } from './common.jsx';
import { api } from '../api.js';

const typeLabel = (type) => (type === 'internal' ? 'Équipe interne' : 'Familles');

export function Messagerie() {
  const {
    user, refresh, loadThreads, notify,
  } = useData();
  const actions = useActions();
  const [tab, setTab] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [q, setQ] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [marking, setMarking] = useState(false);
  const marked = useRef(new Set());
  const composer = useRef(null);

  const params = useMemo(() => {
    if (tab === 1) return { unread: 1 };
    if (tab === 2) return { type: 'parent' };
    if (tab === 3) return { type: 'internal' };
    if (tab === 4) return { archived: 1 };
    return {};
  }, [tab]);

  const threads = useApi('/threads', params);
  const rows = threads.data?.threads || [];

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((thread) => [
      thread.subject,
      thread.latest_message?.body,
      thread.latest_message?.sender_name,
      thread.creator?.name,
    ].filter(Boolean).join(' ').toLowerCase().includes(term));
  }, [rows, q]);

  useEffect(() => {
    if (!rows.length) {
      if (selectedId) setSelectedId(null);
      return;
    }
    if (!selectedId || !rows.some((thread) => thread.id === selectedId)) {
      setSelectedId(rows[0].id);
    }
  }, [rows, selectedId]);

  const thread = useApi(selectedId ? `/threads/${selectedId}` : null, undefined, { enabled: Boolean(selectedId) });
  const active = thread.data?.thread;
  const messages = active?.messages || [];

  useEffect(() => {
    const current = thread.data?.thread;
    if (!current) return;
    const lastUnread = [...(current.messages || [])].reverse().find((message) => !message.read_at);
    if (!lastUnread) return;
    const key = `${current.id}:${lastUnread.id}`;
    if (marked.current.has(key)) return;
    marked.current.add(key);
    api.post(`/threads/${current.id}/read`)
      .then(() => {
        thread.reload();
        loadThreads();
      })
      .catch(() => {
        marked.current.delete(key);
      });
  }, [thread.data, thread.reload, loadThreads]);

  const send = async (event) => {
    event?.preventDefault();
    const text = body.trim();
    if (!text || !selectedId || sending) return;
    setSending(true);
    try {
      await api.post(`/threads/${selectedId}/messages`, {
        body: text,
        sender_type: 'staff',
        sender_name: user?.name || 'Direction',
      });
      setBody('');
      thread.reload();
      refresh();
      window.setTimeout(() => composer.current?.focus(), 60);
    } catch (error) {
      notify(error.message || 'Impossible d’envoyer le message.', { tone: 'danger' });
    } finally {
      setSending(false);
    }
  };

  const markAll = async () => {
    const unread = rows.filter((item) => Number(item.unread_count || 0) > 0);
    if (!unread.length) {
      notify('Aucune conversation non lue.');
      return;
    }
    setMarking(true);
    try {
      await Promise.all(unread.map((item) => api.post(`/threads/${item.id}/read`)));
      notify(`${unread.length} conversation${unread.length > 1 ? 's' : ''} marquée${unread.length > 1 ? 's' : ''} comme lue${unread.length > 1 ? 's' : ''}.`);
      refresh();
      if (selectedId) thread.reload();
    } catch (error) {
      notify(error.message || 'Impossible de marquer les messages comme lus.', { tone: 'danger' });
    } finally {
      setMarking(false);
    }
  };

  const toggleArchive = async () => {
    if (!active) return;
    try {
      await api.patch(`/threads/${active.id}`, { is_archived: !active.is_archived });
      notify(active.is_archived ? 'Conversation désarchivée.' : 'Conversation archivée.');
      thread.reload();
      refresh();
    } catch (error) {
      notify(error.message || 'Impossible de modifier cette conversation.', { tone: 'danger' });
    }
  };

  const activeInitials = initials(active?.creator?.name || active?.subject || '');
  const unreadTotal = rows.reduce((sum, item) => sum + Number(item.unread_count || 0), 0);

  return (
    <>
      <PageHead
        id="messagerie"
        sub={`${rows.length} conversations · ${unreadTotal} message${unreadTotal > 1 ? 's' : ''} non lu${unreadTotal > 1 ? 's' : ''}`}
        onPrimary={() => actions.thread()}
        onSecondary={marking ? undefined : markAll}
        secondary="Tout marquer lu"
      />

      <div className="toolbar rise">
        <Tabs
          items={['Toutes', 'Non lues', 'Familles', 'Interne', 'Archivées']}
          active={tab}
          onChange={(index) => { setTab(index); setSelectedId(null); }}
        />
        <div className="toolbar-right">
          <SearchInput value={q} onChange={setQ} placeholder="Objet, message, expéditeur…" />
          <Btn icon="plus" solid onClick={() => actions.thread()}>Nouveau message</Btn>
        </div>
      </div>

      <Card className="messenger rise" pad={false} style={{ animationDelay: '80ms' }}>
        <div className="msg-list">
          <div className="msg-list-head">
            <span>Conversations</span>
            <Pill tone="muted">{filtered.length}</Pill>
          </div>
          <div className="msg-scroll">
            <ListState
              loading={threads.loading && !threads.data}
              error={threads.error}
              empty={!threads.loading && !threads.error && !filtered.length}
              emptyTitle="Aucune conversation"
              emptySub="Ce filtre ne contient aucun message."
              onRetry={threads.reload}
              rows={3}
            >
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`msg-thread ${selectedId === item.id ? 'active' : ''} ${!item.is_archived ? '' : 'archived'}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <Avatar initials={initials(item.latest_message?.sender_name || item.creator?.name || item.subject)} size={30} tone={item.unread_count ? 'accent' : 'muted'} />
                  <span className="mt-main">
                    <b>{item.subject}</b>
                    <em>{item.latest_message?.sender_name ? `${item.latest_message.sender_name} · ` : ''}{item.latest_message?.body || 'Aucun message'}</em>
                  </span>
                  <span className="mt-meta">
                    <time>{item.last_message_at ? time(item.last_message_at) : '—'}</time>
                    {item.unread_count > 0
                      ? <i className="mt-unread">{item.unread_count}</i>
                      : <i className="mt-read" />}
                  </span>
                </button>
              ))}
            </ListState>
          </div>
        </div>

        <div className="msg-pane">
          {!selectedId && (
            <div className="msg-empty">
              <span className="state-ic"><Icon name="messages" size={20} /></span>
              <b>Sélectionnez une conversation</b>
              <span>Les messages avec les familles et l’équipe apparaissent ici.</span>
            </div>
          )}

          {selectedId && thread.error && (
            <div className="state-box state-error"><b>Conversation indisponible</b><span>{thread.error.message}</span><Btn icon="refresh" onClick={thread.reload}>Réessayer</Btn></div>
          )}

          {selectedId && thread.loading && !active && (
            <div className="msg-empty"><span className="spinner large" /><b>Chargement de la conversation…</b></div>
          )}

          {active && (
            <>
              <div className="msg-head">
                <div className="msg-head-main">
                  <Avatar initials={activeInitials} size={34} />
                  <span>
                    <b>{active.subject}</b>
                    <span>{typeLabel(active.type)} · {active.creator?.name || 'Direction'} · {messages.length} messages</span>
                  </span>
                </div>
                <div className="msg-head-actions">
                  <Pill tone="muted">{active.is_archived ? 'Archivée' : 'Ouverte'}</Pill>
                  <IconBtn icon="archive" title={active.is_archived ? 'Désarchiver' : 'Archiver'} onClick={toggleArchive} />
                  <ActionMenu actions={[
                    { label: 'Modifier la conversation', icon: 'edit', onClick: () => actions.threadEdit(active) },
                    { label: active.is_archived ? 'Désarchiver' : 'Archiver', icon: 'archive', onClick: toggleArchive },
                    { label: 'Supprimer', icon: 'trash', tone: 'danger', onClick: () => actions.deleteThread(active) },
                  ]} />
                </div>
              </div>

              <div className="msg-body">
                {messages.map((message) => {
                  const out = message.sender_type === 'staff';
                  return (
                    <div className={`bubble ${out ? 'out' : 'in'}`} key={message.id}>
                      <span className="bubble-who">{message.sender_name || (out ? 'Direction' : 'Famille')}</span>
                      <p>{message.body}</p>
                      <time>{dateTime(message.sent_at)}{!message.read_at && !out ? ' · non lu' : ''}</time>
                    </div>
                  );
                })}
                {!messages.length && <div className="state-inline">Aucun message dans cette conversation.</div>}
              </div>

              <form className="msg-compose" onSubmit={send}>
                <textarea
                  ref={composer}
                  className="input textarea"
                  rows={2}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Écrire un message… (Entrée pour envoyer)"
                  aria-label="Message"
                />
                <button type="submit" className="btn solid msg-send" disabled={sending || !body.trim()}>
                  {sending ? <span className="spinner" /> : <Icon name="send" size={15} />}
                  <span>{sending ? 'Envoi…' : 'Envoyer'}</span>
                </button>
              </form>
            </>
          )}
        </div>
      </Card>
    </>
  );
}
