<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * Defines the centralised permission gates for the TaskFlow Q2 permission
     * refactor (FT-007, FR-001 → FR-005). All role checks are consolidated here
     * rather than being scattered across controllers as inline abort_unless() calls.
     *
     * Gate usage in controllers:
     *   Gate::authorize('manage-users');       // throws 403 on failure
     *   Gate::check('view-billing', $user);    // returns bool
     *   $this->authorize('export-reports');    // using AuthorizesRequests trait
     */
    public function boot(): void
    {
        // ─── User Management ──────────────────────────────────────────────
        // FR-003: Only Owner and Admin can invite or change roles.
        Gate::define('manage-users', fn (User $user): bool => $user->canManageUsers());

        // ─── Project Management ────────────────────────────────────────────
        // Owners, Admins and PMs can create/edit projects.
        Gate::define('manage-projects', fn (User $user): bool => $user->canManageProjects());

        // ─── Client Management ────────────────────────────────────────────
        Gate::define('manage-clients', fn (User $user): bool => $user->canManageClients());

        // ─── Billing (FT-002, FR-010/FR-012) ─────────────────────────────
        // Only Owner can view AND edit billing summary; Admin is read-only.
        Gate::define('view-billing', fn (User $user): bool => $user->canViewBilling());
        Gate::define('edit-billing-rate', fn (User $user): bool => $user->isOwner());

        // ─── Export (FT-001, FR-015) ──────────────────────────────────────
        // Owner / Admin / PM can export; Member and Client cannot.
        Gate::define('export-reports', fn (User $user): bool => $user->canExport());

        // ─── Bulk Actions (FT-006, FR-022/FR-029) ────────────────────────
        // PM+ can bulk-edit ALL tasks; Member can only bulk-edit own tasks.
        Gate::define('bulk-manage-all-tasks', fn (User $user): bool => $user->canBulkManageAllTasks());

        // ─── Time Log Editing (FT-002, FR-013) ───────────────────────────
        // Admins and Owners may edit/delete any time log regardless of age.
        Gate::define('edit-any-time-log', fn (User $user): bool => $user->isOwner() || $user->isAdmin());

        // ─── Notifications (FT-003) ───────────────────────────────────────
        // Client role receives NO notifications in Q2 MVP (Scope §4.5).
        Gate::define('receive-notifications', fn (User $user): bool => ! $user->isClient());
    }
}
