<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'title',
        'email',
        'role',
        'status',
        'client_id',
        'avatar_color',
        'last_login_at',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function managedClients(): HasMany
    {
        return $this->hasMany(Client::class, 'owner_user_id');
    }

    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class)
            ->withTimestamps()
            ->withPivot('project_role');
    }

    public function assignedTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assignee_id');
    }

    public function timeLogs(): HasMany
    {
        return $this->hasMany(TimeLog::class);
    }

    public function notificationPreferences(): HasMany
    {
        return $this->hasMany(NotificationPreference::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(NotificationItem::class);
    }

    public function activeTimer(): HasMany
    {
        return $this->hasMany(ActiveTimer::class);
    }

    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isPm(): bool
    {
        return $this->role === 'pm';
    }

    public function isMember(): bool
    {
        return $this->role === 'member';
    }

    public function isClient(): bool
    {
        return $this->role === 'client';
    }

    public function canManageUsers(): bool
    {
        return $this->isOwner();
    }

    public function canManageClients(): bool
    {
        return $this->isOwner() || $this->isPm() || $this->isAdmin();
    }

    public function canManageProjects(): bool
    {
        return $this->isOwner() || $this->isPm() || $this->isAdmin();
    }

    public function canExport(): bool
    {
        return $this->isOwner() || $this->isAdmin() || $this->isPm();
    }

    public function canViewBilling(): bool
    {
        return $this->isOwner() || $this->isAdmin();
    }

    public function canBulkManageAllTasks(): bool
    {
        return $this->isOwner() || $this->isAdmin() || $this->isPm();
    }
}
