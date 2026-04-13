@extends('layouts.app')
@section('title', 'Dashboard · TaskFlow')

@section('content')
    <div class="page-header">
        @php
            $hour = now()->hour;
            $greeting = $hour < 12 ? 'Good morning' : ($hour < 18 ? 'Good afternoon' : 'Good evening');
        @endphp
        <h1>{{ $authUser->isClient() ? 'Project Overview' : $greeting.', '.$authUser->name }}</h1>
        <p>{{ $authUser->isClient() ? "Track your project delivery progress." : "Here's what's happening across your workspace today." }}</p>
    </div>

    <style>
        .skeleton-pulse {
            animation: pulse-bg 1.5s infinite;
        }
        .skeleton-box {
            background-color: var(--surface);
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .skeleton-stats {
            height: 104px;
        }
        
        .skeleton-card {
            height: 380px;
        }

        @keyframes pulse-bg {
            0% { background-color: var(--surface); opacity: 1; }
            50% { background-color: var(--border); opacity: 0.6; }
            100% { background-color: var(--surface); opacity: 1; }
        }
    </style>

    <div id="dashboard-suspense-container">
        <!-- Skeleton Loading -->
        <div class="stats-grid">
            <div class="stat-card skeleton-box skeleton-pulse skeleton-stats"></div>
            <div class="stat-card skeleton-box skeleton-pulse skeleton-stats"></div>
            <div class="stat-card skeleton-box skeleton-pulse skeleton-stats"></div>
            <div class="stat-card skeleton-box skeleton-pulse skeleton-stats"></div>
        </div>
        
        <div class="dashboard-layout mt-4" style="margin-top: 1.5rem;">
            <div class="card skeleton-box skeleton-pulse skeleton-card"></div>
            <div class="card skeleton-box skeleton-pulse skeleton-card"></div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            fetch("{{ route('dashboard.partials') }}")
                .then(response => {
                    if(!response.ok) throw new Error('Render failed');
                    return response.text();
                })
                .then(html => {
                    document.getElementById('dashboard-suspense-container').innerHTML = html;
                    
                    // Nếu project có dùng thư viện/script đặc hữu nào (ví dụ tooltip), khởi tạo lại ở đây:
                    // if (typeof initializeTooltips === 'function') initializeTooltips();
                })
                .catch(error => {
                    console.error('Suspense Load Error:', error);
                    document.getElementById('dashboard-suspense-container').innerHTML = 
                        '<div class="card"><div class="card-body text-danger">Không thể tải dữ liệu Dashboard ngay lúc này. Xin vui lòng thử lại sau.</div></div>';
                });
        });
    </script>

@endsection
