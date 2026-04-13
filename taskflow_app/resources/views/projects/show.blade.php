@extends('layouts.app')
@section('title', $project->name.' · TaskFlow')

@section('content')
    <div class="project-header">
        <div>
            <div class="project-title">
                <div class="project-icon">
                    {{ strtoupper(substr($project->name, 0, 1)) }}
                </div>
                {{ $project->name }}
            </div>
            <div class="project-meta">
                <span>{{ $project->client ? $project->client->name : 'Internal' }}</span>
                <span>•</span>
                <span class="project-meta-group">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="8" r="6.5"/><path d="M6.5 5.5l4 2.5-4 2.5V5.5z" fill="currentColor" stroke="none"/></svg>
                    {{ $tasks->count() }} Tasks
                </span>
                <span>•</span>
                <span class="project-members">
                    @foreach($members->take(5) as $m)
                        <div class="avatar" @style(['background-color: ' . $m->avatar_color])>{{ strtoupper(substr($m->name,0,1)) }}</div>
                    @endforeach
                </span>
            </div>
        </div>
        <div class="page-header-actions">
            {{-- Billing link for Owner/Admin (FT-002 SCR-002) --}}
            @can('view-billing')
                <a href="{{ route('projects.billing', $project) }}" class="btn btn-secondary">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="12" height="9" rx="1"/><path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M8 9h.01"/></svg>
                    Billing
                </a>
            @endcan
            {{-- View toggle buttons (Board / List) --}}
            <button id="btn-board-view" onclick="setView('board')" class="btn btn-secondary" style="border-color:var(--primary); color:var(--primary);">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 2v12M8 2v12M12 2v12"/></svg>
                Board
            </button>
            <button id="btn-list-view" onclick="setView('list')" class="btn btn-secondary">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4H2M14 8H2M14 12H2"/></svg>
                List
            </button>
        </div>
    </div>


    @if ($authUser->canManageProjects())
        <div class="grid-2">
            <div class="card">
                <div class="section-header">
                    <div>
                        <div class="section-title">Create Task</div>
                        <div class="section-subtitle">Add a task directly into this project board.</div>
                    </div>
                </div>
                <form class="form-grid" action="{{ route('projects.tasks.store', $project) }}" method="POST">
                    @csrf
                    <label>
                        <span class="label-text">Title</span>
                        <input type="text" name="title" placeholder="e.g. Prepare sprint handoff checklist" required>
                    </label>
                    <label>
                        <span class="label-text">Description</span>
                        <textarea name="description" rows="3" placeholder="Task details, acceptance notes, dependencies."></textarea>
                    </label>
                    <div class="form-row">
                        <label>
                            <span class="label-text">Status</span>
                            <select name="status" required>
                                @foreach (['todo' => 'To Do', 'in_progress' => 'In Progress', 'blocked' => 'Blocked', 'done' => 'Done'] as $value => $label)
                                    <option value="{{ $value }}">{{ $label }}</option>
                                @endforeach
                            </select>
                        </label>
                        <label>
                            <span class="label-text">Priority</span>
                            <select name="priority" required>
                                @foreach (['low' => 'Low', 'medium' => 'Medium', 'high' => 'High'] as $value => $label)
                                    <option value="{{ $value }}" @selected($value === 'medium')>{{ $label }}</option>
                                @endforeach
                            </select>
                        </label>
                    </div>
                    <div class="form-row">
                        <label>
                            <span class="label-text">Assignee</span>
                            <select name="assignee_id">
                                <option value="">Unassigned</option>
                                @foreach ($members as $member)
                                    <option value="{{ $member->id }}">{{ $member->name }}</option>
                                @endforeach
                            </select>
                        </label>
                        <label>
                            <span class="label-text">Due Date</span>
                            <input type="date" name="due_date">
                        </label>
                    </div>
                    <button class="btn btn-primary" type="submit">Create Task</button>
                </form>
            </div>

            <div class="card">
                <div class="section-header">
                    <div>
                        <div class="section-title">Project Members</div>
                        <div class="section-subtitle">Manage who can work inside this project.</div>
                    </div>
                </div>
                <form class="form-grid" action="{{ route('projects.members.store', $project) }}" method="POST">
                    @csrf
                    <div class="form-row">
                        <label>
                            <span class="label-text">User</span>
                            <select name="user_id" required>
                                <option value="">Select user</option>
                                @foreach ($availableUsers as $availableUser)
                                    <option value="{{ $availableUser->id }}">{{ $availableUser->name }} · {{ ucfirst($availableUser->role) }}</option>
                                @endforeach
                            </select>
                        </label>
                        <label>
                            <span class="label-text">Project Role</span>
                            <select name="project_role" required>
                                <option value="member">Member</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                                <option value="client">Client</option>
                            </select>
                        </label>
                    </div>
                    <button class="btn btn-secondary" type="submit">Add Member</button>
                </form>

                <div class="list-stack">
                    @foreach ($members as $member)
                        <div class="list-row" style="cursor:default;">
                            <div class="row-main">
                                <strong>{{ $member->name }}</strong>
                                <small>{{ $member->email }} · {{ ucfirst($member->pivot->project_role) }}</small>
                            </div>
                            @if ($member->id !== $authUser->id)
                                <form action="{{ route('projects.members.remove', ['project' => $project, 'user' => $member]) }}" method="POST">
                                    @csrf
                                    <button class="btn btn-ghost btn-sm" type="submit">Remove</button>
                                </form>
                            @endif
                        </div>
                    @endforeach
                </div>
            </div>
        </div>
    @endif

    <!-- Kanban Board Grid -->
    <div class="board-container">
        @foreach ($kanban as $status => $items)
            <div class="board-column">
                <div class="board-col-header">
                    <span>{{ str_replace('_', ' ', $status) }} <span class="board-col-count">{{ count($items) }}</span></span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="cursor:pointer; opacity:0.6;"><circle cx="8" cy="8" r="1.5"/><circle cx="3" cy="8" r="1.5"/><circle cx="13" cy="8" r="1.5"/></svg>
                </div>

                <div class="board-cards">
                    @foreach ($items as $task)
                        <a href="{{ route('projects.show', ['project' => $project, 'task' => $task->id]) }}" class="task-card">
                            <span class="task-card-title">{{ $task->title }}</span>
                            
                            <div style="display:flex; gap: 4px; margin-top:2px;">
                                <span class="badge {{ $task->priority }}">{{ $task->priority }}</span>
                            </div>

                            <div class="task-card-footer">
                                <span class="task-card-meta">
                                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="12" height="11" rx="2"/><path d="M5 1v4M11 1v4M2 7h12"/></svg>
                                    {{ optional($task->due_date)->format('M d') ?? 'No date' }}
                                </span>
                                @if($task->assignee)
                                    <div class="avatar" @style(['width: 20px', 'height: 20px', 'font-size: 8px', 'background-color: ' . $task->assignee->avatar_color]) title="{{ $task->assignee->name }}">
                                        {{ strtoupper(substr($task->assignee->name,0,1)) }}
                                    </div>
                                @endif
                            </div>
                        </a>
                    @endforeach
                    
                    <button class="btn btn-ghost" style="justify-content:flex-start; width:100%; border-radius:6px; color:var(--text-secondary);">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2v12M2 8h12"/></svg>
                        Create issue
                    </button>
                </div>
            </div>
        @endforeach
    </div>

    <!-- Slide-in Panel (right side) -->
    @if ($selectedTask)
        <div class="slide-panel-overlay">
            <div class="slide-panel">
                <div class="slide-panel-header">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <span style="color:var(--text-secondary); font-size:13px; font-weight:500;">TASK-{{ $selectedTask->id }}</span>
                                <span class="badge {{ $selectedTask->status }}">{{ str_replace('_', ' ', $selectedTask->status) }}</span>
                            </div>
                    <div class="page-header-actions">
                        <button class="icon-btn" title="Copy link"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 10a4 4 0 01-4-4 4 4 0 014-4h2M10 6a4 4 0 014 4 4 4 0 01-4 4H8"/></svg></button>
                        <a href="{{ route('projects.show', $project) }}" class="icon-btn" title="Close"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4l-8 8M4 4l8 8"/></svg></a>
                    </div>
                </div>

                <div class="slide-panel-body">
                    <form action="{{ route('tasks.update', $selectedTask) }}" method="POST">
                        @csrf
                        <textarea class="title-input" name="title" rows="2">{{ $selectedTask->title }}</textarea>

                        <div class="grid-2" style="margin-bottom: 32px;">
                            <div class="form-group" style="margin:0;">
                                <label class="form-label">Assignee</label>
                                <select name="assignee_id" class="form-select" style="cursor:pointer;">
                                    @foreach ($members as $member)
                                        <option value="{{ $member->id }}" @selected($selectedTask->assignee_id === $member->id)>{{ $member->name }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="form-group" style="margin:0;">
                                <label class="form-label">Due Date</label>
                                <input type="date" name="due_date" class="form-input" value="{{ optional($selectedTask->due_date)->toDateString() }}" style="cursor:pointer;">
                            </div>
                            <div class="form-group" style="margin:0;">
                                <label class="form-label">Status</label>
                                <select name="status" class="form-select" style="cursor:pointer;">
                                    @foreach (['todo' => 'To Do', 'in_progress' => 'In Progress', 'blocked' => 'Blocked', 'done' => 'Done'] as $value => $label)
                                        <option value="{{ $value }}" @selected($selectedTask->status === $value)>{{ $label }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="form-group" style="margin:0;">
                                <label class="form-label">Priority</label>
                                <select name="priority" class="form-select" style="cursor:pointer;">
                                    @foreach (['low' => 'Low', 'medium' => 'Medium', 'high' => 'High'] as $value => $label)
                                        <option value="{{ $value }}" @selected($selectedTask->priority === $value)>{{ $label }}</option>
                                    @endforeach
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <textarea name="description" class="form-textarea" placeholder="Add a more detailed description...">{{ $selectedTask->description }}</textarea>
                        </div>

                        <div class="page-header-actions" style="justify-content:flex-end;">
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                        </div>
                    </form>

                    @if (!($authUser->role === 'client'))
                    <div style="margin-top: 48px; border-top: 1px solid var(--border); padding-top: 32px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h4 style="font-size:14px; font-weight:600; color:var(--text-main);">Time Tracking</h4>
                            
                            @if ($selectedTask->assignee_id === $authUser->id && $selectedTask->status === 'in_progress')
                                @if ($activeTimer && $activeTimer->task_id === $selectedTask->id)
                                    <form action="{{ route('tasks.timer.stop', $selectedTask) }}" method="POST">
                                        @csrf
                                        <button class="btn" style="background:#e53e3e; color:white; font-size:12px; padding:6px 12px; border:none; border-radius:6px;">
                                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style="margin-right:4px;"><rect x="3" y="3" width="10" height="10" rx="1"/></svg> Stop Timer
                                        </button>
                                    </form>
                                @elseif (!$activeTimer)
                                    <form action="{{ route('tasks.timer.start', $selectedTask) }}" method="POST">
                                        @csrf
                                        <button class="btn" style="background:#10b981; color:white; font-size:12px; padding:6px 12px; border:none; border-radius:6px;">
                                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l2 2"/></svg> Start Timer
                                        </button>
                                    </form>
                                @endif
                            @endif
                        </div>

                        <form action="{{ route('tasks.time-logs.store', $selectedTask) }}" method="POST" style="background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:16px; margin-bottom:24px;">
                            @csrf
                            <div class="grid-2" style="margin-bottom:12px; gap:12px;">
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label">Date</label>
                                    <input type="date" name="date" class="form-input" value="{{ date('Y-m-d') }}" required style="font-size:13px;">
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label">Duration (minutes)</label>
                                    <input type="number" min="1" name="duration_minutes" class="form-input" placeholder="e.g. 150" required style="font-size:13px;">
                                </div>
                            </div>
                            <div class="form-group" style="margin-bottom:12px;">
                                <label class="form-label">Note</label>
                                <input type="text" name="note" class="form-input" placeholder="What did you work on?" style="font-size:13px;">
                            </div>
                            <button class="btn btn-secondary btn-sm" style="font-size:12px; padding: 4px 10px;">Log Time</button>
                        </form>

                        <div class="table-wrap">
                            <table>
                                <tbody>
                                    @forelse ($selectedTask->timeLogs->where('is_deleted', false) as $log)
                                        <tr>
                                            <td style="width:40px; padding:8px 12px;">
                                                <div class="avatar" @style(['width:24px', 'height:24px', 'font-size:10px', 'background-color: ' . $log->user->avatar_color])>
                                                    {{ strtoupper(substr($log->user->name, 0, 1)) }}
                                                </div>
                                            </td>
                                            <td style="padding:8px 12px;">
                                                <div style="font-weight:500; font-size:13px;">{{ $log->user->name }} &middot; <span style="font-weight:400; color:var(--text-secondary);">{{ round($log->duration_minutes / 60, 1) }}h</span></div>
                                                <div style="color:var(--text-secondary); font-size:12px;">{{ $log->note ?? 'No notes' }}</div>
                                            </td>
                                            <td style="text-align:right; color:var(--text-secondary); font-size:12px; padding:8px 12px;">
                                                {{ \Carbon\Carbon::parse($log->date)->format('M d, Y') }}
                                            </td>
                                        </tr>
                                    @empty
                                        <tr><td colspan="3" style="text-align:center; color:var(--text-secondary); padding: 12px; font-size:13px;">No time logged yet.</td></tr>
                                    @endforelse
                                </tbody>
                            </table>
                        </div>
                    </div>
                    @endif

                    <div style="margin-top: 48px; border-top: 1px solid var(--border); padding-top: 32px;">
                        <h4 style="font-size:14px; font-weight:600; color:var(--text-main); margin-bottom:20px;">Activity</h4>
                        
                        <form action="{{ route('tasks.comments.store', $selectedTask) }}" method="POST" style="display:flex; gap:12px; margin-bottom: 32px;">
                            @csrf
                            <div class="avatar" @style(['background-color: ' . ($authUser->avatar_color ?? '#0052CC')])>{{ strtoupper(substr($authUser->name ?? 'U',0,1)) }}</div>
                            <div style="flex:1;">
                                <input type="text" name="body" class="form-input" placeholder="Add a comment... (Press Enter to post)">
                            </div>
                        </form>

                        <div class="timeline">
                            @foreach ($selectedTask->comments as $comment)
                                <div class="timeline-item">
                                    <div class="avatar" @style(['background-color: ' . $comment->user->avatar_color])>{{ strtoupper(substr($comment->user->name,0,1)) }}</div>
                                    <div class="timeline-content">
                                        <div class="timeline-header">
                                            <span class="timeline-author">{{ $comment->user->name }}</span>
                                            <span class="timeline-date">{{ $comment->created_at->diffForHumans() }}</span>
                                        </div>
                                        <div class="timeline-body">{{ $comment->body }}</div>
                                    </div>
                                </div>
                            @endforeach
                            
                            @foreach ($selectedTask->activityLogs as $log)
                                <div class="timeline-item">
                                    <div class="avatar" style="width: 24px; height: 24px; background:var(--bg); border: 2px solid var(--surface); color:var(--text-secondary);"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2v12M2 8h12"/></svg></div>
                                    <div class="timeline-content">
                                        <div class="timeline-meta">
                                            <strong>{{ $log->user->name }}</strong> {{ $log->description }}
                                            <div class="timeline-date">{{ $log->created_at->diffForHumans() }}</div>
                                        </div>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    </div>
                </div>
            </div>
        </div>
    @endif
    {{-- ══════════════════════════════════════════════════════════════════ --}}
    {{-- LIST VIEW (hidden by default, toggled by JS) — FT-006 SCR-005   --}}
    {{-- ══════════════════════════════════════════════════════════════════ --}}
    <div id="list-view" style="display:none; margin-top:20px;">
        <div class="card" style="padding:0; overflow:hidden;">
            <form id="bulk-form" action="{{ route('projects.bulk-update', $project) }}" method="POST">
                @csrf
                {{-- Hidden fields filled by floating action bar JS --}}
                <input type="hidden" name="action" id="bulk-action-input">
                <input type="hidden" name="status" id="bulk-status-input">
                <input type="hidden" name="assignee_id" id="bulk-assignee-input">
                <input type="hidden" name="due_date" id="bulk-duedate-input">
                <input type="hidden" name="confirm_delete" id="bulk-confirm-delete-input">
                <input type="hidden" name="confirmed" id="bulk-confirmed-input" value="0">

                <table style="width:100%; border-collapse:collapse; font-size:13px;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border); background: var(--surface);">
                            <th style="padding:10px 16px; width:36px;">
                                <input type="checkbox" id="select-all-tasks" title="Select All" onchange="toggleSelectAll(this)">
                            </th>
                            <th style="text-align:left; padding:10px 12px; font-weight:600; color:var(--text-secondary);">Task</th>
                            <th style="text-align:left; padding:10px 12px; font-weight:600; color:var(--text-secondary);">Assignee</th>
                            <th style="text-align:left; padding:10px 12px; font-weight:600; color:var(--text-secondary);">Status</th>
                            <th style="text-align:left; padding:10px 12px; font-weight:600; color:var(--text-secondary);">Priority</th>
                            <th style="text-align:left; padding:10px 12px; font-weight:600; color:var(--text-secondary);">Due Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($tasks as $task)
                            <tr style="border-bottom: 1px solid var(--border);" class="task-list-row" data-task-id="{{ $task->id }}">
                                <td style="padding:10px 16px;">
                                    <input type="checkbox" name="task_ids[]" value="{{ $task->id }}" class="task-checkbox" onchange="onCheckboxChange()">
                                </td>
                                <td style="padding:10px 12px;">
                                    <a href="{{ route('projects.show', ['project' => $project, 'task' => $task->id]) }}"
                                       style="font-weight:500; color:var(--text-main); text-decoration:none;">{{ $task->title }}</a>
                                </td>
                                <td style="padding:10px 12px;">
                                    @if($task->assignee)
                                        <div style="display:flex; align-items:center; gap:6px;">
                                            <div class="avatar" @style(['width: 20px', 'height: 20px', 'font-size: 8px', 'background-color: ' . $task->assignee->avatar_color])>
                                                {{ strtoupper(substr($task->assignee->name, 0, 1)) }}
                                            </div>
                                            <span style="color:var(--text-main); font-size:12px;">{{ $task->assignee->name }}</span>
                                        </div>
                                    @else
                                        <span style="color:var(--text-secondary); font-size:12px;">Unassigned</span>
                                    @endif
                                </td>
                                <td style="padding:10px 12px;">
                                    <span class="badge {{ $task->status }}">{{ str_replace('_', ' ', $task->status) }}</span>
                                </td>
                                <td style="padding:10px 12px;">
                                    <span class="badge {{ $task->priority }}">{{ $task->priority }}</span>
                                </td>
                                <td style="padding:10px 12px; color:var(--text-secondary); font-size:12px;">
                                    {{ optional($task->due_date)->format('d M Y') ?? '—' }}
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </form>
        </div>
    </div>

    {{-- ══════════════════════════════════════════════════════════════════ --}}
    {{-- FLOATING ACTION BAR — FT-006 FR-023, SCR-005                     --}}
    {{-- Appears at bottom of viewport when ≥1 checkbox is checked.       --}}
    {{-- ══════════════════════════════════════════════════════════════════ --}}
    <div id="bulk-action-bar" style="
        display:none; position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
        background:var(--surface); border:1px solid var(--border); border-radius:12px;
        box-shadow:0 8px 32px rgba(0,0,0,0.18); padding:12px 20px; z-index:1000;
        gap:12px; align-items:center; min-width:560px; flex-wrap:wrap;
    " class="hidden">
        <span id="bulk-selected-count" style="font-size:13px; font-weight:600; color:var(--text-main); min-width:80px;">0 selected</span>

        {{-- Change Status --}}
        <select id="bulk-status-select" class="form-select" style="font-size:12px; padding:6px 10px; min-width:130px;" onchange="if(this.value) submitBulk('status', {status:this.value})">
            <option value="">Change Status…</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
        </select>

        {{-- Reassign --}}
        <select id="bulk-assignee-select" class="form-select" style="font-size:12px; padding:6px 10px; min-width:140px;" onchange="if(this.value) submitBulk('reassign', {assignee_id:this.value})">
            <option value="">Reassign to…</option>
            @foreach ($members as $member)
                <option value="{{ $member->id }}">{{ $member->name }}</option>
            @endforeach
        </select>

        {{-- Due Date --}}
        <label style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-secondary);">
            Due date:
            <input type="date" id="bulk-duedate" class="form-input" style="font-size:12px; padding:4px 8px;"
                   onchange="if(this.value) submitBulk('due_date', {due_date:this.value})">
        </label>

        {{-- Delete --}}
        <button type="button" class="btn btn-ghost" style="color:#e53e3e; font-size:12px;" onclick="triggerBulkDelete()">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,4 13,4"/><path d="M5 4V2h6v2M6 7v5M10 7v5"/><rect x="3" y="4" width="10" height="10" rx="1"/></svg>
            Delete
        </button>

        <button type="button" class="btn btn-ghost" style="font-size:12px;" onclick="clearSelection()">Cancel</button>
    </div>

    {{-- ══════════════════════════════════════════════════════════════════ --}}
    {{-- VANILLA JS — View toggle + Bulk Action logic                      --}}
    {{-- ══════════════════════════════════════════════════════════════════ --}}
    <script>
    // ─── View toggle ───────────────────────────────────────────────────────
    function setView(mode) {
        const boardView = document.querySelector('.board-container');
        const listView  = document.getElementById('list-view');
        const btnBoard  = document.getElementById('btn-board-view');
        const btnList   = document.getElementById('btn-list-view');

        if (mode === 'list') {
            boardView.style.display = 'none';
            listView.style.display  = 'block';
            btnList.style.borderColor  = 'var(--primary)';
            btnList.style.color        = 'var(--primary)';
            btnBoard.style.borderColor = '';
            btnBoard.style.color       = '';
        } else {
            listView.style.display  = 'none';
            boardView.style.display = '';
            btnBoard.style.borderColor = 'var(--primary)';
            btnBoard.style.color       = 'var(--primary)';
            btnList.style.borderColor  = '';
            btnList.style.color        = '';
            clearSelection();
        }
    }

    // ─── Checkbox helpers ──────────────────────────────────────────────────
    function toggleSelectAll(master) {
        document.querySelectorAll('.task-checkbox').forEach(cb => cb.checked = master.checked);
        onCheckboxChange();
    }

    function onCheckboxChange() {
        const checked = document.querySelectorAll('.task-checkbox:checked');
        const bar     = document.getElementById('bulk-action-bar');
        const counter = document.getElementById('bulk-selected-count');
        counter.textContent = checked.length + ' selected';

        if (checked.length > 0) {
            bar.style.display = 'flex';
            bar.classList.remove('hidden');
        } else {
            bar.style.display = 'none';
        }

        // Keep "select all" in sync
        const all = document.querySelectorAll('.task-checkbox');
        document.getElementById('select-all-tasks').checked = (all.length > 0 && checked.length === all.length);
    }

    function clearSelection() {
        document.querySelectorAll('.task-checkbox').forEach(cb => cb.checked = false);
        document.getElementById('select-all-tasks').checked = false;
        document.getElementById('bulk-status-select').value   = '';
        document.getElementById('bulk-assignee-select').value = '';
        document.getElementById('bulk-duedate').value         = '';
        document.getElementById('bulk-action-bar').style.display = 'none';
    }

    // ─── Submit bulk form ──────────────────────────────────────────────────
    function submitBulk(action, extras = {}) {
        const checked = document.querySelectorAll('.task-checkbox:checked');
        if (checked.length === 0) return;

        // FR-026: confirm if N > 10
        if (checked.length > 10) {
            if (!confirm('This action will affect ' + checked.length + ' tasks. Continue?')) {
                clearSelection();
                return;
            }
            document.getElementById('bulk-confirmed-input').value = '1';
        }

        document.getElementById('bulk-action-input').value    = action;
        document.getElementById('bulk-status-input').value    = extras.status    || '';
        document.getElementById('bulk-assignee-input').value  = extras.assignee_id || '';
        document.getElementById('bulk-duedate-input').value   = extras.due_date  || '';
        document.getElementById('bulk-form').submit();
    }

    // FR-027: Type "DELETE" confirm for bulk delete
    function triggerBulkDelete() {
        const typed = prompt('Type DELETE to confirm bulk deletion of selected tasks:');
        if (typed !== 'DELETE') {
            alert('Bulk delete cancelled. You must type DELETE exactly.');
            return;
        }
        document.getElementById('bulk-confirm-delete-input').value = 'DELETE';
        submitBulk('delete');
    }
    </script>
@endsection

