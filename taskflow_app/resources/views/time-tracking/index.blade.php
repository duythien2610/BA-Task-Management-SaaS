@extends('layouts.app')

@section('title', 'Time Tracking · TaskFlow')
@section('eyebrow', 'Workspace')
@section('page-title', 'Time Tracking')

@section('content')

    <div class="page-header">
        <h1>Time Tracking</h1>
        <p>Monitor live timers and review logged work hours across the team.</p>
    </div>

    <div class="grid-2-1">

        {{-- Active timer --}}
        <div class="card">
            <div class="section-header">
                <div>
                    <div class="section-title">Team Workload Summary</div>
                    <div class="section-subtitle">Logged effort across all projects</div>
                </div>
            </div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Member</th>
                            <th>Projects</th>
                            <th>Tasks</th>
                            <th>Total Hours</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($timeSummary as $row)
                            <tr>
                                <td>
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div class="av-xs" @style(['background' => $row['user']->avatar_color])>
                                            {{ strtoupper(substr($row['user']->name, 0, 1)) }}
                                        </div>
                                        {{ $row['user']->name }}
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

        {{-- Active timer card --}}
        <div class="card">
            <div class="section-header">
                <div>
                    <div class="section-title">Active Timer</div>
                    <div class="section-subtitle">Your current live session</div>
                </div>
            </div>

            @if ($activeTimer)
                <div class="metric-panel" style="border-color:var(--success-border);background:var(--success-soft);">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <div style="width:8px;height:8px;border-radius:50%;background:var(--success);animation:pulse 2s infinite;"></div>
                        <strong style="color:var(--success);">Running</strong>
                    </div>
                    <strong style="font-size:15px;">{{ $activeTimer->task->title }}</strong>
                    <span>{{ $activeTimer->task->project->name }}</span>
                    <p>Started at {{ $activeTimer->started_at->format('H:i') }}</p>
                </div>
            @else
                <div class="empty-state">
                    <div style="margin-bottom:8px;">⏸</div>
                    No active timer running.
                </div>
            @endif
        </div>
    </div>

    {{-- Time log history --}}
    <div class="card">
        <div class="section-header">
            <div>
                <div class="section-title">Time Log History</div>
                <div class="section-subtitle">All recorded time entries</div>
            </div>
        </div>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Member</th>
                        <th>Project</th>
                        <th>Task</th>
                        <th>Duration</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($logs as $log)
                        <tr>
                            <td style="color:var(--text-secondary);">{{ $log->date->format('d M Y') }}</td>
                            <td>{{ $log->user->name }}</td>
                            <td style="color:var(--text-secondary);">{{ $log->task->project->name }}</td>
                            <td>{{ $log->task->title }}</td>
                            <td><strong>{{ number_format($log->duration_minutes / 60, 1) }}h</strong></td>
                        </tr>
                    @empty
                        <tr><td colspan="5" class="empty-state">No time entries recorded yet.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

    <style>
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }
    </style>

@endsection
