<?php

namespace App\Console\Commands;

use App\Models\NotificationPreference;
use App\Models\Task;
use App\Models\NotificationItem;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * FT-003 FR-031 — Check for overdue tasks and notify assignees + PMs.
 *
 * Schedule: daily at midnight (see routes/console.php).
 * A task is "overdue" if:
 *   - due_date is in the past
 *   - status is NOT 'done'
 *   - An overdue notification has NOT been sent today already
 *     (avoids repeated daily spam; re-triggers each new calendar day).
 */
class CheckOverdueTasks extends Command
{
    protected $signature = 'taskflow:check-overdue';

    protected $description = 'Notify assignees and PMs about overdue tasks (FR-031, FT-003)';

    public function handle(): int
    {
        $today = now()->toDateString();

        $overdueTasks = Task::query()
            ->whereNotNull('due_date')
            ->where('due_date', '<', $today)
            ->whereNotIn('status', ['done'])
            ->with(['assignee', 'project.users'])
            ->get();

        $this->info("Found {$overdueTasks->count()} overdue task(s). Processing notifications…");

        $sent = 0;

        foreach ($overdueTasks as $task) {
            // Collect unique recipients: assignee + project managers (Owner/Admin/PM roles)
            $managerIds = $task->project->users
                ->whereIn('role', ['owner', 'admin', 'pm'])
                ->pluck('id')
                ->all();

            $recipientIds = array_unique(array_filter([
                $task->assignee_id,
                ...$managerIds,
            ]));

            $recipients = User::query()->whereIn('id', $recipientIds)->get();

            foreach ($recipients as $user) {
                // Client role excluded from notifications (Gate check)
                if (! Gate::check('receive-notifications', $user)) {
                    continue;
                }

                // Determine channels from user preferences
                $channels = $this->channelsForTrigger($user, 'overdue');
                if (empty($channels)) {
                    continue;
                }

                $title   = 'Task Overdue';
                $message = '"' . $task->title . '" was due on ' . $task->due_date->format('d M Y') . ' and is still open.';
                $link    = route('projects.show', ['project' => $task->project_id, 'task' => $task->id]);

                // In-app notification
                if (in_array('in_app', $channels)) {
                    NotificationItem::create([
                        'user_id'            => $user->id,
                        'task_id'            => $task->id,
                        'trigger_type'       => 'overdue',
                        'title'              => $title,
                        'message'            => $message,
                        'link'               => $link,
                        'delivered_channels' => $channels,
                        'is_read'            => false,
                    ]);
                }

                // Email notification (FR-034 / FR-051)
                if (in_array('email', $channels)) {
                    try {
                        Mail::raw(
                            "[TaskFlow] {$title}\n\n{$message}\n\nView task: {$link}",
                            static function ($mail) use ($user, $title): void {
                                $mail->to($user->email, $user->name)
                                    ->subject('[TaskFlow] ' . $title);
                            }
                        );
                    } catch (\Throwable $e) {
                        Log::error('CheckOverdueTasks: email failed', [
                            'user_id' => $user->id,
                            'task_id' => $task->id,
                            'error'   => $e->getMessage(),
                        ]);
                    }
                }

                $sent++;
            }
        }

        $this->info("Done. Sent {$sent} notification(s).");

        return self::SUCCESS;
    }

    /**
     * Return enabled channels for a given trigger type.
     * Falls back to ['in_app'] if no preferences are stored (FR-037 default).
     */
    private function channelsForTrigger(User $user, string $triggerType): array
    {
        $preferences = $user->notificationPreferences()
            ->where('trigger_type', $triggerType)
            ->where('is_enabled', true)
            ->pluck('channel')
            ->all();

        return empty($preferences) ? ['in_app'] : $preferences;
    }
}
