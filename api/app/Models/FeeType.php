<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FeeType extends Model
{
    protected $fillable = ['name', 'code', 'default_amount', 'is_recurring', 'is_active'];

    protected $casts = ['default_amount' => 'decimal:2', 'is_recurring' => 'boolean', 'is_active' => 'boolean'];

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
