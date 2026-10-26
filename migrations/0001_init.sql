-- Cloudflare D1 Schema for DailyBible
-- Execute with: wrangler d1 execute dailybible-db --local --file=./migrations/0001_init.sql

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user', -- 'user' | 'admin'
  settings_json TEXT DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reading_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  plan_id TEXT NOT NULL DEFAULT 'desheng',
  start_date TEXT NOT NULL, -- 'YYYY-MM-DD' or 'calendar' for Jan 1 fixed
  invite_code TEXT NOT NULL UNIQUE,
  is_public INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS progress (
  user_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  day_index INTEGER NOT NULL, -- 1..365
  part TEXT NOT NULL, -- 'ps' | 'nt' | 'ot'
  done_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, group_id, day_index, part)
);

CREATE TABLE IF NOT EXISTS highlights (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  color TEXT NOT NULL, -- 'yellow' | 'green' | 'blue' | 'pink' | 'purple'
  updated_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, book, chapter, verse)
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_start INTEGER NOT NULL,
  verse_end INTEGER NOT NULL,
  content TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sermons (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  speaker TEXT NOT NULL DEFAULT '',
  church TEXT NOT NULL DEFAULT '南橙縣以薩迦靈糧堂',
  date TEXT NOT NULL, -- 'YYYY-MM-DD'
  series TEXT NOT NULL DEFAULT '',
  scripture_ref TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  blocks_json TEXT NOT NULL, -- JSON array of structured blocks extracted from PPTX
  slides_json TEXT NOT NULL DEFAULT '[]', -- Raw slide cards for slide-by-slide toggle
  status TEXT NOT NULL DEFAULT 'published',
  created_by TEXT NOT NULL DEFAULT 'admin',
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS personal_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  start_date TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Seed default public reading group (Calendar based: Jan 1 = Day 1)
INSERT OR IGNORE INTO reading_groups (
  id, name, description, plan_id, start_date, invite_code, is_public, created_by, created_at
) VALUES (
  'public-desheng',
  '得胜读经计划 · 全教会公开共读',
  '每天一篇诗篇或箴言、一章新约、两章旧约，一年读完一遍新旧约全书。按日历1月1日为第1天，随时可加入共读！',
  'desheng',
  'calendar',
  'DESHENG',
  1,
  'system',
  1730000000000
);

-- Seed a second sample group with custom start date
INSERT OR IGNORE INTO reading_groups (
  id, name, description, plan_id, start_date, invite_code, is_public, created_by, created_at
) VALUES (
  'group-2025-spring',
  '以萨迦灵粮堂 · 主日得胜共读组',
  '教会小组按自定义起始日期推进得胜读经计划，彼此守望代祷。',
  'desheng',
  '2025-01-01',
  'ISSACHAR',
  0,
  'system',
  1730000000000
);
