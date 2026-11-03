<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeeType;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class FinanceController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $year = $request->integer('year', now()->year);

        $invoiced = (float) Invoice::where('status', '!=', 'cancelled')->sum('amount');
        $collected = (float) Payment::where('status', 'completed')->sum('amount');
        $outstanding = max(0, $invoiced - $collected);
        $overdue = (float) Invoice::whereIn('status', ['pending', 'partial'])
            ->where('due_on', '<', now()->toDateString())
            ->withSum(['payments as paid_amount' => fn ($query) => $query->where('status', 'completed')], 'amount')
            ->get()
            ->sum(fn ($invoice) => max(0, (float) $invoice->amount - (float) $invoice->paid_amount));

        $monthly = Payment::query()
            ->where('status', 'completed')
            ->whereYear('paid_on', $year)
            ->get(['paid_on', 'amount'])
            ->groupBy(fn (Payment $payment) => $payment->paid_on->format('Y-m'))
            ->sortKeys()
            ->map(fn ($payments, $month) => [
                'month' => $month,
                'label' => Carbon::createFromFormat('Y-m', $month)->translatedFormat('M'),
                'total' => (float) $payments->sum('amount'),
                'payments' => $payments->count(),
            ])
            ->values();

        $byMethod = Payment::query()
            ->selectRaw('method, SUM(amount) as total, COUNT(*) as payments')
            ->where('status', 'completed')
            ->groupBy('method')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => ['method' => $row->method, 'total' => (float) $row->total, 'payments' => (int) $row->payments]);

        $byFeeType = Invoice::query()
            ->join('fee_types', 'fee_types.id', '=', 'invoices.fee_type_id')
            ->selectRaw('fee_types.name as fee, fee_types.code as code, SUM(invoices.amount) as invoiced')
            ->where('invoices.status', '!=', 'cancelled')
            ->groupBy('fee_types.name', 'fee_types.code')
            ->get()
            ->map(fn ($row) => ['fee' => $row->fee, 'code' => $row->code, 'invoiced' => (float) $row->invoiced]);

        $statusBreakdown = Invoice::query()
            ->selectRaw('status, COUNT(*) as count, SUM(amount) as total')
            ->groupBy('status')
            ->get()
            ->map(fn ($row) => ['status' => $row->status, 'count' => (int) $row->count, 'total' => (float) $row->total]);

        $topDebtors = Invoice::query()
            ->with('student:id,matricule,first_name,last_name,school_class_id', 'student.schoolClass:id,name')
            ->withSum(['payments as paid_amount' => fn ($query) => $query->where('status', 'completed')], 'amount')
            ->whereIn('status', ['pending', 'partial'])
            ->orderByDesc(DB::raw("invoices.amount - COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = invoices.id AND p.status = 'completed'), 0)"))
            ->take(10)
            ->get()
            ->map(fn ($invoice) => [
                'invoice_id' => $invoice->id,
                'reference' => $invoice->reference,
                'student' => $invoice->student,
                'amount' => (float) $invoice->amount,
                'paid' => (float) $invoice->paid_amount,
                'balance' => (float) $invoice->amount - (float) $invoice->paid_amount,
                'due_on' => $invoice->due_on?->toDateString(),
            ]);

        return response()->json([
            'kpis' => [
                'invoiced' => $invoiced,
                'collected' => $collected,
                'outstanding' => $outstanding,
                'overdue' => $overdue,
                'collection_rate' => $invoiced > 0 ? round($collected / $invoiced * 100, 1) : 0,
            ],
            'monthly' => $monthly,
            'by_method' => $byMethod,
            'by_fee_type' => $byFeeType,
            'by_status' => $statusBreakdown,
            'top_debtors' => $topDebtors,
            'fee_types' => FeeType::where('is_active', true)->get(),
        ]);
    }
}
