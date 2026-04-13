<?php

namespace App\Http\Controllers;

use App\Models\ActiveTimer;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\NotificationItem;
use App\Models\NotificationPreference;
use App\Models\Project;
use App\Models\ProjectExport;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\TimeLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\View\View;

class TaskFlowController extends Controller
{
    public function dashboard(Request $request): View
    {
        $user = $request->user();

        // Safe Async Deferred Loading: Return an empty skeleton layout quickly
        return view('dashboard', $this->baseViewData($user, [
            'projects' => collect(),
            'stats' => ['projects' => 0, 'clients' => 0, 'tasks' => 0, 'overdue' => 0, 'completion' => 0, 'hours' => 0],
            'assignedTasks' => collect(),
            'billingProjects' => collect(),
            'teamSummary' => collect(),
            'recentActivity' => collect(),
        ]));
    }

    public function streamDashboardPartials(Request $request): View
    {
        $user = $request->user();
        
        $projects = $this->visibleProjectsQuery($user)
            ->with('client')
            ->withCount('tasks')
            ->get();

        $tasks = Task::query()
            ->whereIn('project_id', $projects->pluck('id'))
            ->with(['project.client', 'assignee'])
            ->get();

        $stats = [
            'projects' => $projects->count(),
            'clients' => $projects->pluck('client_id')->filter()->unique()->count(),
            'tasks' => $tasks->count(),
            'overdue' => $tasks->filter(fn (Task $task) => $task->due_date && Carbon::parse($task->due_date)->isPast() && $task->status !== 'done')->count(),
            'completion' => $tasks->count() ? round(($tasks->where('status', 'done')->count() / $tasks->count()) * 100) : 0,
            'hours' => TimeLog::query()
                ->whereIn('task_id', $tasks->pluck('id'))
                ->where('is_deleted', false)
                ->sum('duration_minutes'),
        ];

        return view('dashboard.partials.heavy_blocks', [
            'authUser' => $user,
            'projects' => $projects,
            'stats' => $stats,
            'assignedTasks' => $tasks->where('assignee_id', $user->id)->sortBy('due_date')->take(5),
            'billingProjects' => $user->canViewBilling()
                ? $projects->filter(fn (Project $project) => filled($project->hourly_rate_vnd))->take(3)
                : collect(),
            'teamSummary' => $user->isClient() ? collect() : $this->buildCrossProjectTimeSummary($projects, $request->query('range', 'this_month')),
            'recentActivity' => ActivityLog::query()
                ->whereIn('project_id', $projects->pluck('id'))
                ->with(['user', 'task'])
                ->latest()
                ->take(8)
                ->get(),
        ]);
    }

    public function projectsIndex(Request $request): View
    {
        $user = $request->user();
        $projects = $this->visibleProjectsQuery($user)
            ->with(['client', 'users'])
            ->withCount('tasks')
            ->get();

        return view('projects.index', $this->baseViewData($user, [
            'projects' => $projects,
            'clients' => Client::query()->orderBy('name')->get(),
            'projectUsers' => User::query()->whereIn('role', ['owner', 'admin', 'pm', 'member'])->orderBy('name')->get(),
        ]));
    }

    public function storeProject(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user->canManageProjects(), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'client_id' => ['nullable', 'integer', 'exists:clients,id'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:active,on_hold,completed'],
            'hourly_rate_vnd' => ['nullable', 'integer', 'min:1'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'member_ids' => ['nullable', 'array'],
            'member_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $project = Project::create([
            'client_id' => $validated['client_id'] ?? null,
            'name' => $validated['name'],
            'slug' => $this->uniqueProjectSlug($validated['name']),
            'status' => $validated['status'],
            'description' => $validated['description'] ?? null,
            'progress' => 0,
            'hourly_rate_vnd' => $validated['hourly_rate_vnd'] ?? null,
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
        ]);

        $memberIds = collect($validated['member_ids'] ?? [])
            ->push($user->id)
            ->unique()
            ->values();

        $members = User::query()->whereIn('id', $memberIds)->get();
        $syncPayload = $members->mapWithKeys(function (User $member) {
            return [$member->id => ['project_role' => $this->projectRoleForUser($member)]];
        })->all();

        if (! empty($syncPayload)) {
            $project->users()->syncWithoutDetaching($syncPayload);
        }

        if (! empty($validated['client_id'])) {
            $clientUsers = User::query()
                ->where('role', 'client')
                ->where('client_id', $validated['client_id'])
                ->pluck('id');

            foreach ($clientUsers as $clientUserId) {
                $project->users()->syncWithoutDetaching([$clientUserId => ['project_role' => 'client']]);
            }
        }

        $this->recordActivity($project->id, null, $user->id, 'project_create', 'Project created.', null, ['project_id' => $project->id]);

        return redirect()->route('projects.show', $project)->with('status', 'Đã tạo project mới.');
    }

    public function projectsShow(Request $request, Project $project): View
    {
        $user = $request->user();
        $this->abortIfProjectInvisible($user, $project);

        $project->load(['client', 'users']);

        $tasks = $project->tasks()
            ->with(['assignee', 'comments.user', 'timeLogs.user', 'activityLogs.user'])
            ->orderByRaw("CASE status WHEN 'blocked' THEN 1 WHEN 'in_progress' THEN 2 WHEN 'todo' THEN 3 WHEN 'done' THEN 4 ELSE 5 END")
            ->orderBy('due_date')
            ->get();

        $selectedTask = $request->filled('task')
            ? $tasks->firstWhere('id', (int) $request->integer('task'))
            : null;

        return view('projects.show', $this->baseViewData($user, [
            'project' => $project,
            'tasks' => $tasks,
            'selectedTask' => $selectedTask,
            'kanban' => collect([
                'todo' => $tasks->where('status', 'todo'),
                'in_progress' => $tasks->where('status', 'in_progress'),
                'blocked' => $tasks->where('status', 'blocked'),
                'done' => $tasks->where('status', 'done'),
            ]),
            'timeSummary' => $this->buildProjectTimeSummary($project),
            'billingSummary' => $user->canViewBilling() ? $this->buildBillingSummary($project, $request) : collect(),
            'activeTimer' => ActiveTimer::query()->where('user_id', $user->id)->with('task')->first(),
            'members' => $project->users()->orderBy('name')->get(),
            'availableUsers' => User::query()
                ->whereNotIn('id', $project->users->pluck('id'))
                ->orderBy('name')
                ->get(),
        ]));
    }

    public function addProjectMember(Request $request, Project $project): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user->canManageProjects(), 403);
        $this->abortIfProjectInvisible($user, $project);

        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'project_role' => ['required', 'in:owner,admin,manager,member,client'],
        ]);

        $target = User::query()->findOrFail($validated['user_id']);
        $project->users()->syncWithoutDetaching([
            $target->id => ['project_role' => $validated['project_role']],
        ]);

        if ($target->isClient() && $project->client_id === null && $target->client_id) {
            $project->update(['client_id' => $target->client_id]);
        }

        $this->recordActivity($project->id, null, $user->id, 'project_member_add', 'Project member added.', null, [
            'user_id' => $target->id,
            'project_role' => $validated['project_role'],
        ]);

        return back()->with('status', 'Đã thêm member vào project.');
    }

    public function removeProjectMember(Request $request, Project $project, User $user): RedirectResponse
    {
        $actor = $request->user();
        abort_unless($actor->canManageProjects(), 403);
        $this->abortIfProjectInvisible($actor, $project);

        if ((int) $actor->id === (int) $user->id) {
            return back()->withErrors(['member' => 'Không thể tự gỡ chính mình khỏi project từ màn này.']);
        }

        $hasTasks = $project->tasks()->where('assignee_id', $user->id)->exists();
        if ($hasTasks) {
            return back()->withErrors(['member' => 'User này đang được gán task trong project. Hãy reassign task trước khi remove.']);
        }

        $project->users()->detach($user->id);

        $this->recordActivity($project->id, null, $actor->id, 'project_member_remove', 'Project member removed.', ['user_id' => $user->id], null);

        return back()->with('status', 'Đã gỡ member khỏi project.');
    }

    public function storeTask(Request $request, Project $project): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user->canManageProjects(), 403);
        $this->abortIfProjectInvisible($user, $project);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:todo,in_progress,blocked,done'],
            'priority' => ['required', 'in:low,medium,high'],
            'assignee_id' => ['nullable', 'integer', 'exists:users,id'],
            'due_date' => ['nullable', 'date'],
        ]);

        if (($validated['assignee_id'] ?? null) && ! $project->users()->where('users.id', $validated['assignee_id'])->exists()) {
            return back()->withErrors(['task' => 'Assignee phải là thành viên của project.'])->withInput();
        }

        $task = Task::create([
            'project_id' => $project->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
            'priority' => $validated['priority'],
            'assignee_id' => $validated['assignee_id'] ?? null,
            'created_by' => $user->id,
            'due_date' => $validated['due_date'] ?? null,
        ]);

        $this->syncProjectProgress($project);
        $this->recordActivity($project->id, $task->id, $user->id, 'task_create', 'Task created.', null, ['task_id' => $task->id]);

        if ($task->assignee_id) {
            $this->notifyUsers(
                [$task->assignee_id],
                $task,
                'assigned',
                'Task assigned',
                'You were assigned to "'.$task->title.'" by '.$user->name.'.'
            );
        }

        return redirect()->route('projects.show', ['project' => $project, 'task' => $task->id])->with('status', 'Đã tạo task mới.');
    }

    public function updateTask(Request $request, Task $task): RedirectResponse
    {
        $user = $request->user();
        $this->abortIfProjectInvisible($user, $task->project);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:todo,in_progress,blocked,done'],
            'priority' => ['required', 'in:low,medium,high'],
            'assignee_id' => ['nullable', 'integer', 'exists:users,id'],
            'due_date' => ['nullable', 'date'],
        ]);

        if (($validated['assignee_id'] ?? null) && ! $task->project->users()->where('users.id', $validated['assignee_id'])->exists()) {
            return back()->withErrors(['task' => 'Assignee phải là thành viên của project.'])->withInput();
        }

        $previous = $task->only(['title', 'description', 'status', 'priority', 'assignee_id', 'due_date']);
        $task->fill(array_filter($validated, fn ($value) => $value !== null));
        $task->save();
        $this->syncProjectProgress($task->project);

        $this->recordActivity($task->project_id, $task->id, $user->id, 'task_update', 'Task details updated.', $previous, $task->only(['title', 'description', 'status', 'priority', 'assignee_id', 'due_date']));

        if (($validated['assignee_id'] ?? null) && (int) $validated['assignee_id'] !== (int) ($previous['assignee_id'] ?? 0)) {
            $this->notifyUsers(
                [$validated['assignee_id']],
                $task,
                'assigned',
                'Task assigned',
                'You were assigned to "'.$task->title.'" by '.$user->name.'.'
            );
        }

        if (($validated['status'] ?? null) && $validated['status'] !== $previous['status']) {
            $recipients = array_filter([$task->assignee_id, ...$this->projectManagerIds($task->project)]);
            $this->notifyUsers(
                $recipients,
                $task,
                'status_change',
                'Task status updated',
                '"'.$task->title.'" moved to '.$this->labelFromStatus($task->status).'.'
            );
        }

        return back()->with('status', 'Task đã được cập nhật.');
    }

    public function updateBillingRate(Request $request, Project $project): RedirectResponse
    {
        abort_unless($request->user()->isOwner(), 403);
        $this->abortIfProjectInvisible($request->user(), $project);

        $validated = $request->validate([
            'hourly_rate_vnd' => ['required', 'integer', 'min:1'],
        ]);

        $previous = $project->hourly_rate_vnd;
        $project->update(['hourly_rate_vnd' => $validated['hourly_rate_vnd']]);

        $this->recordActivity($project->id, null, $request->user()->id, 'billing_rate', 'Project hourly rate updated.', ['hourly_rate_vnd' => $previous], ['hourly_rate_vnd' => $validated['hourly_rate_vnd']]);

        return back()->with('status', 'Đã cập nhật đơn giá theo giờ.');
    }

    public function addComment(Request $request, Task $task): RedirectResponse
    {
        $user = $request->user();
        $this->abortIfProjectInvisible($user, $task->project);

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:1500'],
        ]);

        $comment = TaskComment::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'body' => $validated['body'],
        ]);

        $recipients = collect([$task->assignee_id, ...$this->projectManagerIds($task->project)])
            ->merge($task->comments()->pluck('user_id'))
            ->filter()
            ->unique()
            ->reject(fn ($id) => (int) $id === $user->id)
            ->all();

        $this->notifyUsers(
            $recipients,
            $task,
            'comment',
            'New comment',
            $user->name.' commented on "'.$task->title.'".'
        );

        $this->recordActivity($task->project_id, $task->id, $user->id, 'comment', 'Comment added to task.', null, ['comment_id' => $comment->id]);

        return back()->with('status', 'Đã thêm comment.');
    }

    public function addTimeLog(Request $request, Task $task): RedirectResponse
    {
        $user = $request->user();
        $this->abortIfProjectInvisible($user, $task->project);
        abort_unless(! $user->isClient(), 403);

        $validated = $request->validate([
            'date' => ['required', 'date', 'before_or_equal:today'],
            'duration_minutes' => ['required', 'integer', 'min:1'],
            'note' => ['nullable', 'string', 'max:500'],
        ], [
            'date.before_or_equal' => 'Date cannot be in the future.',
            'duration_minutes.min' => 'Duration must be greater than 0.',
        ]);

        $timeLog = TimeLog::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'date' => $validated['date'],
            'duration_minutes' => $validated['duration_minutes'],
            'note' => $validated['note'] ?? null,
            'updated_by' => $user->id,
        ]);

        $this->recordActivity($task->project_id, $task->id, $user->id, 'time_log', 'Manual time entry created.', null, ['time_log_id' => $timeLog->id]);

        return back()->with('status', 'Đã thêm time log.');
    }

    public function startTimer(Request $request, Task $task): RedirectResponse
    {
        $user = $request->user();
        $this->abortIfProjectInvisible($user, $task->project);
        abort_unless(! $user->isClient() && (int) $task->assignee_id === (int) $user->id, 403);
        abort_unless($task->status === 'in_progress', 403, 'Timer is only available for In Progress tasks.');

        $activeTimer = ActiveTimer::query()->where('user_id', $user->id)->with('task')->first();
        if ($activeTimer) {
            return back()->withErrors([
                'timer' => 'You have an active timer on '.$activeTimer->task->title.'. Stop it first.',
            ]);
        }

        ActiveTimer::create([
            'user_id' => $user->id,
            'task_id' => $task->id,
            'started_at' => now(),
        ]);

        $this->recordActivity($task->project_id, $task->id, $user->id, 'timer_start', 'Timer started for task.');

        return back()->with('status', 'Timer đã bắt đầu.');
    }

    public function stopTimer(Request $request, Task $task): RedirectResponse
    {
        $user = $request->user();
        $activeTimer = ActiveTimer::query()->where('user_id', $user->id)->where('task_id', $task->id)->first();
        abort_unless((bool) $activeTimer, 404);

        $duration = max(1, $activeTimer->started_at->diffInMinutes(now()));

        TimeLog::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'date' => now()->toDateString(),
            'duration_minutes' => $duration,
            'started_at' => $activeTimer->started_at,
            'ended_at' => now(),
            'note' => 'Timer auto-saved entry.',
            'updated_by' => $user->id,
        ]);

        $activeTimer->delete();
        $this->recordActivity($task->project_id, $task->id, $user->id, 'timer_stop', 'Timer stopped and time entry saved.', ['started_at' => $activeTimer->started_at], ['duration_minutes' => $duration]);

        return back()->with('status', 'Timer đã dừng và time log đã được lưu.');
    }
    public function bulkUpdate(Request $request, Project $project): RedirectResponse
    {
        $user = $request->user();
        $this->abortIfProjectInvisible($user, $project);

        $validated = $request->validate([
            'task_ids' => ['required', 'array', 'min:1'],
            'task_ids.*' => ['integer'],
            'action' => ['required', 'in:status,reassign,due_date,delete'],
            'status' => ['nullable', 'in:todo,in_progress,blocked,done'],
            'assignee_id' => ['nullable', 'integer', 'exists:users,id'],
            'due_date' => ['nullable', 'date'],
            'confirm_delete' => ['nullable', 'string'],
            'confirmed' => ['nullable', 'boolean'],
        ]);

        $tasks = Task::query()
            ->where('project_id', $project->id)
            ->whereIn('id', $validated['task_ids'])
            ->get();

        if (! $user->canBulkManageAllTasks()) {
            $tasks = $tasks->where('assignee_id', $user->id);
        }

        abort_if($tasks->isEmpty(), 422, 'Không có task hợp lệ để cập nhật.');

        if ($tasks->count() > 10 && ! $request->boolean('confirmed')) {
            return back()->withErrors(['bulk' => 'This action will affect '.$tasks->count().' tasks. Are you sure?']);
        }

        if ($validated['action'] === 'delete' && ($validated['confirm_delete'] ?? '') !== 'DELETE') {
            return back()->withErrors(['bulk' => 'Bạn phải nhập DELETE để xác nhận xoá hàng loạt.']);
        }

        if (
            $validated['action'] === 'reassign'
            && ($validated['assignee_id'] ?? null)
            && ! $project->users()->where('users.id', $validated['assignee_id'])->exists()
        ) {
            return back()->withErrors(['bulk' => 'User được chọn không thuộc project này.']);
        }

        DB::transaction(function () use ($validated, $tasks, $user, $project): void {
            /** @var Task $task */
            foreach ($tasks as $task) {
                $previous = $task->only(['status', 'assignee_id', 'due_date']);

                match ($validated['action']) {
                    'status' => $task->update(['status' => $validated['status']]),
                    'reassign' => $project->users()->where('users.id', $validated['assignee_id'])->exists()
                        ? $task->update(['assignee_id' => $validated['assignee_id']])
                        : null,
                    'due_date' => $task->update(['due_date' => $validated['due_date']]),
                    'delete' => $task->delete(),
                };

                $newValue = $validated['action'] === 'delete'
                    ? ['deleted' => true]
                    : $task->fresh()?->only(['status', 'assignee_id', 'due_date']);

                $this->recordActivity($project->id, $task->id, $user->id, 'bulk_'.$validated['action'], 'Bulk action applied to task.', $previous, $newValue);

                if ($validated['action'] === 'reassign' && $validated['assignee_id']) {
                    $this->notifyUsers(
                        [$validated['assignee_id']],
                        $task,
                        'assigned',
                        'Bulk reassignment',
                        'You were assigned to "'.$task->title.'" via bulk update.'
                    );
                }

                if ($validated['action'] === 'status') {
                    $recipients = array_filter([$task->assignee_id, ...$this->projectManagerIds($project)]);
                    $this->notifyUsers(
                        $recipients,
                        $task,
                        'status_change',
                        'Bulk status change',
                        '"'.$task->title.'" moved to '.$this->labelFromStatus($validated['status']).'.'
                    );
                }
            }
        });

        $this->syncProjectProgress($project);

        return back()->with('status', $tasks->count().' task đã được cập nhật.');
    }

    public function timeTracking(Request $request): View
    {
        $user = $request->user();
        $projects = $this->visibleProjectsQuery($user)->with('client')->get();

        $logs = TimeLog::query()
            ->whereHas('task.project', fn (Builder $query) => $query->whereIn('projects.id', $projects->pluck('id')))
            ->where(function (Builder $query) use ($user) {
                if (! $user->canBulkManageAllTasks() && ! $user->canViewBilling()) {
                    $query->where('user_id', $user->id);
                }
            })
            ->where('is_deleted', false)
            ->with(['task.project', 'user'])
            ->latest('date')
            ->get();

        return view('time-tracking.index', $this->baseViewData($user, [
            'logs' => $logs,
            'projects' => $projects,
            'timeSummary' => $this->buildCrossProjectTimeSummary($projects, $request->query('range', 'this_month')),
            'activeTimer' => ActiveTimer::query()->where('user_id', $user->id)->with('task.project')->first(),
        ]));
    }

    public function notifications(Request $request): View
    {
        $user = $request->user();

        return view('notifications.index', $this->baseViewData($user, [
            'notifications' => $user->notifications()->with('task.project')->latest()->paginate(12),
            'preferences' => $user->notificationPreferences()
                ->get()
                ->groupBy('trigger_type')
                ->map(fn (Collection $items) => $items->keyBy('channel')),
        ]));
    }

    public function markAllNotificationsRead(Request $request): RedirectResponse
    {
        $request->user()->notifications()->where('is_read', false)->update(['is_read' => true]);

        return back()->with('status', 'Đã đánh dấu toàn bộ thông báo là đã đọc.');
    }

    public function readNotification(Request $request, NotificationItem $notification): RedirectResponse
    {
        abort_unless($notification->user_id === $request->user()->id, 403);
        $notification->update(['is_read' => true]);

        return redirect($notification->link ?: route('notifications.index'));
    }

    public function updatePreferences(Request $request): RedirectResponse
    {
        $user = $request->user();
        $triggers = ['assigned', 'overdue', 'comment', 'status_change'];
        $channels = ['in_app', 'email'];

        foreach ($triggers as $trigger) {
            foreach ($channels as $channel) {
                NotificationPreference::updateOrCreate(
                    ['user_id' => $user->id, 'trigger_type' => $trigger, 'channel' => $channel],
                    ['is_enabled' => $request->boolean("preferences.$trigger.$channel")]
                );
            }
        }

        return back()->with('status', 'Notification preferences đã được lưu.');
    }

    public function exports(Request $request): View
    {
        $user = $request->user();
        $projects = $this->visibleProjectsQuery($user)->with('client')->get();

        $exports = ProjectExport::query()
            ->whereIn('project_id', $projects->pluck('id'))
            ->when($user->isClient(), fn (Builder $query) => $query->where('shared_with_client', true))
            ->with(['project.client', 'requester'])
            ->latest()
            ->get();

        $previewExport = $request->filled('preview')
            ? $exports->firstWhere('id', (int) $request->integer('preview'))
            : $exports->first();

        return view('exports.index', $this->baseViewData($user, [
            'projects' => $projects,
            'exports' => $exports,
            'previewExport' => $previewExport,
        ]));
    }

    public function createExport(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user->canExport(), 403);

        $validated = $request->validate([
            'project_id' => ['required', 'integer', 'exists:projects,id'],
            'report_type' => ['required', 'in:task_list,progress_summary,team_workload'],
            'format' => ['required', 'in:excel,pdf'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'shared_with_client' => ['nullable', 'boolean'],
        ], [
            'end_date.after_or_equal' => 'Start date must be before end date.',
        ]);

        $project = Project::query()->with(['client', 'users', 'tasks.assignee'])->findOrFail($validated['project_id']);
        $this->abortIfProjectInvisible($user, $project);

        $previewPayload = $this->buildExportPreview(
            $project,
            $validated['report_type'],
            Carbon::parse($validated['start_date']),
            Carbon::parse($validated['end_date'])
        );

        $export = ProjectExport::create([
            'project_id' => $project->id,
            'requested_by' => $user->id,
            'report_type' => $validated['report_type'],
            'format' => $validated['format'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'shared_with_client' => $request->boolean('shared_with_client'),
            'preview_payload' => $previewPayload,
            'download_token' => Str::uuid()->toString(),
        ]);

        $this->recordActivity($project->id, null, $user->id, 'export', 'Report generated from export center.', null, ['export_id' => $export->id]);

        // DOC-FIX-02/03: Client role receives NO notifications in Q2 MVP (Scope §4.5, FR-030→FR-038).
        // Shared report exports are accessible via /exports when logged in — no bell notification sent.
        // The previous block that sent 'shared_report' notifications to clients violated Q2 scope.

        return redirect()->route('exports.index', ['preview' => $export->id])->with('status', 'Report đã được tạo. Xem preview và tải xuống bên dưới.');
    }

    public function downloadExport(Request $request, ProjectExport $export): Response
    {
        $user = $request->user();
        $this->abortIfProjectInvisible($user, $export->project);

        if ($user->isClient()) {
            abort_unless($export->shared_with_client, 403);
        }

        return $export->format === 'excel'
            ? $this->downloadExcelCompatibleCsv($export)
            : $this->downloadPdfReport($export);
    }

    public function users(Request $request): View
    {
        $user = $request->user();
        abort_unless($user->canManageUsers(), 403);

        return view('users.index', $this->baseViewData($user, [
            'users' => User::query()->orderByRaw("CASE role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 WHEN 'pm' THEN 3 WHEN 'member' THEN 4 WHEN 'client' THEN 5 ELSE 6 END")->orderBy('name')->get(),
            'clients' => Client::query()->orderBy('name')->get(),
        ]));
    }

    public function inviteUser(Request $request): RedirectResponse
    {
        abort_unless($request->user()->canManageUsers(), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'role' => ['required', 'in:admin,pm,member,client'],
            'client_id' => ['nullable', 'integer', 'exists:clients,id'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'title' => $validated['title'] ?? null,
            'email' => $validated['email'],
            'role' => $validated['role'],
            'client_id' => $validated['client_id'] ?? null,
            'avatar_color' => '#334155',
            'password' => Hash::make('password123'),
        ]);

        // FR-037: Seed default notification preferences for new users.
        // Default: in_app ON, email OFF for all trigger types.
        // Client role receives no notifications (gate: receive-notifications).
        if (! $user->isClient()) {
            $triggers = ['assigned', 'overdue', 'comment', 'status_change'];
            foreach ($triggers as $trigger) {
                NotificationPreference::create([
                    'user_id' => $user->id,
                    'trigger_type' => $trigger,
                    'channel' => 'in_app',
                    'is_enabled' => true,
                ]);
                NotificationPreference::create([
                    'user_id' => $user->id,
                    'trigger_type' => $trigger,
                    'channel' => 'email',
                    'is_enabled' => false, // email OFF by default (FR-037)
                ]);
            }
        }

        $this->recordActivity(null, null, $request->user()->id, 'user_invite', 'User invited and seeded with temp password.', null, ['user_id' => $user->id]);

        return back()->with('status', 'Đã tạo user mới. Mật khẩu tạm là password123.');
    }

    public function updateUserRole(Request $request, User $target): RedirectResponse
    {
        abort_unless($request->user()->canManageUsers(), 403);
        abort_if($target->isOwner(), 422, 'Owner role requires a separate ownership transfer flow.');

        $validated = $request->validate([
            'role' => ['required', 'in:admin,pm,member,client'],
            'client_id' => ['nullable', 'integer', 'exists:clients,id'],
        ]);

        $previous = $target->role;
        $target->update([
            'role' => $validated['role'],
            'client_id' => $validated['role'] === 'client' ? ($validated['client_id'] ?? $target->client_id) : null,
        ]);

        $this->recordActivity(null, null, $request->user()->id, 'role_change', 'User role changed.', ['role' => $previous], ['role' => $validated['role']]);

        return back()->with('status', 'Đã cập nhật role cho user.');
    }

    public function clients(Request $request): View
    {
        $user = $request->user();
        abort_unless($user->canManageClients(), 403);

        return view('clients.index', $this->baseViewData($user, [
            'clients' => Client::query()->with(['owner', 'projects'])->orderBy('name')->get(),
            'projects' => Project::query()->with('client')->orderBy('name')->get(),
            'owners' => User::query()->whereIn('role', ['owner', 'admin', 'pm'])->orderBy('name')->get(),
        ]));
    }

    public function storeClient(Request $request): RedirectResponse
    {
        abort_unless($request->user()->canManageClients(), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'industry' => ['nullable', 'string', 'max:255'],
            'company_size' => ['nullable', 'string', 'max:255'],
            'contact_name' => ['required', 'string', 'max:255'],
            'contact_email' => ['nullable', 'email'],
            'contact_phone' => ['nullable', 'string', 'max:255'],
            'owner_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
        ]);

        Client::create($validated + ['created_by' => $request->user()->id]);

        return back()->with('status', 'Đã tạo client mới.');
    }

    public function assignProjectClient(Request $request): RedirectResponse
    {
        abort_unless($request->user()->canManageClients(), 403);

        $validated = $request->validate([
            'project_id' => ['required', 'integer', 'exists:projects,id'],
            'client_id' => ['required', 'integer', 'exists:clients,id'],
        ]);

        $project = Project::query()->findOrFail($validated['project_id']);
        $project->update(['client_id' => $validated['client_id']]);

        return back()->with('status', 'Đã gán project cho client.');
    }

    private function baseViewData(User $user, array $data = []): array
    {
        $projects = $this->visibleProjectsQuery($user)->with('client')->get();
        // FR-035: Bell dropdown shows up to 20 notifications (not client - gate: receive-notifications)
        $peek = Gate::check('receive-notifications', $user)
            ? $user->notifications()->latest()->take(20)->get()
            : collect();

        return array_merge([
            'authUser' => $user,
            'navProjects' => $projects,
            'peekNotifications' => $peek,
            'unreadNotificationCount' => Gate::check('receive-notifications', $user)
                ? $user->notifications()->where('is_read', false)->count()
                : 0,
        ], $data);
    }

    private function visibleProjectsQuery(User $user): Builder
    {
        return Project::query()->where(function (Builder $query) use ($user): void {
            if ($user->isClient()) {
                $query->whereHas('users', fn (Builder $memberQuery) => $memberQuery->where('users.id', $user->id))
                    ->orWhere('client_id', $user->client_id);
                return;
            }

            $query->whereHas('users', fn (Builder $memberQuery) => $memberQuery->where('users.id', $user->id));
        });
    }

    private function abortIfProjectInvisible(User $user, Project $project): void
    {
        abort_unless($this->visibleProjectsQuery($user)->whereKey($project->id)->exists(), 403);
    }

    private function buildProjectTimeSummary(Project $project): Collection
    {
        $rows = TimeLog::query()
            ->selectRaw('user_id, SUM(duration_minutes) as total_minutes, COUNT(DISTINCT task_id) as task_count')
            ->whereHas('task', fn (Builder $query) => $query->where('project_id', $project->id))
            ->where('is_deleted', false)
            ->groupBy('user_id')
            ->with('user')
            ->get();

        return $project->users->map(function (User $user) use ($rows) {
            $row = $rows->firstWhere('user_id', $user->id);

            return [
                'user' => $user,
                'minutes' => $row?->total_minutes ?? 0,
                'task_count' => $row?->task_count ?? 0,
            ];
        });
    }

    private function buildCrossProjectTimeSummary(Collection $projects, string $range): Collection
    {
        [$start, $end] = $this->rangeFromLabel($range);

        return TimeLog::query()
            ->whereHas('task.project', fn (Builder $query) => $query->whereIn('projects.id', $projects->pluck('id')))
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->where('is_deleted', false)
            ->with(['user', 'task.project'])
            ->get()
            ->groupBy('user_id')
            ->map(function (Collection $items) {
                return [
                    'user' => $items->first()->user,
                    'minutes' => $items->sum('duration_minutes'),
                    'tasks' => $items->pluck('task_id')->unique()->count(),
                    'projects' => $items->pluck('task.project.name')->unique()->implode(', '),
                ];
            })->values();
    }

    private function buildBillingSummary(Project $project, Request $request): Collection
    {
        $period = $request->query('period', 'weekly');
        $start = Carbon::parse($request->query('billing_start', now()->startOfMonth()->toDateString()));
        $end = Carbon::parse($request->query('billing_end', now()->toDateString()));

        return TimeLog::query()
            ->whereHas('task', fn (Builder $query) => $query->where('project_id', $project->id))
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->where('is_deleted', false)
            ->with('user')
            ->get()
            ->groupBy('user_id')
            ->map(function (Collection $items) use ($project, $period) {
                return [
                    'user' => $items->first()->user,
                    'minutes' => $items->sum('duration_minutes'),
                    'period' => $period,
                    'rate' => $project->hourly_rate_vnd,
                    'amount' => $project->hourly_rate_vnd ? round(($items->sum('duration_minutes') / 60) * $project->hourly_rate_vnd) : null,
                ];
            })->values();
    }

    private function buildExportPreview(Project $project, string $reportType, Carbon $start, Carbon $end): array
    {
        $tasks = $project->tasks()->with('assignee')->get();
        $logs = TimeLog::query()
            ->whereHas('task', fn (Builder $query) => $query->where('project_id', $project->id))
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->where('is_deleted', false)
            ->with(['user', 'task'])
            ->get();

        return match ($reportType) {
            'task_list' => [
                'title' => 'Task List',
                'headers' => ['Task Name', 'Assignee', 'Status', 'Due Date', 'Priority', 'Created Date'],
                'rows' => $tasks->map(fn (Task $task) => [
                    $task->title,
                    $task->assignee?->name ?? 'Unassigned',
                    $this->labelFromStatus($task->status),
                    optional($task->due_date)->format('d/m/Y') ?? '-',
                    ucfirst($task->priority),
                    $task->created_at->format('d/m/Y'),
                ])->all(),
                'summary' => [
                    'Total Tasks' => $tasks->count(),
                    'Completed' => $tasks->where('status', 'done')->count(),
                    'At Risk' => $tasks->where('status', 'blocked')->count(),
                ],
            ],
            'progress_summary' => [
                'title' => 'Project Progress Summary',
                'headers' => ['Metric', 'Value'],
                'rows' => [
                    ['Project Name', $project->name],
                    ['Client Name', $project->client?->name ?? '-'],
                    ['Completion', $project->progress.'%'],
                    ['Status Flag', $tasks->where('status', 'blocked')->count() ? 'AT RISK' : 'ON TRACK'],
                    ['Total Tasks', $tasks->count()],
                    ['Completed Tasks', $tasks->where('status', 'done')->count()],
                    ['Open Blockers', $tasks->where('status', 'blocked')->pluck('title')->implode('; ') ?: 'None'],
                ],
                'summary' => [
                    'On Track' => $tasks->where('status', 'blocked')->count() ? 'No' : 'Yes',
                    'Open Blockers' => $tasks->where('status', 'blocked')->count(),
                    'Due This Week' => $tasks->filter(fn (Task $task) => $task->due_date && Carbon::parse($task->due_date)->between(now(), now()->addWeek()))->count(),
                ],
            ],
            'team_workload' => [
                'title' => 'Team Workload',
                'headers' => ['Assignee', 'Task Count', 'Hours Logged', 'Project'],
                'rows' => $project->users->map(function (User $member) use ($tasks, $logs, $project) {
                    $memberTasks = $tasks->where('assignee_id', $member->id);
                    $memberMinutes = $logs->where('user_id', $member->id)->sum('duration_minutes');

                    return [
                        $member->name,
                        $memberTasks->count(),
                        round($memberMinutes / 60, 1),
                        $project->name,
                    ];
                })->all(),
                'summary' => [
                    'Members' => $project->users->count(),
                    'Logged Hours' => round($logs->sum('duration_minutes') / 60, 1),
                    'Tasks Covered' => $logs->pluck('task_id')->unique()->count(),
                ],
            ],
        };
    }

    private function syncProjectProgress(Project $project): void
    {
        $totalTasks = $project->tasks()->count();
        $completedTasks = $project->tasks()->where('status', 'done')->count();

        $project->update([
            'progress' => $totalTasks > 0 ? (int) round(($completedTasks / $totalTasks) * 100) : 0,
        ]);
    }

    private function uniqueProjectSlug(string $name): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $suffix = 2;

        while (Project::query()->where('slug', $slug)->exists()) {
            $slug = $baseSlug.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }

    private function projectRoleForUser(User $user): string
    {
        return match ($user->role) {
            'owner' => 'owner',
            'admin' => 'admin',
            'pm' => 'manager',
            'client' => 'client',
            default => 'member',
        };
    }

    private function projectManagerIds(Project $project): array
    {
        return $project->users()
            ->whereIn('role', ['owner', 'admin', 'pm'])
            ->pluck('users.id')
            ->all();
    }

    private function notifyUsers(array $userIds, ?Task $task, string $triggerType, string $title, string $message, ?string $link = null): void
    {
        $users = User::query()->whereIn('id', array_unique(array_filter($userIds)))->get();

        foreach ($users as $user) {
            // Gate: receive-notifications — Client role excluded from ALL notifications (Q2 Scope §4.5)
            if (! Gate::check('receive-notifications', $user)) {
                continue;
            }

            $channels = $this->channelsForTrigger($user, $triggerType);
            if (empty($channels)) {
                continue;
            }

            $notificationLink = $link ?: ($task ? route('projects.show', ['project' => $task->project_id, 'task' => $task->id]) : null);

            // In-app notification (FR-034: deliver within 60s — synchronous insert)
            if (in_array('in_app', $channels)) {
                NotificationItem::create([
                    'user_id' => $user->id,
                    'task_id' => $task?->id,
                    'trigger_type' => $triggerType,
                    'title' => $title,
                    'message' => $message,
                    'link' => $notificationLink,
                    'delivered_channels' => $channels,
                    'is_read' => false,
                ]);
            }

            // FR-034 / FR-051: Real email dispatch when user has email channel enabled.
            // Uses Laravel Mail facade — configure MAIL_MAILER in .env (smtp / log / sendgrid).
            if (in_array('email', $channels)) {
                try {
                    Mail::raw(
                        "[TaskFlow Notification]\n\n{$title}\n\n{$message}" . ($notificationLink ? "\n\nView: {$notificationLink}" : ''),
                        static function ($mail) use ($user, $title): void {
                            $mail->to($user->email, $user->name)
                                ->subject('[TaskFlow] ' . $title);
                        }
                    );
                } catch (\Throwable $e) {
                    // Log but never let email failure break the main request flow.
                    Log::error('TaskFlow email notification failed', [
                        'user_id' => $user->id,
                        'trigger' => $triggerType,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }
    }

    private function channelsForTrigger(User $user, string $triggerType): array
    {
        $preferences = $user->notificationPreferences()
            ->where('trigger_type', $triggerType)
            ->where('is_enabled', true)
            ->pluck('channel')
            ->all();

        // If user has no preferences configured at all, fall back to in_app only (FR-037 default).
        if (empty($preferences)) {
            return ['in_app'];
        }

        return $preferences;
    }

    private function recordActivity(?int $projectId, ?int $taskId, ?int $userId, string $actionType, string $description, mixed $previous = null, mixed $new = null): void
    {
        ActivityLog::create([
            'project_id' => $projectId,
            'task_id' => $taskId,
            'user_id' => $userId,
            'action_type' => $actionType,
            'description' => $description,
            'previous_value' => $previous ? json_encode($previous, JSON_UNESCAPED_UNICODE) : null,
            'new_value' => $new ? json_encode($new, JSON_UNESCAPED_UNICODE) : null,
        ]);
    }

    private function downloadExcelCompatibleCsv(ProjectExport $export): Response
    {
        $payload = $export->preview_payload;
        $filename = Str::slug($export->project->name.'-'.$export->report_type).'.csv';
        $lines = collect([$payload['headers'] ?? []])
            ->merge($payload['rows'] ?? [])
            ->map(fn ($row) => collect($row)->map(fn ($cell) => '"'.str_replace('"', '""', (string) $cell).'"')->implode(','))
            ->implode("\n");

        return response($lines, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    private function downloadPdfReport(ProjectExport $export): Response
    {
        $payload = $export->preview_payload;
        $lines = [
            'TaskFlow Project Report',
            $payload['title'] ?? 'Report',
            'Project: '.$export->project->name,
            'Client: '.($export->project->client?->name ?? '-'),
            'Date Range: '.Carbon::parse($export->start_date)->format('d/m/Y').' - '.Carbon::parse($export->end_date)->format('d/m/Y'),
            'Generated By: '.$export->requester->name,
            str_repeat('-', 72),
        ];

        foreach ($payload['summary'] ?? [] as $label => $value) {
            $lines[] = $label.': '.$value;
        }

        $lines[] = str_repeat('-', 72);
        $lines[] = implode(' | ', $payload['headers'] ?? []);

        foreach ($payload['rows'] ?? [] as $row) {
            $lines[] = implode(' | ', $row);
        }

        $pdf = $this->makePdf($lines);
        $filename = Str::slug($export->project->name.'-'.$export->report_type).'.pdf';

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    private function makePdf(array $lines): string
    {
        $pages = array_chunk($lines, 34);
        $objects = [];

        $objects[] = '<< /Type /Catalog /Pages 2 0 R >>';
        $objects[] = '<< /Type /Pages /Kids ['.collect($pages)->keys()->map(fn ($index) => (4 + ($index * 2)).' 0 R')->implode(' ').'] /Count '.count($pages).' >>';
        $objects[] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

        foreach ($pages as $index => $pageLines) {
            $content = "BT\n/F1 11 Tf\n50 790 Td\n14 TL\n";
            foreach ($pageLines as $line) {
                $content .= '(' . $this->escapePdfText($line) . ") Tj\nT*\n";
            }
            $content .= "ET";

            $contentObjectId = 5 + ($index * 2);
            $objects[] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents '.$contentObjectId.' 0 R >>';
            $objects[] = "<< /Length ".strlen($content)." >>\nstream\n".$content."\nendstream";
        }

        $pdf = "%PDF-1.4\n";
        $offsets = [];

        foreach ($objects as $idx => $object) {
            $offsets[] = strlen($pdf);
            $pdf .= ($idx + 1)." 0 obj\n".$object."\nendobj\n";
        }

        $xref = strlen($pdf);
        $pdf .= "xref\n0 ".(count($objects) + 1)."\n";
        $pdf .= "0000000000 65535 f \n";
        foreach ($offsets as $offset) {
            $pdf .= str_pad((string) $offset, 10, '0', STR_PAD_LEFT)." 00000 n \n";
        }
        $pdf .= "trailer\n<< /Size ".(count($objects) + 1)." /Root 1 0 R >>\nstartxref\n".$xref."\n%%EOF";

        return $pdf;
    }

    private function escapePdfText(string $value): string
    {
        return str_replace(['\\', '(', ')'], ['\\\\', '\(', '\)'], $value);
    }

    private function labelFromStatus(?string $status): string
    {
        return match ($status) {
            'todo' => 'To Do',
            'in_progress' => 'In Progress',
            'blocked' => 'Blocked',
            'done' => 'Done',
            default => '-',
        };
    }

    private function labelFromReportType(string $reportType): string
    {
        return match ($reportType) {
            'task_list' => 'Task List',
            'progress_summary' => 'Project Progress Summary',
            'team_workload' => 'Team Workload',
            default => 'Report',
        };
    }

    private function rangeFromLabel(string $range): array
    {
        return match ($range) {
            'last_7_days' => [now()->subDays(6)->startOfDay(), now()->endOfDay()],
            'this_week' => [now()->startOfWeek(), now()->endOfWeek()],
            default => [now()->startOfMonth(), now()->endOfDay()],
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FT-002: Time Log Edit / Delete  (FR-013)
    // Rule: users may edit/delete their OWN log within 48 hours of creation.
    // Owner and Admin may edit/delete ANY log at any age (gate: edit-any-time-log).
    // ─────────────────────────────────────────────────────────────────────────

    public function updateTimeLog(Request $request, TimeLog $timeLog): RedirectResponse
    {
        $user = $request->user();

        // Ownership check: users can only edit their own logs (unless Owner/Admin)
        if (! Gate::check('edit-any-time-log', $user)) {
            abort_unless((int) $timeLog->user_id === $user->id, 403);

            // 48-hour window check (FR-013)
            abort_unless(
                $timeLog->created_at->diffInHours(now()) < 48,
                403,
                'Time logs older than 48 hours require Admin approval to edit.'
            );
        }

        abort_unless(! $timeLog->is_deleted, 404);

        $validated = $request->validate([
            'date' => ['required', 'date', 'before_or_equal:today'],
            'duration_minutes' => ['required', 'integer', 'min:1'],
            'note' => ['nullable', 'string', 'max:500'],
        ], [
            'date.before_or_equal' => 'Date cannot be in the future.',
            'duration_minutes.min' => 'Duration must be greater than 0.',
        ]);

        $previous = ['duration_minutes' => $timeLog->duration_minutes, 'note' => $timeLog->note];

        $timeLog->update([
            'date' => $validated['date'],
            'duration_minutes' => $validated['duration_minutes'],
            'note' => $validated['note'] ?? null,
            'updated_by' => $user->id,
        ]);

        $this->recordActivity(
            $timeLog->task->project_id,
            $timeLog->task_id,
            $user->id,
            'time_log_edit',
            'Time log entry edited.',
            $previous,
            ['duration_minutes' => $validated['duration_minutes'], 'note' => $validated['note'] ?? null]
        );

        return back()->with('status', 'Time log đã được cập nhật.');
    }

    public function deleteTimeLog(Request $request, TimeLog $timeLog): RedirectResponse
    {
        $user = $request->user();

        if (! Gate::check('edit-any-time-log', $user)) {
            abort_unless((int) $timeLog->user_id === $user->id, 403);

            // 48-hour window check (FR-013)
            abort_unless(
                $timeLog->created_at->diffInHours(now()) < 48,
                403,
                'Time logs older than 48 hours require Admin approval to delete.'
            );
        }

        abort_unless(! $timeLog->is_deleted, 404);

        $timeLog->update([
            'is_deleted' => true,
            'updated_by' => $user->id,
        ]);

        $this->recordActivity(
            $timeLog->task->project_id,
            $timeLog->task_id,
            $user->id,
            'time_log_delete',
            'Time log entry soft-deleted.',
            ['duration_minutes' => $timeLog->duration_minutes],
            null
        );

        return back()->with('status', 'Time log đã được xoá.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FT-002: Dedicated Billing Summary Page  (FR-012 + SDD SCR-002)
    // ─────────────────────────────────────────────────────────────────────────

    public function projectsBilling(Request $request, Project $project): View
    {
        $user = $request->user();
        $this->abortIfProjectInvisible($user, $project);
        Gate::authorize('view-billing');

        $project->load(['client', 'users']);

        $billingRows = $this->buildBillingSummary($project, $request);
        $totalMinutes = $billingRows->sum('minutes');
        $grandTotal = $project->hourly_rate_vnd
            ? round(($totalMinutes / 60) * $project->hourly_rate_vnd)
            : null;

        return view('projects.billing', $this->baseViewData($user, [
            'project' => $project,
            'billingRows' => $billingRows,
            'totalMinutes' => $totalMinutes,
            'grandTotal' => $grandTotal,
            'period' => $request->query('period', 'monthly'),
            'billingStart' => $request->query('billing_start', now()->startOfMonth()->toDateString()),
            'billingEnd' => $request->query('billing_end', now()->toDateString()),
        ]));
    }
}

