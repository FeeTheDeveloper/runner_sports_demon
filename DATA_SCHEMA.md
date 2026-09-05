# Data Schema

SQLite remains the local event/research store. Totals history is separated into flow snapshots, projections, market snapshots, trend scores, signals, decision windows, window transitions, and set points. Every analytical record carries source and/or processed timestamps in its payload and indexed envelope.

`src/storage/schema.sql` is authoritative. JSON payloads preserve exposed model components while relational columns support event, market, status, and timestamp queries.
