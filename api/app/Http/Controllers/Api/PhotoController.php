<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Photo;
use App\Models\School;
use App\Models\Staff;
use App\Models\Student;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PhotoController extends Controller
{
    public function storeStudentPhoto(Request $request, Student $student): JsonResponse
    {
        return $this->store($request, $student, true, 'student', 'Photo de l’élève mise à jour.');
    }

    public function storeStudentPhotos(Request $request, Student $student): JsonResponse
    {
        return $this->store($request, $student, false, 'student', 'Photos ajoutées au dossier de l’élève.');
    }

    public function storeStaffPhoto(Request $request, Staff $staff): JsonResponse
    {
        return $this->store($request, $staff, true, 'staff', 'Photo du membre du personnel mise à jour.');
    }

    public function storeStaffPhotos(Request $request, Staff $staff): JsonResponse
    {
        return $this->store($request, $staff, false, 'staff', 'Photos ajoutées au membre du personnel.');
    }

    public function storeSchoolPhoto(Request $request): JsonResponse
    {
        return $this->store($request, School::firstOrFail(), true, 'school', 'Logo de l’établissement mis à jour.');
    }

    public function storeSchoolPhotos(Request $request): JsonResponse
    {
        return $this->store($request, School::firstOrFail(), false, 'school', 'Photos ajoutées à l’établissement.');
    }

    public function storeAvatar(Request $request): JsonResponse
    {
        return $this->store($request, $request->user(), true, 'user', 'Photo de profil mise à jour.');
    }

    public function destroy(Photo $photo): JsonResponse
    {
        $photo->delete();

        return response()->json([
            'message' => 'Photo supprimée.',
            'photo_url' => null,
        ]);
    }

    private function store(
        Request $request,
        Model $model,
        bool $replace,
        string $modelKey,
        string $message,
    ): JsonResponse {
        $request->validate([
            'photo' => ['required_without_all:photos,avatar', 'image', 'max:8192'],
            'photos' => ['required_without_all:photo,avatar', 'array', 'max:10'],
            'photos.*' => ['image', 'max:8192'],
            'avatar' => ['required_without_all:photo,photos', 'image', 'max:8192'],
        ], [
            'photo.required_without_all' => 'Choisissez une image à téléverser.',
            'photos.required_without_all' => 'Choisissez au moins une image à téléverser.',
            'avatar.required_without_all' => 'Choisissez une image à téléverser.',
            'photo.image' => 'Le fichier doit être une image (JPG, PNG ou WebP).',
            'photos.array' => 'Le format des photos est invalide.',
            'photos.max' => 'Vous pouvez téléverser 10 photos maximum à la fois.',
            'photos.*.image' => 'Chaque fichier doit être une image (JPG, PNG ou WebP).',
            'photo.max' => 'L’image ne doit pas dépasser 8 Mo.',
            'photos.*.max' => 'Chaque image ne doit pas dépasser 8 Mo.',
            'avatar.image' => 'Le fichier doit être une image (JPG, PNG ou WebP).',
            'avatar.max' => 'L’image ne doit pas dépasser 8 Mo.',
        ]);

        $files = [];

        if ($file = $request->file('photo')) {
            $files[] = $file;
        }

        if ($file = $request->file('avatar')) {
            $files[] = $file;
        }

        $photos = $request->file('photos', []);
        foreach (is_array($photos) ? $photos : [$photos] as $file) {
            if ($file) {
                $files[] = $file;
            }
        }

        if ($files === []) {
            throw ValidationException::withMessages([
                'photo' => 'Choisissez au moins une image à téléverser.',
            ]);
        }

        if ($replace) {
            $model->photos()->get()->each(fn (Photo $photo) => $photo->delete());
        }

        $model->attachfiles($files);
        $model->load('photos');
        $photo = $model->photos->first();

        return response()->json([
            'message' => $message,
            'photo_url' => $photo?->getImageUrl(),
            'photos' => $model->photos,
            $modelKey => $model,
        ], 201);
    }
}
