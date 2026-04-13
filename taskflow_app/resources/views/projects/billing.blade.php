@extends('layouts.app')
@section('title', 'Billing Summary · ' . $project->name . ' · TaskFlow')

@section('content')
<div style="max-width: 900px; margin: 0 auto; padding-bottom: 40px;">
    <div class="project-header">
        <div>
            <div class="project-title">
                <div class="project-icon">{{ strtoupper(substr($project->name, 0, 1)) }}</div>
                {{ $project->name }}
                <span style="color:var(--text-secondary); font-weight:400; font-size:14px;">/ Billing Summary</span>
            </div>
            <div class="project-meta">
                <span>{{ $project->client ? $project->client->name : 'Internal' }}</span>
                <span>•</span>
                <span>Rate: {{ $project->hourly_rate_vnd ? number_format($project->hourly_rate_vnd) . ' VND/hr' : 'No rate set' }}</span>
            </div>
        </div>
        <div class="page-header-actions">
            <a href="{{ route('projects.show', $project) }}" class="btn btn-secondary">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 12l-4-4 4-4"/></svg>
                Back to Project
            </a>
        </div>
    </div>

    {{-- Period Filter (SCR-002 spec: Weekly | Monthly toggle + date range pickers) --}}
    <div class="card" style="margin-bottom: 20px; padding: 24px;">
        <form method="GET" action="{{ route('projects.billing', $project) }}" style="display:flex; gap:24px; align-items:flex-end; flex-wrap:wrap;">
            <div>
                <div class="label-text" style="font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:8px;">PERIOD SPAN</div>
                <div style="display:flex; border: 1px solid var(--border); border-radius: 6px; overflow:hidden;">
                    <a href="{{ route('projects.billing', array_merge(request()->query(), ['period' => 'weekly', 'project' => $project->id])) }}"
                       class="btn btn-sm {{ $period === 'weekly' ? 'btn-primary' : 'btn-ghost' }}"
                       style="border-radius:0; border:none; padding:8px 16px;">Weekly</a>
                    <a href="{{ route('projects.billing', array_merge(request()->query(), ['period' => 'monthly', 'project' => $project->id])) }}"
                       class="btn btn-sm {{ $period === 'monthly' ? 'btn-primary' : 'btn-ghost' }}"
                       style="border-radius:0; border-left:1px solid var(--border); padding:8px 16px;">Monthly</a>
                </div>
            </div>
            <label>
                <span class="label-text" style="font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:8px; display:block;">FROM</span>
                <input type="date" name="billing_start" value="{{ $billingStart }}" class="form-input" style="padding:7px 12px;">
            </label>
            <label>
                <span class="label-text" style="font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:8px; display:block;">TO</span>
                <input type="date" name="billing_end" value="{{ $billingEnd }}" class="form-input" style="padding:7px 12px;">
            </label>
            <input type="hidden" name="period" value="{{ $period }}">
            <button type="submit" class="btn btn-primary" style="padding:8px 24px; font-weight:600;">Apply</button>
        </form>
    </div>

    {{-- Billing Rate Edit (Owner only — SCR-002 spec, edit-billing-rate gate) --}}
    @can('edit-billing-rate')
        <div class="card" style="margin-bottom: 20px; padding: 24px;">
            <div class="section-header">
                <div>
                    <div class="section-title">Project Hourly Rate</div>
                    <div class="section-subtitle">Editable by Owner only. Applied to all logged hours for cost calculation.</div>
                </div>
            </div>
            <form action="{{ route('projects.billing-rate', $project) }}" method="POST" style="display:flex; gap:16px; align-items:flex-end;">
                @csrf
                <label style="flex:1; max-width:320px;">
                    <span class="label-text" style="font-weight:600; margin-bottom:8px; display:inline-block;">Hourly Rate (VND) / Hour</span>
                    <div style="display:flex;">
                        <input type="number" name="hourly_rate_vnd" value="{{ $project->hourly_rate_vnd }}" min="1" placeholder="e.g. 350000" class="form-input" style="border-top-right-radius:0; border-bottom-right-radius:0;">
                        <button type="submit" class="btn btn-secondary" style="border-top-left-radius:0; border-bottom-left-radius:0; border-left:none;">Update Rate</button>
                    </div>
                </label>
            </form>
        </div>
    @else
        <div class="card" style="margin-bottom: 20px; padding: 24px;">
            <div class="section-header">
                <div class="section-title">Project Hourly Rate</div>
            </div>
            <div style="font-size:14px; color:var(--text-main);">
                {{ $project->hourly_rate_vnd ? number_format($project->hourly_rate_vnd) . ' VND / hour' : 'No hourly rate configured. Contact the Owner to set a rate.' }}
            </div>
        </div>
    @endcan

    {{-- Billing Summary Table (SCR-002: breakdown + Grand Total row) --}}
    <div class="card" style="padding-top: 24px;">
        <div class="section-header" style="padding: 0 24px;">
            <div>
                <div class="section-title">Billable Hours Breakdown</div>
                <div class="section-subtitle">
                    {{ \Carbon\Carbon::parse($billingStart)->format('d M Y') }} – {{ \Carbon\Carbon::parse($billingEnd)->format('d M Y') }}
                    &middot; {{ ucfirst($period) }}
                </div>
            </div>
        </div>

        <div style="padding: 0 24px 24px 24px;">
            <table style="width:100%; border-collapse:collapse; font-size:13px; margin-top:8px;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border);">
                        <th style="text-align:left; padding:12px 16px; font-weight:600; color:var(--text-secondary);">Team Member</th>
                        <th style="text-align:right; padding:12px 16px; font-weight:600; color:var(--text-secondary);">Hours Logged</th>
                        <th style="text-align:right; padding:12px 16px; font-weight:600; color:var(--text-secondary);">Rate (VND/hr)</th>
                        <th style="text-align:right; padding:12px 16px; font-weight:600; color:var(--text-secondary);">Billable Amount (VND)</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($billingRows as $row)
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding:16px;">
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <div class="avatar" @style(['background: ' . $row['user']->avatar_color, 'width:32px', 'height:32px'])>
                                        {{ strtoupper(substr($row['user']->name, 0, 1)) }}
                                    </div>
                                    <div>
                                        <div style="font-weight:600; font-size:14px; color:var(--text-main);">{{ $row['user']->name }}</div>
                                        <div style="font-size:12px; color:var(--text-secondary);">{{ ucfirst($row['user']->role) }}</div>
                                    </div>
                                </div>
                            </td>
                            <td style="text-align:right; padding:16px; font-variant-numeric:tabular-nums; font-size:14px;">
                                {{ number_format($row['minutes'] / 60, 1) }} h
                            </td>
                            <td style="text-align:right; padding:16px; font-size:14px; color:var(--text-secondary);">
                                {{ $project->hourly_rate_vnd ? number_format($project->hourly_rate_vnd) : '—' }}
                            </td>
                            <td style="text-align:right; padding:16px; font-weight:600; font-size:14px;">
                                {{ $row['amount'] ? number_format($row['amount']) : '—' }}
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="4" style="padding:48px; text-align:center; color:var(--text-secondary); background:var(--bg); border-radius:8px;">
                                <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 12px; opacity: 0.5;"><path d="M8 2v12M2 8h12"/></svg><br>
                                No time logs found for the selected period.<br>
                                <span style="font-size:12px;">Time logs only appear after tasks are worked on.</span>
                            </td>
                        </tr>
                    @endforelse
                </tbody>
                @if ($billingRows->isNotEmpty())
                    <tfoot>
                        <tr style="border-top: 2px solid var(--border); background: var(--bg);">
                            <td style="padding:16px; font-weight:700; font-size:14px; color:var(--text-main); border-bottom-left-radius:8px;">Grand Total</td>
                            <td style="text-align:right; padding:16px; font-weight:700; font-size:14px;">
                                {{ number_format($totalMinutes / 60, 1) }} h
                            </td>
                            <td style="padding:16px;"></td>
                            <td style="text-align:right; padding:16px; font-weight:700; font-size:16px; color:var(--primary); border-bottom-right-radius:8px;">
                                {{ $grandTotal ? number_format($grandTotal) . ' VND' : '—' }}
                            </td>
                        </tr>
                    </tfoot>
                @endif
            </table>
        </div>
    </div>
</div>
@endsection
