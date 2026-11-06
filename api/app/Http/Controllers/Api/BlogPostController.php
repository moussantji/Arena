<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class BlogPostController extends Controller
{
    /* ---------------- Lecture publique ---------------- */

    public function index(Request $request): JsonResponse
    {
        $posts = BlogPost::published()
            ->with('photos:id,blog_post_id,filename')
            ->when($request->filled('q'), function ($query) use ($request) {
                $term = '%'.$request->string('q')->toString().'%';
                $query->where(fn ($w) => $w
                    ->where('title', 'like', $term)
                    ->orWhere('summary', 'like', $term)
                    ->orWhere('category', 'like', $term));
            })
            ->when($request->filled('category'), fn ($query) => $query->where('category', $request->string('category')))
            ->orderByDesc('published_at')
            ->paginate($request->integer('per_page', 12))
            ->withQueryString();

        $posts->getCollection()->transform(fn (BlogPost $post) => $this->payload($post));

        return response()->json($posts);
    }

    public function show(string $slug): JsonResponse
    {
        $post = BlogPost::published()
            ->where('slug', $slug)
            ->with('photos:id,blog_post_id,filename')
            ->first();

        if (! $post) {
            return response()->json(['message' => 'Article introuvable.'], 404);
        }

        return response()->json(['post' => $this->payload($post)]);
    }

    /* ---------------- Gestion (direction, secrétariat) ---------------- */

    public function adminIndex(Request $request): JsonResponse
    {
        $posts = BlogPost::query()
            ->with('photos:id,blog_post_id,filename')
            ->when($request->filled('q'), function ($query) use ($request) {
                $term = '%'.$request->string('q')->toString().'%';
                $query->where(fn ($w) => $w
                    ->where('title', 'like', $term)
                    ->orWhere('summary', 'like', $term)
                    ->orWhere('slug', 'like', $term));
            })
            ->when($request->filled('status') && in_array($request->string('status')->toString(), ['publie', 'brouillon'], true),
                fn ($query) => $request->string('status')->toString() === 'publie'
                    ? $query->whereNotNull('published_at')
                    : $query->whereNull('published_at'))
            ->orderByDesc('updated_at')
            ->paginate($request->integer('per_page', 20))
            ->withQueryString();

        $posts->getCollection()->transform(fn (BlogPost $post) => $this->payload($post));

        return response()->json($posts);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules(), $this->messages());

        $data['slug'] = $this->uniqueSlug($data['slug'] ?? null, $data['title']);
        $data['published_at'] = $this->resolvePublishedAt($request->boolean('published'), null);

        $post = BlogPost::create($data);
        $post->load('photos:id,blog_post_id,filename');

        return response()->json(['post' => $this->payload($post)], 201);
    }

    public function update(Request $request, BlogPost $post): JsonResponse
    {
        $data = $request->validate($this->rules($post), $this->messages());

        if (array_key_exists('slug', $data) && $data['slug']) {
            $data['slug'] = $this->uniqueSlug($data['slug'], $data['title'] ?? $post->title, $post->id);
        }

        if ($request->has('published')) {
            $data['published_at'] = $this->resolvePublishedAt($request->boolean('published'), $post->published_at);
        }

        $post->update($data);
        $post->load('photos:id,blog_post_id,filename');

        return response()->json(['post' => $this->payload($post)]);
    }

    public function destroy(BlogPost $post): JsonResponse
    {
        $post->delete();

        return response()->json(status: 204);
    }

    /**
     * Image à la une : remplace les images existantes de l'article
     * (même mécanisme que les photos élèves / établissement).
     */
    public function photo(Request $request, BlogPost $post): JsonResponse
    {
        $request->validate([
            'photo' => ['required', 'image', 'max:8192'],
        ], [
            'photo.required' => 'Choisissez une image à téléverser.',
            'photo.image' => 'Le fichier doit être une image (JPG, PNG ou WebP).',
            'photo.max' => 'L’image ne doit pas dépasser 8 Mo.',
        ]);

        $file = $request->file('photo');

        $post->photos()->get()->each(fn ($photo) => $photo->delete());
        $post->attachfiles([$file]);
        $post->load('photos:id,blog_post_id,filename');

        return response()->json([
            'message' => 'Image de l’article mise à jour.',
            'photo_url' => $post->photo_url,
            'post' => $this->payload($post),
        ], 201);
    }

    /* ---------------- Internes ---------------- */

    private function uniqueSlug(?string $slug, string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($slug ?: $title) ?: 'article';
        $candidate = $base;
        $suffix = 2;

        while (BlogPost::where('slug', $candidate)
            ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
            ->exists()) {
            $candidate = $base.'-'.$suffix;
            $suffix++;
        }

        return $candidate;
    }

    private function resolvePublishedAt(bool $published, ?\DateTimeInterface $current): ?\DateTimeInterface
    {
        if ($published) {
            return $current ?? now();
        }

        return null;
    }

    private function rules(?BlogPost $post = null): array
    {
        $sometimes = $post ? 'sometimes' : 'required';

        return [
            'title' => [$sometimes, 'string', 'max:220'],
            'slug' => ['nullable', 'string', 'max:180', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('blog_posts', 'slug')->ignore($post?->id)],
            'category' => ['nullable', 'string', 'max:80'],
            'author' => ['nullable', 'string', 'max:120'],
            'summary' => [$sometimes, 'string', 'max:600'],
            'body' => [$sometimes, 'array', 'min:1', 'max:40'],
            'body.*' => ['required', 'string', 'max:5000'],
            'reading_time' => ['nullable', 'integer', 'min:1', 'max:60'],
            'is_featured' => ['nullable', 'boolean'],
            'published' => ['nullable', 'boolean'],
        ];
    }

    private function messages(): array
    {
        return [
            'title.required' => 'Le titre est requis.',
            'slug.regex' => 'Le slug ne contient que des minuscules, chiffres et tirets.',
            'slug.unique' => 'Ce slug est déjà utilisé par un autre article.',
            'summary.required' => 'Le résumé (chapeau) est requis.',
            'body.required' => 'Le contenu de l’article est requis.',
            'body.min' => 'Ajoutez au moins un paragraphe.',
        ];
    }

    private function payload(BlogPost $post): array
    {
        $post->loadMissing('photos:id,blog_post_id,filename');

        $photos = $post->photos->map(function ($photo) {
            $array = $photo->toArray();
            $glideUrl = $photo->getImageUrl(BlogPost::PHOTO_WIDTH, BlogPost::PHOTO_HEIGHT);
            $array['url'] = ($glideUrl !== '') ? $glideUrl : null;

            return $array;
        })->values();

        return [
            'id' => $post->id,
            'slug' => $post->slug,
            'title' => $post->title,
            'category' => $post->category,
            'author' => $post->author,
            'summary' => $post->summary,
            'body' => $post->body ?? [],
            'reading_time' => $post->reading_time,
            'is_featured' => (bool) $post->is_featured,
            'published_at' => $post->published_at?->toIso8601String(),
            'date' => $post->published_at?->format('Y-m-d') ?? $post->created_at?->format('Y-m-d'),
            'status' => $post->published_at ? 'publie' : 'brouillon',
            'photo_url' => $post->photo_url,
            'photos' => $photos,
        ];
    }
}
