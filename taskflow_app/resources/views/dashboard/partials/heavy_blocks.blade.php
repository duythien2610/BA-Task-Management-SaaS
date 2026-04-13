<div class="stats-grid">
    <div class="stat-card">
        <div class="stat-label">Projects</div>
        <div class="stat-value">{{ $stats['projects'] }}</div>
        <div class="stat-note">Active in workspace</div>
    </div>
    <div class="stat-card">
        <div class="stat-label">Tracked Hours</div>
        <div class="stat-value">{{ number_format($stats['hours'] / 60, 1) }}<span>h</span></div>
        <div class="stat-note">{{ $authUser->canViewBilling() ? 'Across all billable work' : 'Across accessible tasks' }}</div>
    </div>
    <div class="stat-card">
        <div class="stat-label">Overdue Tasks</div>
        <div class="stat-value @if($stats['overdue'] > 0) text-danger @endif">{{ $stats['overdue'] }}</div>
        <div class="stat-note">Past due date, not completed</div>
    </div>
    <div class="stat-card">
        <div class="stat-label">Completion Rate</div>
        <div class="stat-value">{{ $stats['completion'] }}<span>%</span></div>
        <div class="stat-note">Tasks marked done</div>
    </div>
</div>

<div class="dashboard-layout">
    <div class="card">
        <div class="card-header">
            <div>
                <div class="card-title">{{ $authUser->isClient() ? 'Your Projects' : 'Assigned to You' }}</div>
                <div class="card-subtitle">{{ $authUser->isClient() ? 'Projects you have visibility into' : 'Tasks currently on your desk' }}</div>
            </div>
            <a class="btn btn-secondary btn-sm" href="{{ route('projects.index') }}">View all</a>
        </div>

        <div class="card-body">
            @if ($authUser->isClient())
                @forelse ($projects as $project)
                    <a href="{{ route('projects.show', $project) }}" class="list-item">
                        <div class="list-item-main">
                            <strong>{{ $project->name }}</strong>
                            <small>{{ $project->client?->name }}</small>
                        </div>
                        <div class="page-header-actions">
                            <div style="width:100px;">
                                <div class="progress-bar-bg">
                                    <div class="progress-bar-fill" @style(['width: ' . $project->progress . '%'])></div>
                                </div>
                            </div>
                            <span class="badge badge-blue">{{ $project->progress }}%</span>
                        </div>
                    </a>
                @empty
                    <div class="empty-state">No projects available.</div>
                @endforelse

            @else
                @forelse ($assignedTasks as $task)
                    <a href="{{ route('projects.show', ['project' => $task->project_id, 'task' => $task->id]) }}" class="list-item">
                        <div class="list-item-main">
                            <strong>{{ $task->title }}</strong>
                            <small>{{ $task->project->name }}</small>
                        </div>
                        <span class="badge {{ $task->status }}">{{ str_replace('_', ' ', $task->status) }}</span>
                    </a>
                @empty
                    <div class="empty-state">No tasks currently assigned to you.</div>
                @endforelse
            @endif
        </div>
    </div>

    <div class="card">
        <div class="card-header">
            <div>
                <div class="card-title">Recent Activity</div>
                <div class="card-subtitle">Workspace audit stream</div>
            </div>
        </div>
        <div class="card-body">
            <div class="timeline">
                @forelse ($recentActivity as $log)
                    <div class="timeline-item">
                        <div class="avatar" style="width: 24px; height: 24px; background:var(--bg); border: 2px solid var(--surface); color:var(--text-secondary);"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2v12M2 8h12"/></svg></div>
                        <div class="timeline-content">
                            <div class="timeline-meta">
                                <strong>{{ $log->user?->name ?? 'System' }}</strong> {{ $log->description }}
                                <div class="timeline-date">{{ $log->created_at->diffForHumans() }}</div>
                            </div>
                        </div>
                    </div>
                @empty
                    <div class="empty-state">No recent activity.</div>
                @endforelse
            </div>
        </div>
    </div>

</div>

@if (!$authUser->isClient())
    <div class="card">
        <div class="card-header">
            <div>
                <div class="card-title">Team Workload</div>
                <div class="card-subtitle">Logged effort across all members</div>
            </div>
        </div>
        <div class="card-body">
            <div class="table-wrap">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Member</th>
                            <th>Projects</th>
                            <th>Tasks</th>
                            <th>Logged Hours</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($teamSummary as $row)
                            <tr>
                                <td>
                                    <div style="display:flex;align-items:center;gap:12px;">
                                        <div class="avatar" @style(['background-color: ' . $row['user']->avatar_color])>
                                            {{ strtoupper(substr($row['user']->name, 0, 1)) }}
                                        </div>
                                        <div>
                                            <div style="font-weight:600; color:var(--text-main);">{{ $row['user']->name }}</div>
                                            <div class="timeline-date">{{ $row['user']->title }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{{ $row['projects'] }}</td>
                                <td>{{ $row['tasks'] }}</td>
                                <td><strong>{{ number_format($row['minutes'] / 60, 1) }}h</strong></td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
@endif
