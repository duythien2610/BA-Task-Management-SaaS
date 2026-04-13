<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="TaskFlow — Enterprise Work Management Platform">
    <title>@yield('title', 'TaskFlow')</title>
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
</head>
<body>
    @php
        $pageLabel = trim(str_replace('· TaskFlow', '', $__env->yieldContent('title', 'Workspace')));
    @endphp
    <div class="app-layout">
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-logo-wrap">
                    <img src="{{ asset('logo.png') }}" alt="TaskFlow Logo" class="sidebar-logo">
                </div>
                <div class="sidebar-caption">
                    <strong>Internal workspace</strong>
                    Track delivery, people and project status in one place.
                </div>
            </div>

            <nav class="sidebar-nav">
                <a href="{{ route('dashboard') }}" class="nav-item {{ request()->routeIs('dashboard') ? 'active' : '' }}">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="2" width="5" height="5" rx="1"/>
                        <rect x="9" y="2" width="5" height="5" rx="1"/>
                        <rect x="2" y="9" width="5" height="5" rx="1"/>
                        <rect x="9" y="9" width="5" height="5" rx="1"/>
                    </svg>
                    Dashboard
                </a>
                
                <div class="nav-section">Work</div>

                <a href="{{ route('projects.index') }}" class="nav-item {{ request()->routeIs('projects.*') ? 'active' : '' }}">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2.5 4.5A2 2 0 014.5 2.5h2l1 2h4A2 2 0 0113.5 6.5v5a2 2 0 01-2 2h-9a2 2 0 01-2-2v-7z"/>
                    </svg>
                    Projects
                </a>

                <a href="{{ route('exports.index') }}" class="nav-item {{ request()->routeIs('exports.*') ? 'active' : '' }}">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 6.5V2.5a1 1 0 00-1-1H3.5a1 1 0 00-1 1v11a1 1 0 001 1h8a1 1 0 001-1v-4"/><path d="M7.5 7.5L14 1M14 1v4.5M14 1H9.5"/>
                    </svg>
                    Reports
                </a>

                <a href="{{ route('time-tracking.index') }}" class="nav-item {{ request()->routeIs('time-tracking.*') ? 'active' : '' }}">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="8" cy="8" r="5.5"/><path d="M8 5v3.5l2 1.5"/>
                    </svg>
                    Time Tracking
                </a>

                <a href="{{ route('notifications.index') }}" class="nav-item {{ request()->routeIs('notifications.*') ? 'active' : '' }}">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M8 1.5a5 5 0 015 5v3l1 2H2l1-2v-3a5 5 0 015-5z"/><path d="M6.5 13.5a1.5 1.5 0 003 0"/>
                    </svg>
                    Notifications
                </a>

                @if (($authUser ?? false) && ($authUser->canManageUsers() || $authUser->canManageClients()))
                    <div class="nav-section">Admin</div>
                    @if ($authUser->canManageUsers())
                        <a href="{{ route('users.index') }}" class="nav-item {{ request()->routeIs('users.*') ? 'active' : '' }}">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M10.5 4.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM2 13.5c0-1.9 2.7-3.5 6-3.5s6 1.6 6 3.5"/>
                            </svg>
                            Users
                        </a>
                    @endif
                    @if ($authUser->canManageClients())
                        <a href="{{ route('clients.index') }}" class="nav-item {{ request()->routeIs('clients.*') ? 'active' : '' }}">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="2" y="3.5" width="12" height="9" rx="1.5"/><path d="M5 3.5V2a1 1 0 011-1h4a1 1 0 011 1v1.5"/>
                            </svg>
                            Clients
                        </a>
                    @endif
                @endif
            </nav>

            <div class="sidebar-footer">
                <div class="avatar" @style(['background: ' . ($authUser->avatar_color ?? '#0052CC')])>
                    {{ strtoupper(substr($authUser->name ?? 'U', 0, 1)) }}
                </div>
                <div class="sidebar-user">
                    <strong>{{ $authUser->name ?? 'User' }}</strong>
                    <span>{{ ucfirst($authUser->role ?? 'admin') }}</span>
                </div>
                <form action="{{ route('logout') }}" method="POST">
                    @csrf
                    <button class="icon-btn" title="Log out">
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3"/><path d="M10.5 5.5L14 8l-3.5 2.5M14 8H6"/>
                        </svg>
                    </button>
                </form>
            </div>
        </aside>

        <main class="workspace">
            <header class="topbar">
                <div class="topbar-title">
                    <span>TaskFlow workspace</span>
                    <strong>{{ $pageLabel }}</strong>
                </div>

                <div class="topbar-tools">
                    <div class="search-container" style="opacity: 0.5; pointer-events: none;" title="Search — coming in Q3">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <circle cx="7" cy="7" r="5"/><path d="M14 14l-3.5-3.5"/>
                        </svg>
                        <input type="text" class="search-input" placeholder="Search (Q3 roadmap)" disabled>
                    </div>

                    <div class="topbar-actions">
                        <a href="{{ route('projects.index') }}" class="btn btn-primary btn-sm">Open Projects</a>

                        <details class="topbar-menu">
                            <summary class="icon-btn">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                                    <path d="M8 1.5a5 5 0 015 5v3l1 2H2l1-2v-3a5 5 0 015-5z"/><path d="M6.5 13.5a1.5 1.5 0 003 0"/>
                                </svg>
                                @if (($unreadNotificationCount ?? 0) > 0)
                                    <div class="badge-dot"></div>
                                @endif
                            </summary>
                            <div class="notification-menu">
                                @forelse (($peekNotifications ?? collect()) as $notification)
                                    <a href="{{ route('notifications.read', $notification) }}" class="notification-preview">
                                        <strong>{{ $notification->title }}</strong>
                                        <span>{{ $notification->message }}</span>
                                        <small>{{ $notification->created_at->diffForHumans() }}</small>
                                    </a>
                                @empty
                                    <div class="empty-state">No new notifications.</div>
                                @endforelse
                                <a class="btn btn-secondary btn-full btn-sm" href="{{ route('notifications.index') }}">View all notifications</a>
                            </div>
                        </details>

                        <div class="topbar-user">
                            <div class="avatar" @style(['background: ' . ($authUser->avatar_color ?? '#1d4ed8')])>
                                {{ strtoupper(substr($authUser->name ?? 'U', 0, 1)) }}
                            </div>
                            <div class="topbar-user-meta">
                                <strong>{{ $authUser->name ?? 'User' }}</strong>
                                <span>{{ ucfirst($authUser->role ?? 'admin') }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div class="workspace-scroll">
                <div class="surface-banner">
                    @if (session('status'))
                        <div class="alert success">
                            {{ session('status') }}
                        </div>
                    @endif
                    @if ($errors->any())
                        <div class="alert error">
                            <ul>
                                @foreach ($errors->all() as $error)
                                    <li>{{ $error }}</li>
                                @endforeach
                            </ul>
                        </div>
                    @endif
                </div>

                <div class="page-shell">
                    @yield('content')
                </div>
            </div>
        </main>
    </div>
</body>
</html>
