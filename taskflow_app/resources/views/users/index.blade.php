@extends('layouts.app')

@section('title', 'User Management · TaskFlow')
@section('eyebrow', 'Administration')
@section('page-title', 'User Management')

@section('content')

    <div class="page-header">
        <h1>User Management</h1>
        <p>Manage team members, assign roles, and control workspace access.</p>
    </div>

    <div class="grid-2">

        {{-- Invite / Create user --}}
        <div class="card">
            <div class="section-header">
                <div>
                    <div class="section-title">Add New Member</div>
                    <div class="section-subtitle">Create a new account and assign a role</div>
                </div>
            </div>
            <form class="form-grid" action="{{ route('users.store') }}" method="POST">
                @csrf
                <div class="form-row">
                    <label>
                        <span class="label-text">Full Name</span>
                        <input type="text" name="name" placeholder="e.g. Nguyen Van A" required>
                    </label>
                    <label>
                        <span class="label-text">Job Title</span>
                        <input type="text" name="title" placeholder="e.g. Project Manager">
                    </label>
                </div>
                <label>
                    <span class="label-text">Email Address</span>
                    <input type="email" name="email" placeholder="user@company.com" required>
                </label>
                <div class="form-row">
                    <label>
                        <span class="label-text">Role</span>
                        <select name="role" required>
                            <option value="admin">Admin</option>
                            <option value="pm">Project Manager</option>
                            <option value="member" selected>Member</option>
                            <option value="client">Client</option>
                        </select>
                    </label>
                    <label>
                        <span class="label-text">Client Account</span>
                        <select name="client_id">
                            <option value="">— None —</option>
                            @foreach ($clients as $client)
                                <option value="{{ $client->id }}">{{ $client->name }}</option>
                            @endforeach
                        </select>
                    </label>
                </div>
                <button class="btn btn-primary">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M8 3v10M3 8h10"/>
                    </svg>
                    Create User
                </button>
            </form>
        </div>

        {{-- Role matrix --}}
        <div class="card">
            <div class="section-header">
                <div>
                    <div class="section-title">Team Members</div>
                    <div class="section-subtitle">Manage roles and access levels</div>
                </div>
            </div>
            <div class="list-stack">
                @foreach ($users as $user)
                    <form class="list-row" action="{{ route('users.role', $user) }}" method="POST"
                          style="flex-wrap:wrap;gap:10px;cursor:default;">
                        @csrf
                        <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:160px;">
                            <div class="av-md" @style(['background' => $user->avatar_color])>
                                {{ strtoupper(substr($user->name, 0, 1)) }}
                            </div>
                            <div>
                                <div style="font-weight:600;font-size:13.5px;">{{ $user->name }}</div>
                                <div style="font-size:12px;color:var(--text-tertiary);">{{ $user->email }} · {{ $user->title }}</div>
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                            <select name="role" @disabled($user->role === 'owner') style="width:auto;">
                                @foreach (['admin' => 'Admin', 'pm' => 'PM', 'member' => 'Member', 'client' => 'Client'] as $value => $label)
                                    <option value="{{ $value }}" @selected($user->role === $value)>{{ $label }}</option>
                                @endforeach
                            </select>
                            <select name="client_id" @disabled($user->role !== 'client') style="width:auto;">
                                <option value="">No client</option>
                                @foreach ($clients as $client)
                                    <option value="{{ $client->id }}" @selected($user->client_id === $client->id)>{{ $client->name }}</option>
                                @endforeach
                            </select>
                            <button class="btn btn-secondary btn-sm" @disabled($user->role === 'owner')>Update</button>
                        </div>
                    </form>
                @endforeach
            </div>
        </div>
    </div>

@endsection
