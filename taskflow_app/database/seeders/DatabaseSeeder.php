<?php

namespace Database\Seeders;

use App\Models\ActiveTimer;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\NotificationItem;
use App\Models\NotificationPreference;
use App\Models\Project;
use App\Models\ProjectExport;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\TimeLog;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $password = Hash::make('password123');

        $owner = User::create([
            'name' => 'Minh Khoa',
            'title' => 'Owner / CEO',
            'email' => 'owner@taskflow.vn',
            'role' => 'owner',
            'avatar_color' => '#0f4c81',
            'password' => $password,
        ]);

        $admin = User::create([
            'name' => 'Thu Hang',
            'title' => 'Admin / Head of Sales',
            'email' => 'admin@taskflow.vn',
            'role' => 'admin',
            'avatar_color' => '#9a3412',
            'password' => $password,
        ]);

        $pm = User::create([
            'name' => 'Linh Phuong',
            'title' => 'Project Manager',
            'email' => 'pm@taskflow.vn',
            'role' => 'pm',
            'avatar_color' => '#1f6f50',
            'password' => $password,
        ]);

        $memberA = User::create([
            'name' => 'Bao Trung',
            'title' => 'Senior Engineer',
            'email' => 'member1@taskflow.vn',
            'role' => 'member',
            'avatar_color' => '#5b21b6',
            'password' => $password,
        ]);

        $memberB = User::create([
            'name' => 'Ngoc Mai',
            'title' => 'Account Executive',
            'email' => 'member2@taskflow.vn',
            'role' => 'member',
            'avatar_color' => '#b91c1c',
            'password' => $password,
        ]);

        $clientCompany = Client::create([
            'name' => 'Antigravity Studio',
            'industry' => 'Creative Agency',
            'company_size' => '25-50',
            'contact_name' => 'An Binh',
            'contact_email' => 'client@antigravity.vn',
            'contact_phone' => '0909 123 456',
            'billing_address' => '12 Nguyen Hue, District 1, Ho Chi Minh City',
            'notes' => 'Weekly client report required every Friday. Billing cycle is monthly.',
            'owner_user_id' => $pm->id,
            'created_by' => $owner->id,
        ]);

        $clientUser = User::create([
            'name' => 'An Binh',
            'title' => 'Client Director',
            'email' => 'client@taskflow.vn',
            'role' => 'client',
            'client_id' => $clientCompany->id,
            'avatar_color' => '#374151',
            'password' => $password,
        ]);

        $secondClient = Client::create([
            'name' => 'BluePeak Commerce',
            'industry' => 'Retail SME',
            'company_size' => '10-25',
            'contact_name' => 'Hoang Nam',
            'contact_email' => 'contact@bluepeak.vn',
            'contact_phone' => '0918 789 123',
            'notes' => 'Needs export progress report for monthly board review.',
            'owner_user_id' => $admin->id,
            'created_by' => $owner->id,
        ]);

        $projectA = Project::create([
            'client_id' => $clientCompany->id,
            'name' => 'TaskFlow Q2 Growth Revamp',
            'slug' => 'taskflow-q2-growth-revamp',
            'status' => 'active',
            'description' => 'Agency delivery program focused on billing, reporting, notifications, and permission refactor.',
            'progress' => 68,
            'hourly_rate_vnd' => 500000,
            'start_date' => Carbon::now()->subWeeks(6)->toDateString(),
            'end_date' => Carbon::now()->addWeeks(5)->toDateString(),
        ]);

        $projectB = Project::create([
            'client_id' => $secondClient->id,
            'name' => 'BluePeak Website Sprint',
            'slug' => 'bluepeak-website-sprint',
            'status' => 'active',
            'description' => 'Ongoing SME web optimization sprint and client reporting package.',
            'progress' => 44,
            'hourly_rate_vnd' => 420000,
            'start_date' => Carbon::now()->subWeeks(3)->toDateString(),
            'end_date' => Carbon::now()->addWeeks(7)->toDateString(),
        ]);

        $projectA->users()->attach([
            $owner->id => ['project_role' => 'owner'],
            $admin->id => ['project_role' => 'admin'],
            $pm->id => ['project_role' => 'manager'],
            $memberA->id => ['project_role' => 'member'],
            $memberB->id => ['project_role' => 'member'],
            $clientUser->id => ['project_role' => 'client'],
        ]);

        $projectB->users()->attach([
            $owner->id => ['project_role' => 'owner'],
            $admin->id => ['project_role' => 'admin'],
            $pm->id => ['project_role' => 'manager'],
            $memberB->id => ['project_role' => 'member'],
        ]);

        $taskPayloads = [
            ['title' => 'Permission module regression audit', 'status' => 'done', 'priority' => 'high', 'assignee' => $memberA->id, 'offset' => -9],
            ['title' => 'Implement task timer start/stop flow', 'status' => 'in_progress', 'priority' => 'high', 'assignee' => $memberA->id, 'offset' => 2],
            ['title' => 'Manual time entry validation states', 'status' => 'todo', 'priority' => 'medium', 'assignee' => $memberB->id, 'offset' => 4],
            ['title' => 'Client billing summary weekly rollup', 'status' => 'in_progress', 'priority' => 'high', 'assignee' => $pm->id, 'offset' => 3],
            ['title' => 'Export modal UI and report filters', 'status' => 'blocked', 'priority' => 'high', 'assignee' => $memberB->id, 'offset' => -2],
            ['title' => 'Project progress PDF printable layout', 'status' => 'todo', 'priority' => 'medium', 'assignee' => $memberA->id, 'offset' => 7],
            ['title' => 'Bulk action floating toolbar', 'status' => 'in_progress', 'priority' => 'high', 'assignee' => $memberA->id, 'offset' => 1],
            ['title' => 'Bulk delete confirmation guardrails', 'status' => 'todo', 'priority' => 'medium', 'assignee' => $memberB->id, 'offset' => 5],
            ['title' => 'Notification bell unread badge', 'status' => 'done', 'priority' => 'medium', 'assignee' => $memberB->id, 'offset' => -5],
            ['title' => 'Notification preference settings matrix', 'status' => 'in_progress', 'priority' => 'medium', 'assignee' => $memberA->id, 'offset' => 2],
            ['title' => 'Client portal shared reports listing', 'status' => 'todo', 'priority' => 'low', 'assignee' => $pm->id, 'offset' => 8],
            ['title' => 'UAT handoff checklist for Q2 release', 'status' => 'todo', 'priority' => 'low', 'assignee' => $pm->id, 'offset' => 10],
        ];

        $tasks = collect($taskPayloads)->map(function (array $payload, int $index) use ($projectA, $pm, $owner) {
            return Task::create([
                'project_id' => $projectA->id,
                'title' => $payload['title'],
                'description' => 'Detailed implementation note for '.$payload['title'].'. This task belongs to the TaskFlow agency delivery stream and is tracked against the BA-approved Q2 scope.',
                'status' => $payload['status'],
                'priority' => $payload['priority'],
                'assignee_id' => $payload['assignee'],
                'created_by' => $index % 2 === 0 ? $pm->id : $owner->id,
                'due_date' => Carbon::now()->addDays($payload['offset'])->toDateString(),
            ]);
        });

        foreach ($tasks->take(4) as $task) {
            TaskComment::create([
                'task_id' => $task->id,
                'user_id' => $pm->id,
                'body' => 'Please keep the implementation aligned with the BRD and SRS acceptance criteria for this feature.',
            ]);

            TaskComment::create([
                'task_id' => $task->id,
                'user_id' => $task->assignee_id,
                'body' => 'Implementation note updated. I will push the next refinement after internal review.',
            ]);
        }

        $logEntries = [
            [$tasks[0], $memberA, 180, 5],
            [$tasks[1], $memberA, 135, 2],
            [$tasks[3], $pm, 95, 1],
            [$tasks[4], $memberB, 80, 3],
            [$tasks[6], $memberA, 110, 1],
            [$tasks[8], $memberB, 65, 4],
            [$tasks[9], $memberA, 120, 1],
        ];

        foreach ($logEntries as [$task, $user, $duration, $daysAgo]) {
            TimeLog::create([
                'task_id' => $task->id,
                'user_id' => $user->id,
                'date' => Carbon::now()->subDays($daysAgo)->toDateString(),
                'duration_minutes' => $duration,
                'started_at' => Carbon::now()->subDays($daysAgo)->setTime(9, 0),
                'ended_at' => Carbon::now()->subDays($daysAgo)->setTime(9, 0)->addMinutes($duration),
                'note' => 'Focused implementation and QA pass.',
                'updated_by' => $user->id,
            ]);
        }

        ActiveTimer::create([
            'user_id' => $memberA->id,
            'task_id' => $tasks[1]->id,
            'started_at' => Carbon::now()->subMinutes(42),
        ]);

        foreach ([$owner, $admin, $pm, $memberA, $memberB] as $user) {
            foreach (['assigned', 'overdue', 'comment', 'status_change'] as $trigger) {
                NotificationPreference::create([
                    'user_id' => $user->id,
                    'trigger_type' => $trigger,
                    'channel' => 'in_app',
                    'is_enabled' => true,
                ]);

                NotificationPreference::create([
                    'user_id' => $user->id,
                    'trigger_type' => $trigger,
                    'channel' => 'email',
                    'is_enabled' => in_array($user->role, ['owner', 'admin'], true),
                ]);
            }
        }

        NotificationPreference::create([
            'user_id' => $clientUser->id,
            'trigger_type' => 'shared_report',
            'channel' => 'in_app',
            'is_enabled' => true,
        ]);

        NotificationItem::insert([
            [
                'user_id' => $memberA->id,
                'task_id' => $tasks[1]->id,
                'trigger_type' => 'assigned',
                'title' => 'New assignment',
                'message' => 'You were assigned to "Implement task timer start/stop flow" by Linh Phuong.',
                'link' => '/projects/'.$projectA->id.'?task='.$tasks[1]->id,
                'delivered_channels' => json_encode(['in_app']),
                'is_read' => false,
                'created_at' => Carbon::now()->subMinutes(18),
                'updated_at' => Carbon::now()->subMinutes(18),
            ],
            [
                'user_id' => $pm->id,
                'task_id' => $tasks[4]->id,
                'trigger_type' => 'overdue',
                'title' => 'Task overdue',
                'message' => 'Export modal UI and report filters is overdue and still blocked.',
                'link' => '/projects/'.$projectA->id.'?task='.$tasks[4]->id,
                'delivered_channels' => json_encode(['in_app', 'email']),
                'is_read' => false,
                'created_at' => Carbon::now()->subHours(2),
                'updated_at' => Carbon::now()->subHours(2),
            ],
            [
                'user_id' => $memberB->id,
                'task_id' => $tasks[4]->id,
                'trigger_type' => 'comment',
                'title' => 'New comment',
                'message' => 'Linh Phuong commented on "Export modal UI and report filters".',
                'link' => '/projects/'.$projectA->id.'?task='.$tasks[4]->id,
                'delivered_channels' => json_encode(['in_app']),
                'is_read' => true,
                'created_at' => Carbon::now()->subHours(5),
                'updated_at' => Carbon::now()->subHours(5),
            ],
            [
                'user_id' => $clientUser->id,
                'task_id' => null,
                'trigger_type' => 'shared_report',
                'title' => 'Shared project report',
                'message' => 'Weekly Project Progress Summary for TaskFlow Q2 Growth Revamp is ready to review.',
                'link' => '/exports',
                'delivered_channels' => json_encode(['in_app']),
                'is_read' => false,
                'created_at' => Carbon::now()->subDay(),
                'updated_at' => Carbon::now()->subDay(),
            ],
        ]);

        $export = ProjectExport::create([
            'project_id' => $projectA->id,
            'requested_by' => $pm->id,
            'report_type' => 'progress_summary',
            'format' => 'pdf',
            'start_date' => Carbon::now()->startOfMonth()->toDateString(),
            'end_date' => Carbon::now()->toDateString(),
            'shared_with_client' => true,
            'download_token' => Str::uuid()->toString(),
            'preview_payload' => [
                'completion' => 68,
                'status_flag' => 'AT RISK',
                'total_tasks' => $tasks->count(),
                'completed_tasks' => $tasks->where('status', 'done')->count(),
                'open_blockers' => $tasks->where('status', 'blocked')->pluck('title')->values()->all(),
            ],
        ]);

        $activityEntries = [
            ['task' => $tasks[1], 'user' => $pm, 'type' => 'status_change', 'description' => 'Status changed from To Do to In Progress.'],
            ['task' => $tasks[6], 'user' => $pm, 'type' => 'bulk_action', 'description' => 'Bulk status update applied to sprint tasks.', 'prev' => 'todo', 'new' => 'in_progress'],
            ['task' => $tasks[4], 'user' => $memberB, 'type' => 'comment', 'description' => 'Comment added to blocked export task.'],
            ['task' => $tasks[3], 'user' => $owner, 'type' => 'billing_rate', 'description' => 'Project hourly rate updated to 500,000 VND.', 'prev' => '450000', 'new' => '500000'],
        ];

        foreach ($activityEntries as $entry) {
            ActivityLog::create([
                'project_id' => $projectA->id,
                'task_id' => $entry['task']->id,
                'user_id' => $entry['user']->id,
                'action_type' => $entry['type'],
                'description' => $entry['description'],
                'previous_value' => $entry['prev'] ?? null,
                'new_value' => $entry['new'] ?? null,
                'created_at' => Carbon::now()->subHours(rand(1, 48)),
                'updated_at' => Carbon::now()->subHours(rand(1, 48)),
            ]);
        }

        ActivityLog::create([
            'project_id' => $projectA->id,
            'task_id' => null,
            'user_id' => $pm->id,
            'action_type' => 'export',
            'description' => 'Client-facing Project Progress Summary was generated and shared.',
            'new_value' => $export->id,
            'created_at' => Carbon::now()->subDay(),
            'updated_at' => Carbon::now()->subDay(),
        ]);
    }
}
