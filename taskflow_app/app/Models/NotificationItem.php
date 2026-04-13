<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'task_id',
        'trigger_type',
        'title',
        'message',
        'link',
        'delivered_channels',
        'is_read',
    ];

    protected function casts(): array
    {
        return [
            'delivered_channels' => 'array',
            'is_read' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }
}
