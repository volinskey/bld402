# Shared Todo List Template

Collaborative task list with checkboxes, assignments, and filters.

## Customization Points

- `{{APP_NAME}}` — App title
- `{{API_URL}}` — run402 API URL (https://run402.com)
- `{{ANON_KEY}}` — Project anon_key from project creation

## Features

- Add, complete, and delete tasks
- Filter by All / Active / Done
- Assigned-to labels (optional)
- Mobile-responsive
- No authentication required (public_read_write)

## Optional Auth Upgrade

To add user accounts, change RLS to `user_owns_rows` and add the auth-flow pattern. Then each user sees only their own tasks.

## Schema

See `schema.sql` for table definitions.

## RLS

See `rls.json` for default access rules.
