<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MessageThread extends Model
{
    protected $fillable = ['subject', 'type', 'created_by', 'last_message_at', 'is_archived'];

    protected $casts = ['last_message_at' => 'datetime', 'is_archived' => 'boolean'];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function latestMessage()
    {
        return $this->hasOne(Message::class)->latestOfMany('sent_at');
    }

    public function unreadMessages(): HasMany
    {
        return $this->hasMany(Message::class)->whereNull('read_at');
    }
}
