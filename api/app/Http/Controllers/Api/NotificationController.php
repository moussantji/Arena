<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = AppNotification::query()
            ->when($request->has('unread'), fn ($query) => $query->whereNull('read_at'))
            ->when($request->filled('type'), fn ($query) => $query->where('type', $request->string('type')))
            ->latest()
            ->paginate($request->integer('per_page', 20))
            ->withQueryString();

        return response()->json($notifications);
    }

    public function markRead(AppNotification $notification): JsonResponse
    {
        $notification->update(['read_at' => now()]);

        return response()->json(['notification' => $notification->fresh()]);
    }

    public function markAllRead(): JsonResponse
    {
        $updated = AppNotification::whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['updated' => $updated]);
    }

    public function destroy(AppNotification $notification): JsonResponse
    {
        $notification->delete();

        return response()->json(status: 204);
    }
}
