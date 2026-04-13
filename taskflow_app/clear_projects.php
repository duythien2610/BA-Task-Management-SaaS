<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');
App\Models\Project::truncate();
App\Models\ProjectExport::truncate();
App\Models\Task::truncate();
App\Models\TaskComment::truncate();
App\Models\TimeLog::truncate();
App\Models\ActiveTimer::truncate();
Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');

echo "Projects deleted.\n";
