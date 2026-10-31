<?php

namespace App\Models;

use App\Models\Concerns\HasPhotos;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    use HasPhotos;

    protected $fillable = ['school_class_id', 'matricule', 'first_name', 'last_name', 'gender', 'birth_date', 'email', 'phone', 'address', 'guardian_name', 'guardian_phone', 'guardian_email', 'status', 'enrolled_on', 'is_active', 'photo_path'];

    protected $casts = ['birth_date' => 'date', 'enrolled_on' => 'date', 'is_active' => 'boolean'];

    protected $appends = ['full_name', 'initials', 'photo_url'];

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class);
    }

    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }

    public function absences(): HasMany
    {
        return $this->hasMany(Absence::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function getFullNameAttribute(): string
    {
        return trim($this->first_name.' '.$this->last_name);
    }

    public function getInitialsAttribute(): string
    {
        return mb_strtoupper(mb_substr($this->first_name, 0, 1).mb_substr($this->last_name, 0, 1));
    }

    public function getAverageAttribute(): ?float
    {
        $grades = $this->relationLoaded('grades') ? $this->grades : $this->grades()->get(['score', 'max_score']);

        if ($grades->isEmpty()) {
            return null;
        }

        return round($grades->avg(fn ($grade) => ((float) $grade->score / max(1, (float) $grade->max_score)) * 20), 2);
    }

    public function getBalanceAttribute(): float
    {
        $invoices = $this->relationLoaded('invoices') ? $this->invoices : $this->invoices()->with('payments')->get();

        return round($invoices
            ->whereIn('status', ['pending', 'partial'])
            ->sum(function (Invoice $invoice) {
                $paid = $invoice->relationLoaded('payments')
                    ? $invoice->payments->where('status', 'completed')->sum('amount')
                    : $invoice->payments()->where('status', 'completed')->sum('amount');

                return max(0, (float) $invoice->amount - (float) $paid);
            }), 2);
    }
}
