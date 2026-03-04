# Hangman Template

Classic word guessing game with SVG hangman drawing. Solo play or pass-and-play with friends. Built-in word list with categories.

## Files

- `index.html` — Frontend (single-page HTML with embedded CSS/JS)
- `schema.sql` — Database table definitions and seed data
- `rls.json` — Row-level security policy configuration

## Customization Points

- `{{APP_NAME}}` — App title (appears in header)
- `{{API_URL}}` — run402 API URL (https://run402.com)
- `{{ANON_KEY}}` — Project anon_key from project creation

## Features

- SVG hangman drawing with progressive reveal
- On-screen letter keyboard input
- Word categories (animals, food, nature, objects, general)
- Difficulty levels (easy, medium)
- Win/lose state detection
- Pass-and-play multiplayer mode
- Mobile-responsive layout

## Schema

Two tables:

- **games** — `id`, `word`, `guesses` (text array), `max_wrong`, `status`, `created_at`
- **word_lists** — `id`, `word`, `category`, `difficulty` (seeded with 25 default words)

See `schema.sql` for full table definitions and seed data.

## RLS

- `public_read_write` on `games` — anyone can create and play games
- `public_read` on `word_lists` — anyone can read words, only service role can add new ones

See `rls.json` for policy configuration.
