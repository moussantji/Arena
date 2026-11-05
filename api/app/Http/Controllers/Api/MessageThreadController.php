<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MessageThread;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class MessageThreadController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $threads = $this->visibleThreads($request)
            ->with(['latestMessage', 'creator:id,name'])
            ->withCount(['messages as unread_count' => fn ($query) => $query->whereNull('read_at')])
            ->when($request->filled('type'), fn ($query) => $query->where('type', $request->string('type')))
            ->when($request->has('archived'), fn ($query) => $query->where('is_archived', $request->boolean('archived')))
            ->when($request->boolean('unread'), fn ($query) => $query->whereHas('messages', fn ($q) => $q->whereNull('read_at')))
            ->orderByDesc('last_message_at')
            ->orderByDesc('id')
            ->get();

        return response()->json(['threads' => $threads]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:180'],
            'type' => ['nullable', Rule::in(['parent', 'internal'])],
            'body' => ['required', 'string', 'max:5000'],
            'sender_name' => ['nullable', 'string', 'max:120'],
        ]);

        $isParentOnly = $this->isParentOnly($request->user());
        // Un compte parent ne peut pas ouvrir un fil interne au personnel.
        $type = $isParentOnly ? 'parent' : ($data['type'] ?? 'parent');

        $thread = MessageThread::create([
            'subject' => $data['subject'],
            'type' => $type,
            'created_by' => $request->user()?->id,
            'last_message_at' => now(),
        ]);

        $thread->messages()->create([
            'sender_type' => $this->senderType($request->user()),
            'sender_id' => $request->user()?->id,
            'sender_name' => $data['sender_name'] ?? $request->user()?->name ?? 'École',
            'body' => $data['body'],
            'sent_at' => now(),
        ]);

        return response()->json(['thread' => $thread->load('latestMessage')->loadCount('messages')], 201);
    }

    public function show(Request $request, MessageThread $thread): JsonResponse
    {
        $this->assertVisible($request, $thread);
        $thread->load(['messages' => fn ($query) => $query->orderBy('sent_at'), 'creator:id,name']);

        return response()->json(['thread' => $thread]);
    }

    public function update(Request $request, MessageThread $thread): JsonResponse
    {
        $this->assertVisible($request, $thread);
        $data = $request->validate([
            'subject' => ['sometimes', 'string', 'max:180'],
            'type' => ['sometimes', Rule::in(['parent', 'internal'])],
            'is_archived' => ['sometimes', 'boolean'],
        ]);
        if ($this->isParentOnly($request->user())) {
            unset($data['type']);
        }
        $thread->update($data);

        return response()->json(['thread' => $thread->fresh()->load('latestMessage')]);
    }

    public function storeMessage(Request $request, MessageThread $thread): JsonResponse
    {
        $this->assertVisible($request, $thread);
        $data = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
            'sender_type' => ['nullable', Rule::in(['staff', 'guardian', 'system'])],
            'sender_name' => ['nullable', 'string', 'max:120'],
        ]);

        $forcedSenderType = $this->senderType($request->user());
        $message = $thread->messages()->create([
            'sender_type' => $this->isParentOnly($request->user()) ? 'guardian' : ($data['sender_type'] ?? $forcedSenderType),
            'sender_id' => $request->user()?->id,
            'sender_name' => $data['sender_name'] ?? $request->user()?->name ?? 'Direction',
            'body' => $data['body'],
            'sent_at' => now(),
        ]);

        $thread->update(['last_message_at' => now(), 'is_archived' => false]);

        return response()->json(['message' => $message], 201);
    }

    public function markRead(Request $request, MessageThread $thread): JsonResponse
    {
        $this->assertVisible($request, $thread);
        $thread->messages()->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json([
            'thread' => $thread->fresh()
                ->load('latestMessage')
                ->loadCount(['messages as unread_count' => fn ($query) => $query->whereNull('read_at')]),
        ]);
    }

    public function destroy(Request $request, MessageThread $thread): JsonResponse
    {
        $this->assertVisible($request, $thread);
        $thread->delete();

        return response()->json(status: 204);
    }

    /**
     * Fils visibles par l'utilisateur courant : tout pour le personnel,
     * uniquement les fils créés par lui-même pour un compte parent.
     */
    private function visibleThreads(Request $request): Builder
    {
        $query = MessageThread::query();
        if ($this->isParentOnly($request->user())) {
            $query->where('created_by', $request->user()->id);
        }

        return $query;
    }

    /** Un compte est « parent seul » quand il n'a aucun rôle du personnel. */
    private function isParentOnly(?User $user): bool
    {
        if (! $user || ! $user->hasAnyRole(User::ROLE_PARENT)) {
            return false;
        }

        return ! $user->hasAnyRole(
            User::ROLE_DIRECTION,
            User::ROLE_SECRETARIAT,
            User::ROLE_COMPTABLE,
            User::ROLE_ENSEIGNANT,
        );
    }

    private function senderType(?User $user): string
    {
        return $this->isParentOnly($user) ? 'guardian' : 'staff';
    }

    /**
     * Un parent n'a accès ni aux fils qu'il n'a pas créés ni aux fils
     * internes du personnel : 404, sans révéler leur existence.
     */
    private function assertVisible(Request $request, MessageThread $thread): void
    {
        if (! $this->isParentOnly($request->user())) {
            return;
        }
        if ((int) $thread->created_by !== (int) $request->user()->id) {
            throw new NotFoundHttpException('Fil introuvable.');
        }
    }
}
