<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    protected $fillable = ['message_thread_id', 'sender_type', 'sender_id', 'sender_name', 'body', 'sent_at', 'read_at'];

    protected $casts = ['sent_at' => 'datetime', 'read_at' => 'datetime'];

    public function thread(): BelongsTo
    {
        return $this->belongsTo(MessageThread::class, 'message_thread_id');
    }
}
