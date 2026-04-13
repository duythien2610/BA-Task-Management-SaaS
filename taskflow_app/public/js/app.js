document.addEventListener('DOMContentLoaded', () => {
    const toolbar = document.querySelector('[data-bulk-toolbar]');
    const selectAll = document.querySelector('[data-select-all]');
    const checkboxes = Array.from(document.querySelectorAll('[data-task-checkbox]'));

    if (selectAll && checkboxes.length) {
        const syncToolbar = () => {
            const selected = checkboxes.filter((checkbox) => checkbox.checked);
            const countTarget = document.querySelector('[data-selected-count]');

            if (countTarget) {
                countTarget.textContent = String(selected.length);
            }

            if (toolbar) {
                toolbar.hidden = selected.length === 0;
            }

            if (selectAll) {
                selectAll.checked = selected.length === checkboxes.length;
            }
        };

        selectAll.addEventListener('change', () => {
            checkboxes.forEach((checkbox) => {
                checkbox.checked = selectAll.checked;
            });
            syncToolbar();
        });

        checkboxes.forEach((checkbox) => {
            checkbox.addEventListener('change', syncToolbar);
        });

        document.querySelectorAll('[data-bulk-trigger]').forEach((button) => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-bulk-trigger');
                const form = document.getElementById('bulk-action-form');
                if (!form) return;

                document.getElementById('bulk-action-input').value = action;
                document.getElementById('bulk-confirmed-input').value = '0';
                document.getElementById('bulk-delete-confirm-input').value = '';
                document.getElementById('bulk-status-input').value = '';
                document.getElementById('bulk-assignee-input').value = '';
                document.getElementById('bulk-due-date-input').value = '';

                const selectedCount = checkboxes.filter((checkbox) => checkbox.checked).length;
                if (!selectedCount) return;

                if (selectedCount > 10) {
                    const confirmMany = window.confirm(`This action will affect ${selectedCount} tasks. Are you sure?`);
                    if (!confirmMany) return;
                    document.getElementById('bulk-confirmed-input').value = '1';
                }

                if (action === 'status') {
                    const value = window.prompt('Enter new status: todo / in_progress / blocked / done');
                    if (!value) return;
                    document.getElementById('bulk-status-input').value = value;
                }

                if (action === 'reassign') {
                    const value = window.prompt('Enter assignee user id');
                    if (!value) return;
                    document.getElementById('bulk-assignee-input').value = value;
                }

                if (action === 'due_date') {
                    const value = window.prompt('Enter due date in YYYY-MM-DD format');
                    if (!value) return;
                    document.getElementById('bulk-due-date-input').value = value;
                }

                if (action === 'delete') {
                    const confirmDelete = window.prompt('Type DELETE to confirm bulk delete');
                    if (!confirmDelete) return;
                    document.getElementById('bulk-delete-confirm-input').value = confirmDelete;
                }

                form.submit();
            });
        });

        syncToolbar();
    }
});
