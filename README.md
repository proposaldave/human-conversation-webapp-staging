# Human Conversation Web App Staging

Public investor-demo surfaces for Human Conversation.

- The operating-system, coach, and operator demos use generated identities and data.
- The homepage opens the audio feed.
- `/feed/` uses five permissioned excerpts from two real coaching sessions.
- Clip removal is stored only in the current browser for this static demo.
- No participant identity, roster, transcript, contact information, full recording, or live club integration is published.

The sanitized publication ledger is `feed/published-moments.json`. Run
`node scripts/validate-feed.mjs` before publishing to verify every listed
moment has a real audio asset, a feed card, and an offline-cache entry.

Company context: [humanconversation.com](https://humanconversation.com/)
