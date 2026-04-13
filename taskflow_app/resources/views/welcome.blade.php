<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>TaskFlow - Manage Tasks Without the Chaos</title>
    
    <!-- Google Fonts: Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Phosphor Icons for simple icons -->
    <script src="https://unpkg.com/@phosphor-icons/web"></script>

    <style>
        :root {
            --primary: #4F46E5;
            --primary-hover: #4338ca;
            --bg-color: #F9FAFB;
            --surface: #FFFFFF;
            --text-main: #111827;
            --text-muted: #6B7280;
            --border: #E5E7EB;
            --border-hover: #D1D5DB;
            
            --spacing-1: 8px;
            --spacing-2: 16px;
            --spacing-3: 24px;
            --spacing-4: 32px;
            --spacing-5: 40px;
            --spacing-6: 48px;
            --spacing-8: 64px;
            --spacing-12: 96px;
            --spacing-16: 128px;
            
            --radius-md: 8px;
            --radius-lg: 12px;
            --radius-xl: 16px;
            --radius-full: 9999px;
            
            --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            
            --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-color);
            color: var(--text-main);
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
        }

        a {
            text-decoration: none;
            color: inherit;
            transition: var(--transition);
        }

        ul {
            list-style: none;
        }

        button {
            font-family: inherit;
            cursor: pointer;
            border: none;
            background: none;
            outline: none;
            transition: var(--transition);
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 var(--spacing-3);
        }

        /* Buttons */
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-1) var(--spacing-2);
            font-size: 14px;
            font-weight: 500;
            border-radius: var(--radius-md);
            transition: var(--transition);
        }

        .btn:hover {
            transform: scale(1.02);
        }

        .btn-primary {
            background-color: var(--primary);
            color: white;
            padding: 10px var(--spacing-3);
            box-shadow: var(--shadow-sm);
        }

        .btn-primary:hover {
            background-color: var(--primary-hover);
            box-shadow: var(--shadow-md);
        }

        .btn-secondary {
            background-color: white;
            color: var(--text-main);
            border: 1px solid var(--border);
            padding: 10px var(--spacing-3);
            box-shadow: var(--shadow-sm);
        }

        .btn-secondary:hover {
            border-color: var(--border-hover);
            background-color: var(--bg-color);
        }

        .btn-text {
            color: var(--text-muted);
        }

        .btn-text:hover {
            color: var(--text-main);
        }

        /* Header */
        header {
            position: sticky;
            top: 0;
            z-index: 100;
            background-color: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(8px);
            border-bottom: 1px solid transparent;
            transition: var(--transition);
        }

        header.scrolled {
            border-bottom-color: var(--border);
            box-shadow: var(--shadow-sm);
        }

        .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 72px;
        }

        .logo {
            font-size: 20px;
            font-weight: 700;
            color: var(--text-main);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .logo-icon {
            width: 28px;
            height: 28px;
            background: linear-gradient(135deg, var(--primary), #818cf8);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }

        .nav-links {
            display: flex;
            align-items: center;
            gap: var(--spacing-4);
        }

        .nav-links a {
            font-size: 14px;
            font-weight: 500;
            color: var(--text-muted);
        }

        .nav-links a:hover {
            color: var(--text-main);
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: var(--spacing-2);
        }

        /* Hero Section */
        .hero {
            padding: var(--spacing-16) 0 var(--spacing-12);
            background: linear-gradient(180deg, #EEF2FF 0%, var(--bg-color) 100%);
            position: relative;
            overflow: hidden;
        }

        .hero-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--spacing-8);
            align-items: center;
        }

        .hero-text h1 {
            font-size: 60px;
            font-weight: 700;
            line-height: 1.1;
            letter-spacing: -0.02em;
            margin-bottom: var(--spacing-3);
            color: var(--text-main);
        }

        .hero-text p {
            font-size: 18px;
            color: var(--text-muted);
            margin-bottom: var(--spacing-5);
            max-width: 480px;
            line-height: 1.6;
        }

        .hero-actions {
            display: flex;
            align-items: center;
            gap: var(--spacing-2);
        }

        .hero-visual {
            position: relative;
            perspective: 1000px;
        }

        /* Dashboard UI Mockup */
        .mockup {
            background-color: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-xl);
            overflow: hidden;
            transform: rotateY(-5deg) rotateX(2deg);
            transform-origin: center right;
            transition: var(--transition);
        }
        
        .mockup:hover {
            transform: rotateY(0deg) rotateX(0deg) translateY(-10px);
        }

        .mockup-header {
            border-bottom: 1px solid var(--border);
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            background-color: #FAFAFA;
        }

        .mockup-dots {
            display: flex;
            gap: 6px;
        }

        .mockup-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: #E5E7EB;
        }
        .mockup-dot:nth-child(1) { background-color: #FECACA; }
        .mockup-dot:nth-child(2) { background-color: #FEF08A; }
        .mockup-dot:nth-child(3) { background-color: #BBF7D0; }

        .mockup-body {
            padding: 20px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            background-color: var(--bg-color);
            height: 380px;
        }

        .mockup-column {
            background-color: var(--surface);
            border-radius: var(--radius-md);
            padding: 12px;
            border: 1px solid var(--border);
        }
        
        .mockup-col-header {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-muted);
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
        }
        
        .mockup-task {
            background-color: white;
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 10px;
            margin-bottom: 8px;
            box-shadow: var(--shadow-sm);
        }
        
        .mockup-task-title {
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 8px;
        }
        
        .mockup-task-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .mockup-tag {
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            background-color: #EEF2FF;
            color: var(--primary);
        }

        .mockup-avatar {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background-color: #D1D5DB;
        }

        /* Product Preview */
        .preview-section {
            padding: var(--spacing-12) 0;
            text-align: center;
        }

        .section-header {
            max-width: 600px;
            margin: 0 auto var(--spacing-8);
        }

        .section-title {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: var(--spacing-2);
        }

        .section-desc {
            font-size: 16px;
            color: var(--text-muted);
        }
        
        .view-toggles {
            display: inline-flex;
            background-color: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 4px;
            margin-bottom: var(--spacing-6);
        }
        
        .view-toggle {
            padding: 6px 16px;
            font-size: 14px;
            font-weight: 500;
            border-radius: 4px;
            color: var(--text-muted);
            cursor: pointer;
        }
        
        .view-toggle.active {
            background-color: var(--bg-color);
            color: var(--text-main);
            box-shadow: var(--shadow-sm);
        }

        .preview-container {
            max-width: 1000px;
            margin: 0 auto;
            background-color: var(--surface);
            border-radius: var(--radius-xl);
            border: 1px solid var(--border);
            box-shadow: var(--shadow-xl);
            overflow: hidden;
            height: 600px;
            position: relative;
        }
        
        /* Simulated UI for Preview */
        .preview-layout {
            display: flex;
            height: 100%;
        }
        
        .preview-sidebar {
            width: 240px;
            border-right: 1px solid var(--border);
            background-color: #FAFAFA;
            padding: 20px;
            text-align: left;
        }
        
        .preview-nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 12px;
            border-radius: var(--radius-md);
            color: var(--text-muted);
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 4px;
        }
        
        .preview-nav-item.active {
            background-color: #EEF2FF;
            color: var(--primary);
        }
        
        .preview-content {
            flex: 1;
            padding: 32px;
            background-color: white;
            text-align: left;
        }
        
        .preview-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }
        
        .preview-title {
            font-size: 24px;
            font-weight: 600;
        }
        
        .preview-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .preview-list-item {
            display: flex;
            align-items: center;
            padding: 16px;
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            gap: 16px;
        }
        
        .preview-checkbox {
            width: 18px;
            height: 18px;
            border-radius: 4px;
            border: 2px solid var(--border);
        }
        
        .preview-list-item-title {
            flex: 1;
            font-size: 14px;
            font-weight: 500;
        }
        
        .preview-list-item-meta {
            display: flex;
            align-items: center;
            gap: 16px;
            color: var(--text-muted);
            font-size: 13px;
        }

        /* Features Cards Grid */
        .features {
            padding: var(--spacing-12) 0;
            background-color: var(--surface);
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: var(--spacing-4);
        }

        .feature-card {
            background-color: var(--bg-color);
            padding: var(--spacing-4);
            border-radius: var(--radius-lg);
            border: 1px solid var(--border);
            transition: var(--transition);
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .feature-card:hover {
            transform: translateY(-8px);
            box-shadow: var(--shadow-lg);
            background-color: var(--surface);
            border-color: var(--primary);
        }

        .feature-icon {
            width: 48px;
            height: 48px;
            background: #EEF2FF;
            color: var(--primary);
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: var(--spacing-3);
            font-size: 24px;
        }

        .feature-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: var(--spacing-1);
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .feature-desc {
            font-size: 14px;
            color: var(--text-muted);
            margin-bottom: var(--spacing-4);
            flex-grow: 1;
        }

        .feature-link {
            font-size: 14px;
            font-weight: 500;
            color: var(--primary);
            display: inline-flex;
            align-items: center;
            gap: 4px;
            margin-top: auto;
        }

        .feature-card:hover .feature-link i {
            transform: translateX(4px);
        }
        
        .feature-link i {
            transition: transform 0.2s;
        }

        /* Stats Section */
        .stats {
            padding: var(--spacing-12) 0;
            background-color: var(--primary);
            color: white;
            text-align: center;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: var(--spacing-5);
        }

        .stat-number {
            font-size: 48px;
            font-weight: 700;
            margin-bottom: var(--spacing-1);
        }

        .stat-label {
            font-size: 14px;
            opacity: 0.8;
            font-weight: 500;
        }

        /* Pricing Section */
        .pricing {
            padding: var(--spacing-16) 0;
        }

        .pricing-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: var(--spacing-4);
            align-items: center;
            max-width: 1000px;
            margin: 0 auto;
        }

        .pricing-card {
            background-color: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: var(--spacing-5);
            transition: var(--transition);
        }

        .pricing-card.featured {
            border: 2px solid var(--primary);
            box-shadow: var(--shadow-xl);
            transform: scale(1.05);
            position: relative;
        }
        
        .featured-badge {
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--primary);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }

        .plan-name {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: var(--spacing-2);
        }

        .plan-price {
            font-size: 40px;
            font-weight: 700;
            margin-bottom: var(--spacing-4);
            display: flex;
            align-items:baseline;
        }

        .plan-price span {
            font-size: 16px;
            color: var(--text-muted);
            font-weight: 400;
            margin-left: 4px;
        }

        .plan-features {
            margin-bottom: var(--spacing-5);
        }

        .plan-feature {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            font-size: 14px;
            color: var(--text-muted);
        }

        .plan-feature i {
            color: var(--primary);
        }

        .pricing-card .btn {
            width: 100%;
        }

        /* Footer */
        footer {
            background-color: var(--surface);
            padding: var(--spacing-12) 0 var(--spacing-5);
            border-top: 1px solid var(--border);
        }

        .footer-grid {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            gap: var(--spacing-8);
            margin-bottom: var(--spacing-8);
        }

        .footer-brand p {
            color: var(--text-muted);
            margin-top: var(--spacing-2);
            font-size: 14px;
            max-width: 300px;
        }

        .footer-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: var(--spacing-3);
            color: var(--text-main);
        }

        .footer-links li {
            margin-bottom: var(--spacing-2);
        }

        .footer-links a {
            color: var(--text-muted);
            font-size: 14px;
        }

        .footer-links a:hover {
            color: var(--primary);
        }

        .footer-bottom {
            border-top: 1px solid var(--border);
            padding-top: var(--spacing-5);
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: var(--text-muted);
            font-size: 14px;
        }

        .social-links {
            display: flex;
            gap: var(--spacing-3);
        }
        
        .social-links a {
            color: var(--text-muted);
            font-size: 20px;
        }
        
        .social-links a:hover {
            color: var(--primary);
        }

        /* Responsive */
        @media (max-width: 1024px) {
            .hero-content {
                grid-template-columns: 1fr;
                text-align: center;
            }
            .hero-text p {
                margin: 0 auto var(--spacing-5);
            }
            .hero-actions {
                justify-content: center;
            }
            .mockup {
                max-width: 600px;
                margin: 0 auto;
                transform: none;
            }
            .mockup:hover {
                transform: translateY(-10px);
            }
            .pricing-grid {
                grid-template-columns: 1fr;
                gap: var(--spacing-6);
            }
            .pricing-card.featured {
                transform: none;
            }
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (max-width: 768px) {
            .hero-text h1 {
                font-size: 40px;
            }
            .footer-grid {
                grid-template-columns: 1fr;
            }
            .stats-grid {
                grid-template-columns: 1fr;
            }
            .preview-sidebar {
                display: none;
            }
            .header-actions {
                display: none;
            }
            .nav-links {
                display: none;
            }
        }
    </style>
</head>
<body>

    <!-- Header -->
    <header id="header">
        <div class="container header-content">
            <a href="/" class="logo">
                <div class="logo-icon">
                    <i class="ph ph-check-square-offset"></i>
                </div>
                TaskFlow
            </a>
            
            <nav class="nav-links">
                <a href="#features">Features</a>
                <a href="#preview">Product</a>
                <a href="#pricing">Pricing</a>
            </nav>
            
            <div class="header-actions">
                @if (Route::has('login'))
                    @auth
                        <a href="{{ url('/dashboard') }}" class="btn btn-text">Dashboard</a>
                    @else
                        <a href="{{ route('login') }}" class="btn btn-text">Log in</a>
                        @if (Route::has('register'))
                            <a href="{{ route('register') }}" class="btn btn-primary">Get Started</a>
                        @endif
                    @endauth
                @else
                    <a href="/login" class="btn btn-text">Log in</a>
                    <a href="/register" class="btn btn-primary">Get Started</a>
                @endif
            </div>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
        <div class="container hero-content">
            <div class="hero-text">
                <h1>Manage Tasks Without the Chaos</h1>
                <p>Streamline your workflow, collaborate seamlessly, and hit your goals faster with our intuitive task management platform designed for modern teams.</p>
                <div class="hero-actions">
                    <a href="/register" class="btn btn-primary">Create Your First Task</a>
                    <a href="#preview" class="btn btn-secondary">Try Demo</a>
                </div>
            </div>
            
            <div class="hero-visual">
                <div class="mockup">
                    <div class="mockup-header">
                        <div class="mockup-dots">
                            <div class="mockup-dot"></div>
                            <div class="mockup-dot"></div>
                            <div class="mockup-dot"></div>
                        </div>
                    </div>
                    <div class="mockup-body">
                        <!-- Todo Column -->
                        <div class="mockup-column">
                            <div class="mockup-col-header">
                                <span>To Do</span>
                                <span>3</span>
                            </div>
                            <div class="mockup-task">
                                <div class="mockup-task-title">Design landing page</div>
                                <div class="mockup-task-meta">
                                    <span class="mockup-tag">Design</span>
                                    <div class="mockup-avatar"></div>
                                </div>
                            </div>
                            <div class="mockup-task">
                                <div class="mockup-task-title">Create user personas</div>
                                <div class="mockup-task-meta">
                                    <span class="mockup-tag" style="background: #FEF3C7; color: #D97706;">Research</span>
                                    <div class="mockup-avatar"></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- In Progress Column -->
                        <div class="mockup-column">
                            <div class="mockup-col-header">
                                <span>In Progress</span>
                                <span>1</span>
                            </div>
                            <div class="mockup-task">
                                <div class="mockup-task-title">Update brand guidelines</div>
                                <div class="mockup-task-meta">
                                    <span class="mockup-tag">Design</span>
                                    <div class="mockup-avatar"></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Done Column -->
                        <div class="mockup-column">
                            <div class="mockup-col-header">
                                <span>Done</span>
                                <span>2</span>
                            </div>
                            <div class="mockup-task" style="opacity: 0.7;">
                                <div class="mockup-task-title" style="text-decoration: line-through;">Competitor Analysis</div>
                                <div class="mockup-task-meta">
                                    <span class="mockup-tag" style="background: #FEF3C7; color: #D97706;">Research</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Product Preview Section -->
    <section id="preview" class="preview-section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">A view for every workflow</h2>
                <p class="section-desc">Whether you prefer boards, lists, or calendars, TaskFlow adapts to how your team works best.</p>
            </div>
            
            <div class="view-toggles">
                <div class="view-toggle">Kanban Board</div>
                <div class="view-toggle active">List View</div>
                <div class="view-toggle">Calendar</div>
            </div>
            
            <div class="preview-container">
                <div class="preview-layout">
                    <div class="preview-sidebar">
                        <div class="preview-nav-item"><i class="ph ph-house"></i> Home</div>
                        <div class="preview-nav-item active"><i class="ph ph-list-checks"></i> My Tasks</div>
                        <div class="preview-nav-item"><i class="ph ph-bell"></i> Inbox</div>
                        <div style="margin-top: 24px; font-size: 12px; font-weight: 600; color: #9CA3AF; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Projects</div>
                        <div class="preview-nav-item"><span style="width: 8px; height: 8px; border-radius: 50%; background: #EF4444;"></span> Marketing</div>
                        <div class="preview-nav-item"><span style="width: 8px; height: 8px; border-radius: 50%; background: #3B82F6;"></span> Engineering</div>
                        <div class="preview-nav-item"><span style="width: 8px; height: 8px; border-radius: 50%; background: #10B981;"></span> Design</div>
                    </div>
                    <div class="preview-content">
                        <div class="preview-header">
                            <h3 class="preview-title">My Tasks</h3>
                            <button class="btn btn-primary" style="padding: 8px 16px;"><i class="ph ph-plus" style="margin-right: 8px;"></i> Add Task</button>
                        </div>
                        
                        <div class="preview-list">
                            <div class="preview-list-item">
                                <div class="preview-checkbox"></div>
                                <div class="preview-list-item-title">Finalize Q3 Marketing Budget</div>
                                <div class="preview-list-item-meta">
                                    <span style="color: #EF4444; font-weight: 500;">Tomorrow</span>
                                    <span>Marketing</span>
                                </div>
                            </div>
                            <div class="preview-list-item">
                                <div class="preview-checkbox"></div>
                                <div class="preview-list-item-title">Review candidate portfolios for Senior UX Designer role</div>
                                <div class="preview-list-item-meta">
                                    <span>Oct 24</span>
                                    <span>Design</span>
                                </div>
                            </div>
                            <div class="preview-list-item">
                                <div class="preview-checkbox"></div>
                                <div class="preview-list-item-title">Prepare slide deck for all-hands meeting</div>
                                <div class="preview-list-item-meta">
                                    <span>Oct 26</span>
                                    <span>Company</span>
                                </div>
                            </div>
                            <div class="preview-list-item" style="border-style: dashed; background: #FAFAFA; color: #9CA3AF;">
                                <div class="preview-list-item-title" style="display: flex; align-items: center; gap: 8px;">
                                    <i class="ph ph-plus"></i> Add a new task
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Content Section -->
    <section id="features" class="features">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">Everything you need to succeed</h2>
                <p class="section-desc">Powerful features stripped of complexity. Just intuitive tools to move your work forward.</p>
            </div>
            
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon"><i class="ph ph-lightning"></i></div>
                    <h3 class="feature-title">Real-time Sync</h3>
                    <p class="feature-desc">Changes happen instantly across all devices. No more refreshing or waiting for updates when collaborating.</p>
                    <a href="#" class="feature-link">Learn more <i class="ph ph-arrow-right"></i></a>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon"><i class="ph ph-rows"></i></div>
                    <h3 class="feature-title">Customizable Workflows</h3>
                    <p class="feature-desc">Tailor your boards, statuses, and custom fields to match exactly how your team naturally operates.</p>
                    <a href="#" class="feature-link">Learn more <i class="ph ph-arrow-right"></i></a>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon"><i class="ph ph-users"></i></div>
                    <h3 class="feature-title">Team Collaboration</h3>
                    <p class="feature-desc">Keep conversations contextual with in-task comments, mentions, and file attachments.</p>
                    <a href="#" class="feature-link">Learn more <i class="ph ph-arrow-right"></i></a>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon"><i class="ph ph-chart-line-up"></i></div>
                    <h3 class="feature-title">Progress Tracking</h3>
                    <p class="feature-desc">Visualize your project's health with automated burn-down charts, velocity tracking, and workload views.</p>
                    <a href="#" class="feature-link">Learn more <i class="ph ph-arrow-right"></i></a>
                </div>
            </div>
        </div>
    </section>

    <!-- Stats Section -->
    <section class="stats">
        <div class="container stats-grid">
            <div>
                <div class="stat-number">10k+</div>
                <div class="stat-label">TEAMS WORLDWIDE</div>
            </div>
            <div>
                <div class="stat-number">2M+</div>
                <div class="stat-label">TASKS COMPLETED</div>
            </div>
            <div>
                <div class="stat-number">99.9%</div>
                <div class="stat-label">UPTIME GUARANTEE</div>
            </div>
            <div>
                <div class="stat-number">24/7</div>
                <div class="stat-label">CUSTOMER SUPPORT</div>
            </div>
        </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="pricing">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">Simple, transparent pricing</h2>
                <p class="section-desc">No hidden fees. No artificial limits. Choose the plan that fits your team's size and needs.</p>
            </div>
            
            <div class="pricing-grid">
                <!-- Basic Plan -->
                <div class="pricing-card">
                    <h3 class="plan-name">Starter</h3>
                    <div class="plan-price">$0<span>/month</span></div>
                    <p class="feature-desc" style="margin-bottom: 24px;">Perfect for individuals and small projects.</p>
                    <div class="plan-features">
                        <div class="plan-feature"><i class="ph ph-check-circle"></i> Up to 3 users</div>
                        <div class="plan-feature"><i class="ph ph-check-circle"></i> Unlimited tasks</div>
                        <div class="plan-feature"><i class="ph ph-check-circle"></i> Basic list views</div>
                        <div class="plan-feature"><i class="ph ph-check-circle"></i> Community support</div>
                    </div>
                    <button class="btn btn-secondary">Get Started</button>
                </div>
                
                <!-- Pro Plan -->
                <div class="pricing-card featured">
                    <div class="featured-badge">MOST POPULAR</div>
                    <h3 class="plan-name">Professional</h3>
                    <div class="plan-price">$12<span>/user/month</span></div>
                    <p class="feature-desc" style="margin-bottom: 24px;">For teams that need more power and automation.</p>
                    <div class="plan-features">
                        <div class="plan-feature"><i class="ph ph-check-circle"></i> Everything in Starter</div>
                        <div class="plan-feature"><i class="ph ph-check-circle"></i> Unlimited users</div>
                        <div class="plan-feature"><i class="ph ph-check-circle"></i> Kanban & Calendar views</div>
                        <div class="plan-feature"><i class="ph ph-check-circle"></i> Custom workflows</div>
                        <div class="plan-feature"><i class="ph ph-check-circle"></i> Priority support</div>
                    </div>
                    <button class="btn btn-primary">Start 14-Day Trial</button>
                </div>
                
                <!-- Enterprise Plan -->
                <div class="pricing-card">
                    <h3 class="plan-name">Enterprise</h3>
                    <div class="plan-price">$24<span>/user/month</span></div>
                    <p class="feature-desc" style="margin-bottom: 24px;">Advanced security and admin controls for orgs.</p>
                    <div class="plan-features">
                        <div class="plan-feature"><i class="ph ph-check-circle"></i> Everything in Pro</div>
                        <div class="plan-feature"><i class="ph ph-check-circle"></i> SSO & SAML</div>
                        <div class="plan-feature"><i class="ph ph-check-circle"></i> Advanced reporting</div>
                        <div class="plan-feature"><i class="ph ph-check-circle"></i> Dedicated account manager</div>
                    </div>
                    <button class="btn btn-secondary">Contact Sales</button>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer>
        <div class="container">
            <div class="footer-grid">
                <div class="footer-brand">
                    <a href="/" class="logo" style="font-size: 18px;">
                        <div class="logo-icon" style="width: 24px; height: 24px; border-radius: 6px;">
                            <i class="ph ph-check-square-offset"></i>
                        </div>
                        TaskFlow
                    </a>
                    <p>Designed to help teams move faster and stay organized, without the overhead of complex systems.</p>
                </div>
                
                <div>
                    <h4 class="footer-title">Product</h4>
                    <ul class="footer-links">
                        <li><a href="#">Features</a></li>
                        <li><a href="#">Integrations</a></li>
                        <li><a href="#">Pricing</a></li>
                        <li><a href="#">Changelog</a></li>
                        <li><a href="#">Docs</a></li>
                    </ul>
                </div>
                
                <div>
                    <h4 class="footer-title">Company</h4>
                    <ul class="footer-links">
                        <li><a href="#">About Us</a></li>
                        <li><a href="#">Careers</a></li>
                        <li><a href="#">Blog</a></li>
                        <li><a href="#">Contact</a></li>
                        <li><a href="#">Partners</a></li>
                    </ul>
                </div>
            </div>
            
            <div class="footer-bottom">
                <div>&copy; 2026 TaskFlow Inc. All rights reserved.</div>
                <div class="social-links">
                    <a href="#"><i class="ph ph-twitter-logo"></i></a>
                    <a href="#"><i class="ph ph-github-logo"></i></a>
                    <a href="#"><i class="ph ph-linkedin-logo"></i></a>
                </div>
            </div>
        </div>
    </footer>

    <script>
        // Sticky Header scroll effect
        window.addEventListener('scroll', () => {
            const header = document.getElementById('header');
            if (window.scrollY > 10) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });

        // View toggle effect in preview section
        const toggles = document.querySelectorAll('.view-toggle');
        toggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                toggles.forEach(t => t.classList.remove('active'));
                toggle.classList.add('active');
            });
        });
    </script>
</body>
</html>
