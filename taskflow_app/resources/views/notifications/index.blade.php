@extends('layouts.app')

@section('title', 'Notifications · TaskFlow')
@section('eyebrow', 'Workspace')
@section('page-title', 'Notifications')

@section('content')
<div style="max-width: 900px; margin: 0 auto; padding-bottom: 40px;">
    <div class="page-header">
        <div>
            <h1>Notifications</h1>
            <p>Stay up to date with your workspace activity.</p>
        </div>
        <form action="{{ route('notifications.mark-all') }}" method="POST" class="page-header-actions">
            @csrf
            <button class="btn btn-secondary">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M2 8l4 4 8-8"/>
                </svg>
                Mark all as read
            </button>
        </form>
    </div>

    <div class="grid-2">

        {{-- Notifications list --}}
        <div class="card">
            <div class="section-header">
                <div>
                    <div class="section-title">Recent Notifications</div>
                </div>
            </div>
            <div class="timeline">
                @forelse ($notifications as $item)
                    <div class="timeline-item {{ $item->is_read ? '' : 'highlighted' }}">
                        <div class="timeline-dot"></div>
                        <div class="timeline-body">
                            <strong>{{ $item->title }}</strong>
                            <span>{{ $item->message }}</span>
                            <small>{{ $item->created_at->diffForHumans() }}</small>
                        </div>
                    </div>
                @empty
                    <div class="empty-state">You have no notifications.</div>
                @endforelse
            </div>
            {{ $notifications->links() }}
        </div>

        {{-- Preferences --}}
        <div class="card">
            <div class="section-header">
                <div>
                    <div class="section-title">Notification Preferences</div>
                    <div class="section-subtitle">Choose how you want to be notified</div>
                </div>
            </div>
            <form action="{{ route('notifications.preferences') }}" method="POST">
                @csrf
                <div class="table-wrap" style="margin-bottom:24px; border:1px solid var(--border); border-radius:8px;">
                    <table style="width:100%; margin:0;">
                        <thead>
                            <tr style="background:var(--surface);">
                                <th style="padding:12px; font-size:12px; letter-spacing:0.5px; color:var(--text-secondary);">EVENT</th>
                                <th style="padding:12px; text-align:center; font-size:12px; letter-spacing:0.5px; color:var(--text-secondary);">IN-APP</th>
                                <th style="padding:12px; text-align:center; font-size:12px; letter-spacing:0.5px; color:var(--text-secondary);">EMAIL</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach (['assigned' => 'Task Assigned', 'overdue' => 'Task Overdue', 'comment' => 'Comment Added', 'status_change' => 'Status Changed'] as $trigger => $label)
                                <tr style="border-top:1px solid var(--border);">
                                    <td style="padding:14px 12px; font-weight:500; font-size:14px;">{{ $label }}</td>
                                    <td style="padding:14px 12px; text-align:center;">
                                        <input type="checkbox" name="preferences[{{ $trigger }}][in_app]" value="1"
                                            @checked(optional($preferences->get($trigger)['in_app'] ?? null)->is_enabled)
                                            style="width:18px;height:18px;accent-color:var(--primary); cursor:pointer;">
                                    </td>
                                    <td style="padding:14px 12px; text-align:center;">
                                        <input type="checkbox" name="preferences[{{ $trigger }}][email]" value="1"
                                            @checked(optional($preferences->get($trigger)['email'] ?? null)->is_enabled)
                                            style="width:18px;height:18px;accent-color:var(--primary); cursor:pointer;">
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
                <div style="display:flex; justify-content:flex-end;">
                    <button class="btn btn-primary" style="padding:10px 24px; font-weight:600; border-radius:8px;">Save Preferences</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
