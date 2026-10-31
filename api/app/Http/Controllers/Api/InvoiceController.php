<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $invoices = Invoice::query()
            ->with([
                'student:id,matricule,first_name,last_name,school_class_id',
                'student.schoolClass:id,name,level',
                'feeType:id,name,code',
                'term:id,name',
            ])
            ->withSum(['payments as paid_amount' => fn ($query) => $query->where('status', 'completed')], 'amount')
            ->when($request->filled('student_id'), fn ($query) => $query->where('student_id', $request->integer('student_id')))
            ->when($request->filled('class_id'), fn ($query) => $query->whereHas('student', fn ($q) => $q->where('school_class_id', $request->integer('class_id'))))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('term_id'), fn ($query) => $query->where('term_id', $request->integer('term_id')))
            ->when($request->boolean('overdue'), fn ($query) => $query->whereIn('status', ['pending', 'partial'])->where('due_on', '<', now()->toDateString()))
            ->when($request->filled('q'), function ($query) use ($request) {
                $term = '%'.$request->input('q').'%';
                $query->where(function ($search) use ($term) {
                    $search->where('reference', 'like', $term)
                        ->orWhereHas('student', fn ($student) => $student
                            ->where('first_name', 'like', $term)
                            ->orWhere('last_name', 'like', $term)
                            ->orWhere('matricule', 'like', $term))
                        ->orWhereHas('feeType', fn ($fee) => $fee->where('name', 'like', $term));
                });
            })
            ->orderByDesc('issued_on')
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 25))
            ->withQueryString();

        return response()->json($invoices);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $data['reference'] ??= 'FAC-'.now()->format('Y').'-'.Str::upper(Str::random(6));
        $invoice = Invoice::create($data);

        return response()->json(['invoice' => $invoice->load('student:id,first_name,last_name,matricule', 'feeType:id,name')], 201);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        $invoice->load([
            'student:id,matricule,first_name,last_name,guardian_name,guardian_phone,school_class_id',
            'student.schoolClass:id,name,level',
            'feeType',
            'term:id,name',
            'payments' => fn ($query) => $query->latest('paid_on'),
        ]);

        return response()->json([
            'invoice' => $invoice,
            'paid_amount' => (float) $invoice->payments->where('status', 'completed')->sum('amount'),
            'balance' => (float) $invoice->amount - (float) $invoice->payments->where('status', 'completed')->sum('amount'),
        ]);
    }

    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        $invoice->update($request->validate($this->rules($invoice)));

        return response()->json(['invoice' => $invoice->fresh()->load('student:id,first_name,last_name,matricule', 'feeType:id,name')]);
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        $invoice->delete();

        return response()->json(status: 204);
    }

    private function rules(?Invoice $invoice = null): array
    {
        $issuedOn = request()->input('issued_on', $invoice?->issued_on?->toDateString());

        return [
            'reference' => ['nullable', 'string', 'max:60', Rule::unique('invoices', 'reference')->ignore($invoice?->id)],
            'student_id' => [$invoice ? 'sometimes' : 'required', 'integer', 'exists:students,id'],
            'fee_type_id' => ['nullable', 'integer', 'exists:fee_types,id'],
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'term_id' => ['nullable', 'integer', 'exists:terms,id'],
            'issued_on' => [$invoice ? 'sometimes' : 'required', 'date'],
            'due_on' => [$invoice ? 'sometimes' : 'required', 'date', $issuedOn ? 'after_or_equal:'.$issuedOn : ''],
            'amount' => [$invoice ? 'sometimes' : 'required', 'numeric', 'min:0'],
            'status' => ['nullable', Rule::in(['paid', 'pending', 'partial', 'cancelled'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
