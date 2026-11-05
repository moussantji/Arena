<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Consultation du journal de traçabilité (Direction uniquement).
 * Lecture seule : on n'écrit jamais via cette route.
 */
class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'subject_type' => ['nullable', 'string', 'max:40'],
            'action' => ['nullable', 'string', 'max:40'],
            'q' => ['nullable', 'string', 'max:120'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $logs = AuditLog::query()
            ->when($filters['subject_type'] ?? null, fn ($query, $type) => $query->where('subject_type', $type))
            ->when($filters['action'] ?? null, fn ($query, $action) => $query->where('action', 'like', $action.'.%'))
            ->when($filters['q'] ?? null, fn ($query, $q) => $query->where(
                fn ($sub) => $sub->where('description', 'like', '%'.$q.'%')
                    ->orWhere('user_name', 'like', '%'.$q.'%')
            ))
            ->when($filters['from'] ?? null, fn ($query, $from) => $query->where('created_at', '>=', Carbon::parse($from)->startOfDay()))
            ->when($filters['to'] ?? null, fn ($query, $to) => $query->where('created_at', '<=', Carbon::parse($to)->endOfDay()))
            ->latest('created_at')
            ->latest('id')
            ->paginate($filters['per_page'] ?? 20)
            ->withQueryString();

        $logs->getCollection()->transform(fn (AuditLog $log) => [
            'id' => $log->id,
            'created_at' => $log->created_at?->toIso8601String(),
            'user_name' => $log->user_name,
            'action' => $log->action,
            'subject_type' => $log->subject_type,
            'subject_id' => $log->subject_id,
            'description' => $log->description,
            'properties' => $log->properties,
        ]);

        return response()->json($logs);
    }
}
