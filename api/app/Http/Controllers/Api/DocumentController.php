<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $documents = Document::query()
            ->with('student:id,matricule,first_name,last_name,school_class_id')
            ->when($request->filled('student_id'), fn ($query) => $query->where('student_id', $request->integer('student_id')))
            ->when($request->filled('type'), fn ($query) => $query->where('type', $request->string('type')))
            ->latest('issued_on')
            ->latest('id')
            ->paginate($request->integer('per_page', 30))
            ->withQueryString();

        $documents->getCollection()->transform(function (Document $document) {
            $document->setAttribute('url', Storage::disk('public')->url($document->file_path));

            return $document;
        });

        return response()->json($documents);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'name' => ['required', 'string', 'max:180'],
            'type' => ['nullable', 'string', 'max:40'],
            'issued_on' => ['nullable', 'date'],
            'file' => ['required', 'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,webp,doc,docx'],
        ]);

        $student = Student::findOrFail($data['student_id']);
        $file = $request->file('file');
        $path = $file->store('documents/'.$student->matricule, 'public');

        $document = Document::create([
            'student_id' => $student->id,
            'name' => $data['name'],
            'type' => $data['type'] ?? strtolower($file->getClientOriginalExtension() ?: 'pdf'),
            'file_path' => $path,
            'size_bytes' => $file->getSize(),
            'issued_on' => $data['issued_on'] ?? now()->toDateString(),
        ]);

        return response()->json([
            'document' => $document->load('student:id,matricule,first_name,last_name'),
            'url' => Storage::disk('public')->url($path),
        ], 201);
    }

    public function show(Document $document): JsonResponse
    {
        return response()->json([
            'document' => $document->load('student:id,matricule,first_name,last_name'),
            'url' => Storage::disk('public')->url($document->file_path),
        ]);
    }

    public function download(Document $document)
    {
        $disk = Storage::disk('public');
        if (! $disk->exists($document->file_path)) {
            return response()->json(['message' => 'Fichier introuvable.'], 404);
        }

        return $disk->download($document->file_path, $document->name.'.'.$document->type);
    }

    public function destroy(Document $document): JsonResponse
    {
        Storage::disk('public')->delete($document->file_path);
        $document->delete();

        return response()->json(status: 204);
    }
}
