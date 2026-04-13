<?php

use App\Console\Commands\CheckOverdueTasks;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// FT-003 FR-031: Check for overdue tasks and send notifications daily at midnight.
// Run: php artisan schedule:run (or set up a cron: * * * * * php artisan schedule:run)
Schedule::command(CheckOverdueTasks::class)->dailyAt('00:00')->withoutOverlapping();
