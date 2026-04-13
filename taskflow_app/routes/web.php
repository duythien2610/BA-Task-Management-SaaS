<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\TaskFlowController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard');

Route::middleware('guest')->group(function (): void {
    Route::get('/login', [AuthController::class, 'create'])->name('login');
    Route::post('/login', [AuthController::class, 'store'])->name('login.store');
});

Route::middleware('auth')->group(function (): void {
    Route::post('/logout', [AuthController::class, 'destroy'])->name('logout');

    Route::get('/dashboard', [TaskFlowController::class, 'dashboard'])->name('dashboard');
    Route::get('/dashboard/partials', [TaskFlowController::class, 'streamDashboardPartials'])->name('dashboard.partials');
    Route::get('/projects', [TaskFlowController::class, 'projectsIndex'])->name('projects.index');
    Route::post('/projects', [TaskFlowController::class, 'storeProject'])->name('projects.store');
    Route::get('/projects/{project}', [TaskFlowController::class, 'projectsShow'])->name('projects.show');
    Route::post('/projects/{project}/members', [TaskFlowController::class, 'addProjectMember'])->name('projects.members.store');
    Route::post('/projects/{project}/members/{user}/remove', [TaskFlowController::class, 'removeProjectMember'])->name('projects.members.remove');
    Route::post('/projects/{project}/tasks', [TaskFlowController::class, 'storeTask'])->name('projects.tasks.store');
    Route::post('/projects/{project}/bulk-update', [TaskFlowController::class, 'bulkUpdate'])->name('projects.bulk-update');
    Route::post('/projects/{project}/billing-rate', [TaskFlowController::class, 'updateBillingRate'])->name('projects.billing-rate');

    Route::post('/tasks/{task}/update', [TaskFlowController::class, 'updateTask'])->name('tasks.update');
    Route::post('/tasks/{task}/comments', [TaskFlowController::class, 'addComment'])->name('tasks.comments.store');
    Route::post('/tasks/{task}/time-logs', [TaskFlowController::class, 'addTimeLog'])->name('tasks.time-logs.store');
    Route::post('/tasks/{task}/timer/start', [TaskFlowController::class, 'startTimer'])->name('tasks.timer.start');
    Route::post('/tasks/{task}/timer/stop', [TaskFlowController::class, 'stopTimer'])->name('tasks.timer.stop');

    // Time log edit/delete with 48-hour rule (FR-013)
    Route::post('/time-logs/{timeLog}/update', [TaskFlowController::class, 'updateTimeLog'])->name('time-logs.update');
    Route::post('/time-logs/{timeLog}/delete', [TaskFlowController::class, 'deleteTimeLog'])->name('time-logs.delete');

    // Dedicated Billing Summary page (FR-012 + SDD SCR-002)
    Route::get('/projects/{project}/billing', [TaskFlowController::class, 'projectsBilling'])->name('projects.billing');

    Route::get('/time-tracking', [TaskFlowController::class, 'timeTracking'])->name('time-tracking.index');
    Route::get('/notifications', [TaskFlowController::class, 'notifications'])->name('notifications.index');
    Route::post('/notifications/mark-all', [TaskFlowController::class, 'markAllNotificationsRead'])->name('notifications.mark-all');
    Route::post('/notifications/preferences', [TaskFlowController::class, 'updatePreferences'])->name('notifications.preferences');
    Route::get('/notifications/{notification}', [TaskFlowController::class, 'readNotification'])->name('notifications.read');

    Route::get('/exports', [TaskFlowController::class, 'exports'])->name('exports.index');
    Route::post('/exports', [TaskFlowController::class, 'createExport'])->name('exports.store');
    Route::get('/exports/{export}/download', [TaskFlowController::class, 'downloadExport'])->name('exports.download');

    Route::get('/users', [TaskFlowController::class, 'users'])->name('users.index');
    Route::post('/users', [TaskFlowController::class, 'inviteUser'])->name('users.store');
    Route::post('/users/{target}/role', [TaskFlowController::class, 'updateUserRole'])->name('users.role');

    Route::get('/clients', [TaskFlowController::class, 'clients'])->name('clients.index');
    Route::post('/clients', [TaskFlowController::class, 'storeClient'])->name('clients.store');
    Route::post('/clients/assign-project', [TaskFlowController::class, 'assignProjectClient'])->name('clients.assign-project');
});
