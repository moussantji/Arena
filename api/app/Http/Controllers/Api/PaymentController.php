<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $payments = Payment::query()
            ->with([
                'student:id,matricule,first_name,last_name,school_class_id',
                'student.schoolClass:id,name,level',
                'invoice:id,reference,amount,status',
            ])
            ->when($request->filled('student_id'), fn ($query) => $query->where('student_id', $request->integer('student_id')))
            ->when($request->filled('invoice_id'), fn ($query) => $query->where('invoice_id', $request->integer('invoice_id')))
            ->when($request->filled('method'), fn ($query) => $query->where('method', $request->string('method')))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('from'), fn ($query) => $query->where('paid_on', '>=', $request->date('from')))
            ->when($request->filled('to'), fn ($query) => $query->where('paid_on', '<=', $request->date('to')))
            ->when($request->filled('q'), function ($query) use ($request) {
                $term = '%'.$request->input('q').'%';
                $query->where(function ($search) use ($term) {
                    $search->where('reference', 'like', $term)
                        ->orWhereHas('student', fn ($student) => $student
                            ->where('first_name', 'like', $term)
                            ->orWhere('last_name', 'like', $term)
                            ->orWhere('matricule', 'like', $term))
                        ->orWhereHas('invoice', fn ($invoice) => $invoice->where('reference', 'like', $term));
                });
            })
            ->latest('paid_on')
            ->latest('id')
            ->paginate($request->integer('per_page', 25))
            ->withQueryString();

        return response()->json($payments);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $invoice = isset($data['invoice_id']) ? Invoice::find($data['invoice_id']) : null;
        $data['student_id'] ??= $invoice?->student_id;
        $payment = Payment::create($data);

        if ($invoice) {
            $this->refreshInvoiceStatus($invoice);
        }

        return response()->json([
            'payment' => $payment->load('student:id,first_name,last_name,matricule', 'invoice:id,reference,amount,status'),
        ], 201);
    }

    public function show(Payment $payment): JsonResponse
    {
        return response()->json(['payment' => $payment->load('student', 'invoice')]);
    }

    public function update(Request $request, Payment $payment): JsonResponse
    {
        $payment->update($request->validate($this->rules($payment)));
        if ($payment->invoice) {
            $this->refreshInvoiceStatus($payment->invoice);
        }

        return response()->json(['payment' => $payment->fresh()->load('student:id,first_name,last_name,matricule', 'invoice:id,reference,amount,status')]);
    }

    public function destroy(Payment $payment): JsonResponse
    {
        $invoice = $payment->invoice;
        $payment->delete();
        if ($invoice) {
            $this->refreshInvoiceStatus($invoice);
        }

        return response()->json(status: 204);
    }

    private function refreshInvoiceStatus(Invoice $invoice): void
    {
        if ($invoice->status === 'cancelled') {
            return;
        }

        $paid = (float) $invoice->payments()->where('status', 'completed')->sum('amount');
        $amount = (float) $invoice->amount;

        $invoice->update([
            'status' => match (true) {
                $amount > 0 && $paid >= $amount => 'paid',
                $paid > 0 => 'partial',
                default => 'pending',
            },
        ]);
    }

    private function rules(?Payment $payment = null): array
    {
        return [
            'invoice_id' => ['nullable', 'integer', 'exists:invoices,id'],
            'student_id' => [
                $payment ? 'sometimes' : 'nullable',
                'integer',
                'exists:students,id',
                Rule::requiredIf(! $payment && ! request()->filled('invoice_id')),
            ],
            'amount' => [$payment ? 'sometimes' : 'required', 'numeric', 'min:0.01'],
            'method' => ['nullable', Rule::in(['cash', 'mobile_money', 'bank', 'card', 'other'])],
            'paid_on' => [$payment ? 'sometimes' : 'required', 'date'],
            'reference' => ['nullable', 'string', 'max:80'],
            'status' => ['nullable', Rule::in(['completed', 'pending', 'failed'])],
            'receipt_path' => ['nullable', 'string', 'max:255'],
        ];
    }
}
