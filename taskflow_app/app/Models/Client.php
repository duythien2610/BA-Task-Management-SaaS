<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'industry',
        'company_size',
        'contact_name',
        'contact_email',
        'contact_phone',
        'billing_address',
        'notes',
        'owner_user_id',
        'created_by',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }
}
