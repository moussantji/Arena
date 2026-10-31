<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MessageThread;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MessageThreadController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $threads = MessageThread::query()
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

        $thread = MessageThread::create([
            'subject' => $data['subject'],
            'type' => $data['type'] ?? 'parent',
            'created_by' => $request->user()?->id,
            'last_message_at' => now(),
        ]);

        $thread->messages()->create([
            'sender_type' => $request->user() ? 'staff' : 'guardian',
            'sender_id' => $request->user()?->id,
            'sender_name' => $data['sender_name'] ?? $request->user()?->name ?? 'Direction',
            'body' => $data['body'],
            'sent_at' => now(),
        ]);

        return response()->json(['thread' => $thread->load('latestMessage')->loadCount('messages')], 201);
    }

    public function show(MessageThread $thread): JsonResponse
    {
        $thread->load(['messages' => fn ($query) => $query->orderBy('sent_at'), 'creator:id,name']);

        return response()->json(['thread' => $thread]);
    }

    public function update(Request $request, MessageThread $thread): JsonResponse
    {
        $thread->update($request->validate([
            'subject' => ['sometimes', 'string', 'max:180'],
            'type' => ['sometimes', Rule::in(['parent', 'internal'])],
            'is_archived' => ['sometimes', 'boolean'],
        ]));

        return response()->json(['thread' => $thread->fresh()->load('latestMessage')]);
    }

    public function storeMessage(Request $request, MessageThread $thread): JsonResponse
    {
        $data = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
            'sender_type' => ['nullable', Rule::in(['staff', 'guardian', 'system'])],
            'sender_name' => ['nullable', 'string', 'max:120'],
        ]);

        $message = $thread->messages()->create([
            'sender_type' => $data['sender_type'] ?? ($request->user() ? 'staff' : 'guardian'),
            'sender_id' => $request->user()?->id,
            'sender_name' => $data['sender_name'] ?? $request->user()?->name ?? 'Direction',
            'body' => $data['body'],
            'sent_at' => now(),
        ]);

        $thread->update(['last_message_at' => now(), 'is_archived' => false]);

        return response()->json(['message' => $message], 201);
    }

    public function markRead(MessageThread $thread): JsonResponse
    {
        $thread->messages()->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json([
            'thread' => $thread->fresh()
                ->load('latestMessage')
                ->loadCount(['messages as unread_count' => fn ($query) => $query->whereNull('read_at')]),
        ]);
    }

    public function destroy(MessageThread $thread): JsonResponse
    {
        $thread->delete();

        return response()->json(status: 204);
    }
}
