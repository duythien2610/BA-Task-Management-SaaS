## TaskFlow Audit

### Current scope
- Internal delivery workspace with roles: owner, admin, pm, member, client.
- Features already present: auth, dashboard, project board, task updates, comments, time logs, active timer, notifications, exports, user admin, client admin.

### Critical logic gaps found
- No real project creation flow in runtime app.
- No runtime flow to attach members to a project or manage project roles.
- No runtime flow to create tasks inside a project.
- Task edit UI exposes title, description, priority but backend did not save them.
- Assignee validation was not restricted to project members.
- Project progress was stored as a static field and not recalculated from task status changes.

### Implementation priority
1. Add create project flow.
2. Add project member management flow.
3. Add task creation flow.
4. Fix task update validation and persistence.
5. Recalculate project progress automatically after task mutations.

### Remaining backlog after current pass
- Edit/delete project.
- Remove or change project member roles with stronger guardrails.
- Dedicated task list view and richer filters.
- Better notification defaults and overdue automation.
- Replace temp password invite flow with proper onboarding/reset flow.
