<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectExport extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'requested_by',
        'report_type',
        'format',
        'start_date',
        'end_date',
        'shared_with_client',
        'preview_payload',
        'download_token',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'shared_with_client' => 'boolean',
            'preview_payload' => 'array',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}
