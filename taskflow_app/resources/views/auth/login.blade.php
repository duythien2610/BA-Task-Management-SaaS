<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Sign in to TaskFlow — Enterprise Work Management">
    <title>Sign In · TaskFlow</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
</head>
<body class="login-body">
    <div class="login-wrap">
        <div class="login-brand-panel">
            <div class="login-brand">
                <img src="{{ asset('logo.png') }}" alt="TaskFlow Logo" class="login-brand-logo">
                <div class="login-brand-copy">
                    <h1>Clean workspace for teams that need clarity.</h1>
                    <p>TaskFlow keeps delivery, assignments, progress and reporting in one focused internal workspace.</p>
                </div>
            </div>

            <div class="login-points">
                <div class="login-point">
                    <strong>Project visibility</strong>
                    Track delivery progress, status and blockers without clutter.
                </div>
                <div class="login-point">
                    <strong>Operational control</strong>
                    Manage members, clients, time logs and exports from one place.
                </div>
            </div>
        </div>

        <div class="login-card">
            <h2>Welcome back</h2>
            <p class="login-subtitle">Sign in to your workspace to continue.</p>

            @if ($errors->any())
                <div class="alert error" style="margin-bottom:20px;">
                    <ul>
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            <form action="{{ route('login.store') }}" method="POST" class="form-grid" id="login-form">
                @csrf
                <label>
                    <span class="label-text">Email address</span>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        value="{{ old('email') }}"
                        placeholder="you@company.com"
                        required
                        autocomplete="email"
                    >
                </label>

                <label>
                    <span class="label-text">Password</span>
                    <input
                        type="password"
                        name="password"
                        id="password"
                        placeholder="••••••••"
                        required
                        autocomplete="current-password"
                    >
                </label>

                <label class="checkbox-inline">
                    <input type="checkbox" name="remember" id="remember" value="1">
                    <span>Keep me signed in</span>
                </label>

                <button class="btn btn-primary btn-full btn-lg" type="submit">
                    Sign In
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 8h10M9 4l4 4-4 4"/>
                    </svg>
                </button>
            </form>
        </div>
    </div>
    <p class="footer-note">© {{ date('Y') }} TaskFlow. Internal workspace.</p>
</body>
</html>
