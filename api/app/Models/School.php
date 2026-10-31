<?php

namespace App\Models;

use App\Models\Concerns\HasPhotos;
use Illuminate\Database\Eloquent\Model;

class School extends Model
{
    use HasPhotos;

    protected $fillable = ['name', 'full_name', 'academic_year', 'term', 'currency', 'address', 'phone', 'email', 'logo_path'];

    protected $appends = ['photo_url'];
}
