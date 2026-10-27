import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { Env, JwtUserPayload } from './env';
import { generateSalt, hashPassword, signJwt, verifyJwt } from './lib/crypto';
import { DEFAULT_SERMONS } from '../src/data/defaultSermons';

type Variables = {
  user: JwtUserPayload | null;
};

export const app = new Hono<{ Bindings: Env; Variables: Variables }>().basePath('/api');

const DEFAULT_ADMIN_EMAIL = 'affbizm@gmail.com';

let schemaInitialized = false;

async function ensureDatabaseSchema(db?: any) {
  if (schemaInitialized || !db) return;
  try {
    await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        nickname TEXT NOT NULL,
        avatar_url TEXT DEFAULT '',
        role TEXT NOT NULL DEFAULT 'user',
        settings_json TEXT DEFAULT '{}',
        created_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS reading_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        plan_id TEXT NOT NULL DEFAULT 'desheng',
        start_date TEXT NOT NULL,
        invite_code TEXT NOT NULL UNIQUE,
        is_public INTEGER NOT NULL DEFAULT 0,
        created_by TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS group_members (
        group_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        joined_at INTEGER NOT NULL,
        PRIMARY KEY (group_id, user_id)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS progress (
        user_id TEXT NOT NULL,
        group_id TEXT NOT NULL,
        day_index INTEGER NOT NULL,
        part TEXT NOT NULL,
        done_at INTEGER NOT NULL,
        PRIMARY KEY (user_id, group_id, day_index, part)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS highlights (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        color TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted INTEGER NOT NULL DEFAULT 0,
        UNIQUE(user_id, book, chapter, verse)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse_start INTEGER NOT NULL,
        verse_end INTEGER NOT NULL,
        content TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS sermons (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        speaker TEXT NOT NULL DEFAULT '',
        church TEXT NOT NULL DEFAULT '南橙縣以薩迦靈糧堂',
        date TEXT NOT NULL,
        series TEXT NOT NULL DEFAULT '',
        scripture_ref TEXT NOT NULL DEFAULT '',
        summary TEXT NOT NULL DEFAULT '',
        blocks_json TEXT NOT NULL,
        slides_json TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'published',
        created_by TEXT NOT NULL DEFAULT 'admin',
        updated_at INTEGER NOT NULL
      )`),
      db.prepare(`INSERT OR IGNORE INTO reading_groups (
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
      )`),
      db.prepare(`INSERT OR IGNORE INTO reading_groups (
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
      )`),
    ]);
    schemaInitialized = true;
  } catch {
    // ignore if DB binding not attached yet
  }
}

// Middleware: Auto-init D1 schema + Parse JWT from cookie or Authorization header
app.use('*', async (c, next) => {
  await ensureDatabaseSchema(c.env?.DB);
  const secret = c.env.JWT_SECRET || 'dailybible-default-jwt-secret-change-in-production';
  const cookieToken = getCookie(c, 'db_token');
  const authHeader = c.req.header('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const token = cookieToken || bearerToken;

  if (token) {
    const payload = await verifyJwt(token, secret);
    c.set('user', payload);
  } else {
    c.set('user', null);
  }
  await next();
});

// Health check
app.get('/health', (c) => c.json({ ok: true, timestamp: Date.now() }));

// Auth: Register
app.post('/auth/register', async (c) => {
  const { email, password, nickname } = await c.req.json<{
    email: string;
    password: string;
    nickname?: string;
  }>();

  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !password || password.length < 6) {
    return c.json({ error: '请输入有效邮箱且密码不少于 6 位' }, 400);
  }

  const adminEmail = (c.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase();
  const role: 'user' | 'admin' = cleanEmail === adminEmail ? 'admin' : 'user';
  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  const id = crypto.randomUUID();
  const displayNick = (nickname || cleanEmail.split('@')[0]).trim();
  const now = Date.now();

  try {
    await c.env.DB.prepare(
      `INSERT INTO users (id, email, password_hash, salt, nickname, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(id, cleanEmail, passwordHash, salt, displayNick, role, now)
      .run();

    // Auto-join public group
    await c.env.DB.prepare(
      `INSERT OR IGNORE INTO group_members (group_id, user_id, joined_at)
       VALUES ('public-desheng', ?, ?)`
    )
      .bind(id, now)
      .run();
  } catch (err: any) {
    if (String(err?.message || '').includes('UNIQUE')) {
      return c.json({ error: '该邮箱已注册，请直接登录' }, 409);
    }
    return c.json({ error: '注册失败: ' + String(err?.message || err) }, 500);
  }

  const secret = c.env.JWT_SECRET || 'dailybible-default-jwt-secret-change-in-production';
  const payload: JwtUserPayload = {
    sub: id,
    email: cleanEmail,
    role,
    nickname: displayNick,
    exp: Date.now() + 30 * 24 * 3600 * 1000,
  };
  const token = await signJwt(payload, secret);

  setCookie(c, 'db_token', token, {
    httpOnly: true,
    path: '/',
    sameSite: 'Lax',
    maxAge: 30 * 24 * 3600,
  });

  return c.json({
    token,
    user: { id, email: cleanEmail, nickname: displayNick, avatar_url: '', role },
  });
});

// Auth: Login
app.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();
  const cleanEmail = (email || '').trim().toLowerCase();
  const adminEmail = (c.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase();

  let row = await c.env.DB.prepare(`SELECT * FROM users WHERE email = ?`)
    .bind(cleanEmail)
    .first<any>();

  // Auto-create default admin account on first login if not yet in D1
  if (!row && cleanEmail === adminEmail && password && password.length >= 6) {
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    const id = 'admin-affbizm';
    const now = Date.now();
    await c.env.DB.prepare(
      `INSERT OR IGNORE INTO users (id, email, password_hash, salt, nickname, role, created_at)
       VALUES (?, ?, ?, ?, '教会管理员', 'admin', ?)`
    )
      .bind(id, cleanEmail, passwordHash, salt, now)
      .run();
    await c.env.DB.prepare(
      `INSERT OR IGNORE INTO group_members (group_id, user_id, joined_at)
       VALUES ('public-desheng', ?, ?)`
    )
      .bind(id, now)
      .run();
    row = await c.env.DB.prepare(`SELECT * FROM users WHERE email = ?`)
      .bind(cleanEmail)
      .first<any>();
  }

  if (!row) {
    return c.json({ error: '账号不存在或密码错误' }, 401);
  }

  const hash = await hashPassword(password || '', row.salt);
  if (hash !== row.password_hash) {
    return c.json({ error: '账号不存在或密码错误' }, 401);
  }

  // Ensure configured admin email always gets admin role
  let role: 'user' | 'admin' = row.role;
  if (cleanEmail === adminEmail && role !== 'admin') {
    role = 'admin';
    await c.env.DB.prepare(`UPDATE users SET role = 'admin' WHERE id = ?`)
      .bind(row.id)
      .run();
  }

  const secret = c.env.JWT_SECRET || 'dailybible-default-jwt-secret-change-in-production';
  const payload: JwtUserPayload = {
    sub: row.id,
    email: row.email,
    role,
    nickname: row.nickname,
    exp: Date.now() + 30 * 24 * 3600 * 1000,
  };
  const token = await signJwt(payload, secret);

  setCookie(c, 'db_token', token, {
    httpOnly: true,
    path: '/',
    sameSite: 'Lax',
    maxAge: 30 * 24 * 3600,
  });

  return c.json({
    token,
    user: {
      id: row.id,
      email: row.email,
      nickname: row.nickname,
      avatar_url: row.avatar_url || '',
      role,
    },
  });
});

// Auth: Logout
app.post('/auth/logout', (c) => {
  deleteCookie(c, 'db_token', { path: '/' });
  return c.json({ ok: true });
});

// Current User Profile
app.get('/me', async (c) => {
  const u = c.get('user');
  if (!u) return c.json({ user: null });
  const row = await c.env.DB.prepare(
    `SELECT id, email, nickname, avatar_url, role, settings_json, created_at FROM users WHERE id = ?`
  )
    .bind(u.sub)
    .first<any>();
  return c.json({ user: row || null });
});

app.patch('/me', async (c) => {
  const u = c.get('user');
  if (!u) return c.json({ error: '未登录' }, 401);
  const body = await c.req.json<{
    nickname?: string;
    email?: string;
    avatar_url?: string;
    settings_json?: string;
  }>();

  const row = await c.env.DB.prepare(`SELECT * FROM users WHERE id = ?`)
    .bind(u.sub)
    .first<any>();
  if (!row) return c.json({ error: '用户不存在' }, 404);

  const nextNick = body.nickname !== undefined ? body.nickname.trim() : row.nickname;
  const nextEmail =
    body.email !== undefined ? body.email.trim().toLowerCase() : row.email;
  const nextAvatar = body.avatar_url !== undefined ? body.avatar_url : row.avatar_url;
  const nextSettings =
    body.settings_json !== undefined ? body.settings_json : row.settings_json;

  await c.env.DB.prepare(
    `UPDATE users SET nickname = ?, email = ?, avatar_url = ?, settings_json = ? WHERE id = ?`
  )
    .bind(nextNick, nextEmail, nextAvatar, nextSettings, u.sub)
    .run();

  return c.json({
    user: {
      id: u.sub,
      email: nextEmail,
      nickname: nextNick,
      avatar_url: nextAvatar,
      role: row.role,
    },
  });
});

app.post('/me/password', async (c) => {
  const u = c.get('user');
  if (!u) return c.json({ error: '未登录' }, 401);
  const { currentPassword, newPassword } = await c.req.json<{
    currentPassword?: string;
    newPassword?: string;
  }>();

  if (!newPassword || newPassword.length < 6) {
    return c.json({ error: '新密码不少于 6 位' }, 400);
  }

  const row = await c.env.DB.prepare(`SELECT * FROM users WHERE id = ?`)
    .bind(u.sub)
    .first<any>();
  if (!row) return c.json({ error: '用户不存在' }, 404);

  if (currentPassword) {
    const checkHash = await hashPassword(currentPassword, row.salt);
    if (checkHash !== row.password_hash) {
      return c.json({ error: '当前密码不正确' }, 400);
    }
  }

  const newSalt = generateSalt();
  const newHash = await hashPassword(newPassword, newSalt);
  await c.env.DB.prepare(`UPDATE users SET password_hash = ?, salt = ? WHERE id = ?`)
    .bind(newHash, newSalt, u.sub)
    .run();

  return c.json({ ok: true });
});

app.delete('/me', async (c) => {
  const u = c.get('user');
  if (!u) return c.json({ error: '未登录' }, 401);
  await c.env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(u.sub).run();
  await c.env.DB.prepare(`DELETE FROM progress WHERE user_id = ?`).bind(u.sub).run();
  await c.env.DB.prepare(`DELETE FROM highlights WHERE user_id = ?`).bind(u.sub).run();
  await c.env.DB.prepare(`DELETE FROM notes WHERE user_id = ?`).bind(u.sub).run();
  await c.env.DB.prepare(`DELETE FROM group_members WHERE user_id = ?`).bind(u.sub).run();
  deleteCookie(c, 'db_token', { path: '/' });
  return c.json({ ok: true });
});

// Bidirectional Sync for Progress, Highlights, Notes
app.post('/sync', async (c) => {
  const u = c.get('user');
  if (!u) return c.json({ error: '未登录' }, 401);

  const body = await c.req.json<{
    progress?: Array<{ group_id: string; day_index: number; part: string; done_at: number }>;
    highlights?: Array<{
      id: string;
      book: string;
      chapter: number;
      verse: number;
      color: string;
      updated_at: number;
      deleted?: number;
    }>;
    notes?: Array<{
      id: string;
      book: string;
      chapter: number;
      verse_start: number;
      verse_end: number;
      content: string;
      updated_at: number;
      deleted?: number;
    }>;
  }>();

  // Upsert progress
  if (Array.isArray(body.progress)) {
    for (const p of body.progress) {
      await c.env.DB.prepare(
        `INSERT OR REPLACE INTO progress (user_id, group_id, day_index, part, done_at)
         VALUES (?, ?, ?, ?, ?)`
      )
        .bind(u.sub, p.group_id, p.day_index, p.part, p.done_at || Date.now())
        .run();
    }
  }

  // Upsert highlights
  if (Array.isArray(body.highlights)) {
    for (const h of body.highlights) {
      await c.env.DB.prepare(
        `INSERT INTO highlights (id, user_id, book, chapter, verse, color, updated_at, deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, book, chapter, verse) DO UPDATE SET
           color = excluded.color,
           updated_at = excluded.updated_at,
           deleted = excluded.deleted
         WHERE excluded.updated_at >= highlights.updated_at`
      )
        .bind(
          h.id,
          u.sub,
          h.book,
          h.chapter,
          h.verse,
          h.color,
          h.updated_at,
          h.deleted ? 1 : 0
        )
        .run();
    }
  }

  // Upsert notes
  if (Array.isArray(body.notes)) {
    for (const n of body.notes) {
      await c.env.DB.prepare(
        `INSERT INTO notes (id, user_id, book, chapter, verse_start, verse_end, content, updated_at, deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           content = excluded.content,
           updated_at = excluded.updated_at,
           deleted = excluded.deleted
         WHERE excluded.updated_at >= notes.updated_at`
      )
        .bind(
          n.id,
          u.sub,
          n.book,
          n.chapter,
          n.verse_start,
          n.verse_end,
          n.content,
          n.updated_at,
          n.deleted ? 1 : 0
        )
        .run();
    }
  }

  const progressRows = await c.env.DB.prepare(
    `SELECT group_id, day_index, part, done_at FROM progress WHERE user_id = ?`
  )
    .bind(u.sub)
    .all();

  const highlightRows = await c.env.DB.prepare(
    `SELECT id, book, chapter, verse, color, updated_at, deleted FROM highlights WHERE user_id = ? AND deleted = 0`
  )
    .bind(u.sub)
    .all();

  const noteRows = await c.env.DB.prepare(
    `SELECT id, book, chapter, verse_start, verse_end, content, updated_at, deleted FROM notes WHERE user_id = ? AND deleted = 0 ORDER BY updated_at DESC`
  )
    .bind(u.sub)
    .all();

  return c.json({
    progress: progressRows.results || [],
    highlights: highlightRows.results || [],
    notes: noteRows.results || [],
  });
});

// Reading Groups
app.get('/groups', async (c) => {
  const u = c.get('user');
  const allGroups = await c.env.DB.prepare(
    `SELECT * FROM reading_groups ORDER BY is_public DESC, created_at ASC`
  ).all<any>();

  let joinedIds: string[] = ['public-desheng'];
  if (u) {
    const mRows = await c.env.DB.prepare(
      `SELECT group_id FROM group_members WHERE user_id = ?`
    )
      .bind(u.sub)
      .all<any>();
    joinedIds = Array.from(
      new Set(['public-desheng', ...(mRows.results || []).map((r: any) => r.group_id)])
    );
  }

  return c.json({
    groups: allGroups.results || [],
    joinedGroupIds: joinedIds,
  });
});

app.post('/groups/join', async (c) => {
  const u = c.get('user');
  if (!u) return c.json({ error: '请先登录再加入共读小组' }, 401);
  const { inviteCode } = await c.req.json<{ inviteCode: string }>();
  const code = (inviteCode || '').trim().toUpperCase();

  const grp = await c.env.DB.prepare(
    `SELECT * FROM reading_groups WHERE UPPER(invite_code) = ?`
  )
    .bind(code)
    .first<any>();

  if (!grp) {
    return c.json({ error: '未找到该邀请码对应的共读小组' }, 404);
  }

  await c.env.DB.prepare(
    `INSERT OR IGNORE INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)`
  )
    .bind(grp.id, u.sub, Date.now())
    .run();

  return c.json({ group: grp });
});

app.get('/groups/:id/stats', async (c) => {
  const groupId = c.req.param('id');
  const dayIndex = parseInt(c.req.query('dayIndex') || '1', 10);

  const members = await c.env.DB.prepare(
    `SELECT u.id, u.nickname, u.avatar_url
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = ?`
  )
    .bind(groupId)
    .all<any>();

  const progressToday = await c.env.DB.prepare(
    `SELECT user_id, part FROM progress WHERE group_id = ? AND day_index = ?`
  )
    .bind(groupId, dayIndex)
    .all<any>();

  const mapByUser: Record<string, string[]> = {};
  for (const row of progressToday.results || []) {
    if (!mapByUser[row.user_id]) mapByUser[row.user_id] = [];
    mapByUser[row.user_id].push(row.part);
  }

  const memberStats = (members.results || []).map((m: any) => {
    const parts = mapByUser[m.id] || [];
    return {
      userId: m.id,
      nickname: m.nickname,
      avatarUrl: m.avatar_url || '',
      partsDone: parts,
      completedAll: parts.includes('ps') && parts.includes('nt') && parts.includes('ot'),
    };
  });

  return c.json({ members: memberStats });
});

// Sermons (Public read, Admin write)
app.get('/sermons', async (c) => {
  try {
    const rows = await c.env.DB.prepare(
      `SELECT * FROM sermons WHERE status = 'published' ORDER BY date DESC, updated_at DESC`
    ).all<any>();

    const dbSermons = (rows.results || []).map((r: any) => ({
      id: r.id,
      title: r.title,
      speaker: r.speaker,
      church: r.church,
      date: r.date,
      series: r.series,
      scripture_ref: r.scripture_ref,
      summary: r.summary,
      blocks: JSON.parse(r.blocks_json || '[]'),
      slides: JSON.parse(r.slides_json || '[]'),
      updated_at: r.updated_at,
    }));

    const merged = [
      ...dbSermons,
      ...DEFAULT_SERMONS.filter((ds) => !dbSermons.some((s: any) => s.id === ds.id)),
    ];
    return c.json({ sermons: merged });
  } catch {
    return c.json({ sermons: DEFAULT_SERMONS });
  }
});

// Admin endpoints
app.post('/admin/sermons', async (c) => {
  const u = c.get('user');
  if (!u || u.role !== 'admin') return c.json({ error: '仅管理员可操作' }, 403);

  const body = await c.req.json<any>();
  const id = body.id || `sermon-${Date.now()}`;
  const now = Date.now();

  await c.env.DB.prepare(
    `INSERT OR REPLACE INTO sermons
     (id, title, speaker, church, date, series, scripture_ref, summary, blocks_json, slides_json, status, created_by, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)`
  )
    .bind(
      id,
      body.title || '主日证道',
      body.speaker || '主日讲员',
      body.church || '南橙縣以薩迦靈糧堂',
      body.date || new Date().toISOString().slice(0, 10),
      body.series || '',
      body.scripture_ref || '',
      body.summary || '',
      JSON.stringify(body.blocks || []),
      JSON.stringify(body.slides || []),
      u.email,
      now
    )
    .run();

  return c.json({ ok: true, id });
});

app.delete('/admin/sermons/:id', async (c) => {
  const u = c.get('user');
  if (!u || u.role !== 'admin') return c.json({ error: '仅管理员可操作' }, 403);
  const id = c.req.param('id');
  await c.env.DB.prepare(`DELETE FROM sermons WHERE id = ?`).bind(id).run();
  return c.json({ ok: true });
});

app.post('/admin/groups', async (c) => {
  const u = c.get('user');
  if (!u || u.role !== 'admin') return c.json({ error: '仅管理员可操作' }, 403);
  const body = await c.req.json<{
    id?: string;
    name: string;
    description?: string;
    start_date: string;
    invite_code: string;
    is_public?: boolean;
  }>();

  const id = body.id || `group-${Date.now()}`;
  const code = (body.invite_code || `G${Math.floor(1000 + Math.random() * 9000)}`)
    .trim()
    .toUpperCase();

  await c.env.DB.prepare(
    `INSERT OR REPLACE INTO reading_groups
     (id, name, description, plan_id, start_date, invite_code, is_public, created_by, created_at)
     VALUES (?, ?, ?, 'desheng', ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      body.name,
      body.description || '',
      body.start_date || 'calendar',
      code,
      body.is_public ? 1 : 0,
      u.email,
      Date.now()
    )
    .run();

  return c.json({ ok: true, id, invite_code: code });
});

app.delete('/admin/groups/:id', async (c) => {
  const u = c.get('user');
  if (!u || u.role !== 'admin') return c.json({ error: '仅管理员可操作' }, 403);
  const id = c.req.param('id');
  if (id === 'public-desheng') {
    return c.json({ error: '默认公开共读组不可删除' }, 400);
  }
  await c.env.DB.prepare(`DELETE FROM reading_groups WHERE id = ?`).bind(id).run();
  return c.json({ ok: true });
});

app.get('/admin/users', async (c) => {
  const u = c.get('user');
  if (!u || u.role !== 'admin') return c.json({ error: '仅管理员可操作' }, 403);
  const rows = await c.env.DB.prepare(
    `SELECT id, email, nickname, avatar_url, role, created_at FROM users ORDER BY created_at DESC`
  ).all();
  return c.json({ users: rows.results || [] });
});

app.patch('/admin/users/:id', async (c) => {
  const u = c.get('user');
  if (!u || u.role !== 'admin') return c.json({ error: '仅管理员可操作' }, 403);
  const targetId = c.req.param('id');
  const body = await c.req.json<{ role?: 'user' | 'admin'; resetPassword?: string }>();

  if (body.role) {
    await c.env.DB.prepare(`UPDATE users SET role = ? WHERE id = ?`)
      .bind(body.role, targetId)
      .run();
  }
  if (body.resetPassword && body.resetPassword.length >= 6) {
    const newSalt = generateSalt();
    const newHash = await hashPassword(body.resetPassword, newSalt);
    await c.env.DB.prepare(`UPDATE users SET password_hash = ?, salt = ? WHERE id = ?`)
      .bind(newHash, newSalt, targetId)
      .run();
  }
  return c.json({ ok: true });
});

// Audio Bible Proxy: Resolve official MP3 URL + verse-by-verse lyric timestamps for
// - categoryId 42: 和合本100周年朗读版 (阎大卫)
// - categoryId 2:  和合本（新旧约）磐石聆听版 (王涛峰)
app.get('/audio/chapter', async (c) => {
  const book = (c.req.query('book') || 'gen').trim().toUpperCase();
  const chapter = parseInt(c.req.query('chapter') || '1', 10) || 1;
  const preferredCat = parseInt(c.req.query('cat') || '42', 10) || 42;
  const usfmRef = `${book}.${chapter}`;

  try {
    const listRes = await fetch(
      `https://wd.bible/api/get/bible/audios?v=cunps&c=${encodeURIComponent(usfmRef)}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    if (!listRes.ok) {
      return c.json({ error: '获取章节音频列表失败' }, 502);
    }

    const listData = (await listRes.json()) as any;
    const rawItems: Array<{
      fileId: string;
      audioName: string;
      categoryName: string;
      categoryId: number;
      lyric: string;
    }> = Array.isArray(listData?.data) ? listData.data : [];

    // Keep only the two requested editions: 42 (和合本100周年朗读版) & 2 (和合本(新旧约)磐石聆听版)
    const allowedIds = [42, 2];
    const filtered = rawItems.filter((it) => allowedIds.includes(it.categoryId));

    const chosen =
      filtered.find((it) => it.categoryId === preferredCat) ||
      filtered[0] ||
      rawItems[0];

    if (!chosen || !chosen.fileId) {
      return c.json({ error: '该章节暂无对应音频资源' }, 404);
    }

    const dlRes = await fetch(
      `https://wd.bible/api/get/download/info?f=${encodeURIComponent(chosen.fileId)}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    if (!dlRes.ok) {
      return c.json({ error: '获取音频播放地址失败' }, 502);
    }

    const dlData = (await dlRes.json()) as any;
    const downloadUrl = dlData?.data?.downloadUrl || '';

    if (!downloadUrl) {
      return c.json({ error: '音频播放链接为空' }, 502);
    }

    return c.json({
      book: book.toLowerCase(),
      chapter,
      categoryId: chosen.categoryId,
      categoryName: chosen.categoryName,
      audioName: chosen.audioName,
      downloadUrl,
      lyric: chosen.lyric || '',
      availableEditions: filtered.map((it) => ({
        categoryId: it.categoryId,
        categoryName: it.categoryName,
      })),
    });
  } catch (err: any) {
    return c.json({ error: '音频服务请求异常: ' + String(err?.message || err) }, 500);
  }
});

