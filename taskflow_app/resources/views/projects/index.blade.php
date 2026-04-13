@extends('layouts.app')

@section('title', 'Projects · TaskFlow')
@section('eyebrow', 'Workspace')
@section('page-title', 'Projects')

@section('content')
    <div class="page-header">
        <div>
            <h1>All Projects</h1>
            <p>Manage and track project delivery across your team.</p>
        </div>
    </div>

    @if ($authUser->canManageProjects())
        <div class="card">
            <div class="section-header">
                <div>
                    <div class="section-title">Create Project</div>
                    <div class="section-subtitle">Set the client, timeline and initial team members.</div>
                </div>
            </div>
            <form class="form-grid" action="{{ route('projects.store') }}" method="POST">
                @csrf
                <div class="form-row">
                    <label>
                        <span class="label-text">Project Name</span>
                        <input type="text" name="name" placeholder="e.g. TaskFlow Q3 Rollout" required>
                    </label>
                    <label>
                        <span class="label-text">Client</span>
                        <select name="client_id">
                            <option value="">Internal project</option>
                            @foreach ($clients as $client)
                                <option value="{{ $client->id }}">{{ $client->name }}</option>
                            @endforeach
                        </select>
                    </label>
                </div>
                <label>
                    <span class="label-text">Description</span>
                    <textarea name="description" rows="3" placeholder="Short description of scope, outcome or delivery stream."></textarea>
                </label>
                <div class="form-row">
                    <label>
                        <span class="label-text">Status</span>
                        <select name="status" required>
                            <option value="active">Active</option>
                            <option value="on_hold">On Hold</option>
                            <option value="completed">Completed</option>
                        </select>
                    </label>
                    <label>
                        <span class="label-text">Hourly Rate (VND)</span>
                        <input type="number" min="1" name="hourly_rate_vnd" placeholder="Optional">
                    </label>
                </div>
                <div class="form-row">
                    <label>
                        <span class="label-text">Start Date</span>
                        <input type="date" name="start_date">
                    </label>
                    <label>
                        <span class="label-text">End Date</span>
                        <input type="date" name="end_date">
                    </label>
                </div>
                <label>
                    <span class="label-text">Initial Members</span>
                    <select name="member_ids[]" multiple size="6">
                        @foreach ($projectUsers as $projectUser)
                            <option value="{{ $projectUser->id }}">{{ $projectUser->name }} · {{ $projectUser->title }}</option>
                        @endforeach
                    </select>
                </label>
                <button class="btn btn-primary" type="submit">Create Project</button>
            </form>
        </div>
    @endif

    <div class="grid-3">
        @forelse ($projects as $project)
            <div class="card project-card">
                <div class="project-card-head">
                    <div>
                        <div class="project-card-label">{{ $project->client?->name ?? 'Internal' }}</div>
                        <div class="project-card-name">{{ $project->name }}</div>
                    </div>
                    <span class="badge {{ $project->status === 'active' ? 'badge-green' : 'badge-default' }}">
                        {{ strtoupper($project->status) }}
                    </span>
                </div>

                <p class="project-card-desc">{{ $project->description }}</p>

                <div>
                    <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-tertiary);margin-bottom:5px;">
                        <span>Progress</span>
                        <span style="font-weight:600;color:var(--primary);">{{ $project->progress }}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" @style(['width' => $project->progress.'%'])></div>
                    </div>
                </div>

                <div class="meta-grid">
                    <div class="meta-item">
                        <span>Tasks</span>
                        <strong>{{ $project->tasks_count }}</strong>
                    </div>
                    <div class="meta-item">
                        <span>Members</span>
                        <strong>{{ $project->users->count() }}</strong>
                    </div>
                    <div class="meta-item">
                        <span>Hourly Rate</span>
                        <strong>{{ $project->hourly_rate_vnd ? number_format($project->hourly_rate_vnd).' VND' : '—' }}</strong>
                    </div>
                </div>

                <a class="btn btn-primary btn-full" href="{{ route('projects.show', $project) }}">
                    Open Project
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 8h10M9 4l4 4-4 4"/>
                    </svg>
                </a>
            </div>
        @empty
            <div class="card" style="grid-column:1/-1;">
                <div class="empty-state">No projects found.</div>
            </div>
        @endforelse
    </div>

@endsection
