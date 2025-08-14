# Intelligence Engine

This is the intelligence engine for the A-MEM system. It runs scheduled tasks to reflect on memories and generate insights.

## Features

- Nightly reflection on recent activities
- Pattern recognition in transaction history
- Strategy generation based on past performance

## Running the Engine

```bash
npm start
```

## Scheduling

The engine uses `node-cron` to schedule tasks. By default, the nightly reflection runs at 2 AM every day. For testing purposes, it runs immediately when started.