-- Web Content Extractor - D1 Database Schema
-- This is optional - only needed if you want to store extraction history

-- Create the extracted_content table
CREATE TABLE IF NOT EXISTS extracted_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  author TEXT,
  date TEXT,
  markdown TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_created_at ON extracted_content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_url ON extracted_content(url);

-- Create a table for extraction statistics (optional)
CREATE TABLE IF NOT EXISTS extraction_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  extraction_time_ms INTEGER,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stats_created_at ON extraction_stats(created_at DESC);

-- Sample query to get recent extractions
-- SELECT url, title, author, date, created_at
-- FROM extracted_content
-- ORDER BY created_at DESC
-- LIMIT 10;

-- Sample query to get extraction statistics
-- SELECT
--   COUNT(*) as total_extractions,
--   SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
--   SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed,
--   AVG(extraction_time_ms) as avg_time_ms
-- FROM extraction_stats
-- WHERE created_at >= datetime('now', '-7 days');
