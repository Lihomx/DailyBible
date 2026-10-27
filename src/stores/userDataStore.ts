import { create } from 'zustand';
import { DEFAULT_SERMONS, SermonItem } from '../data/defaultSermons';
import { MatchedVerseResult } from '../lib/refParser';

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple';

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  checkin_name?: string;
  avatar_url: string;
  role: 'user' | 'admin';
}

export interface HighlightRecord {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  verseText?: string;
  color: HighlightColor;
  updated_at: number;
}

export interface NoteRecord {
  id: string;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
  versePreview?: string;
  content: string;
  updated_at: number;
}

export interface ReadingGroupItem {
  id: string;
  name: string;
  description: string;
  plan_id: string;
  start_date: string; // 'calendar' or 'YYYY-MM-DD'
  invite_code: string;
  is_public: number;
  created_by: string;
  created_at: number;
}

export interface GroupMemberProgress {
  userId: string;
  nickname: string;
  avatarUrl: string;
  partsDone: ('ps' | 'nt' | 'ot')[];
  completedAll: boolean;
}

export interface OpenedVerseLogItem {
  id: string;
  label: string;
  bookId: string;
  chapter: number;
  verse: number;
  opened_at: number;
  count?: number;
}

export interface SearchLogEntry {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  keyword: string;
  search_count: number;
  previous_searched_at: number | null;
  last_searched_at: number;
  opened_verses: OpenedVerseLogItem[];
}

interface UserDataState {
  user: UserProfile | null;
  allUsers: UserProfile[];
  activeGroupId: string;
  groups: ReadingGroupItem[];
  joinedGroupIds: string[];
  // Keyed by `${groupId}:${dayIndex}` -> array of completed parts ['ps', 'nt', 'ot']
  progressMap: Record<string, ('ps' | 'nt' | 'ot')[]>;
  highlights: Record<string, HighlightRecord>; // keyed by `${book}.${chapter}.${verse}`
  notes: NoteRecord[];
  sermons: SermonItem[];
  batchCopyItems: MatchedVerseResult[];
  batchSelectMode: boolean;
  searchHistory: SearchLogEntry[];
  adminSearchLogs: SearchLogEntry[];

  // Auth & Profile actions
  loginOrRegister: (
    mode: 'login' | 'register',
    email: string,
    password: string,
    nickname?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (patch: {
    nickname?: string;
    checkin_name?: string;
    email?: string;
    avatar_url?: string;
  }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  deleteAccount: () => Promise<void>;

  // Reading Plan & Group actions
  setActiveGroup: (groupId: string) => void;
  togglePlanPart: (
    groupId: string,
    dayIndex: number,
    part: 'ps' | 'nt' | 'ot'
  ) => { newlyCompletedDay: boolean };
  markAllDayPartsDone: (groupId: string, dayIndex: number) => { newlyCompletedDay: boolean };
  joinGroupByCode: (inviteCode: string) => Promise<{ ok: boolean; error?: string; group?: ReadingGroupItem }>;
  createAdminGroup: (input: {
    name: string;
    description: string;
    start_date: string;
    invite_code: string;
    is_public: boolean;
  }) => Promise<ReadingGroupItem>;
  deleteAdminGroup: (groupId: string) => Promise<void>;

  // Highlights & Notes actions
  setVerseHighlight: (
    book: string,
    chapter: number,
    verse: number,
    color: HighlightColor | null,
    verseText?: string
  ) => void;
  saveNote: (input: {
    id?: string;
    book: string;
    chapter: number;
    verse_start: number;
    verse_end: number;
    versePreview?: string;
    content: string;
  }) => void;
  deleteNote: (noteId: string) => void;

  // Sermons actions
  saveSermon: (sermon: SermonItem) => Promise<void>;
  deleteSermon: (sermonId: string) => Promise<void>;

  // Admin User Management
  fetchAdminUsers: () => Promise<void>;
  setUserRole: (userId: string, role: 'user' | 'admin') => Promise<void>;
  adminResetUserPassword: (
    userId: string,
    email: string,
    newPassword: string
  ) => Promise<{ ok: boolean; error?: string }>;
  adminCreateOrUpdateUser: (input: {
    email: string;
    password: string;
    nickname?: string;
    role?: 'user' | 'admin';
  }) => Promise<{ ok: boolean; error?: string }>;
  adminDeleteUser: (userId: string) => Promise<void>;

  // Batch Copy Tray actions
  setBatchSelectMode: (enabled: boolean) => void;
  toggleBatchCopyItem: (item: MatchedVerseResult) => void;
  addBatchCopyItems: (items: MatchedVerseResult[]) => void;
  removeBatchCopyItem: (id: string) => void;
  clearBatchCopy: () => void;

  // Search History & Opened Verses Tracking actions
  recordSearchQuery: (keyword: string) => Promise<void>;
  recordSearchOpenedVerse: (
    keyword: string,
    verseInfo: {
      id: string;
      label: string;
      bookId: string;
      chapter: number;
      verse: number;
    }
  ) => Promise<void>;
  fetchSearchHistory: () => Promise<void>;
  fetchAdminSearchLogs: () => Promise<void>;

  // Cloud sync
  syncWithCloud: () => Promise<void>;
}

const ADMIN_EMAIL = 'affbizm@gmail.com';
const LOCAL_STATE_KEY = 'dailybible_userdata_v1';

const DEFAULT_GROUPS: ReadingGroupItem[] = [
  {
    id: 'public-desheng',
    name: '得胜读经计划 · 全教会公开共读',
    description:
      '每天一篇诗篇或箴言、一章新约、两章旧约，一年读完一遍新旧约全书。按日历1月1日为第1天，随时可加入共读！',
    plan_id: 'desheng',
    start_date: 'calendar',
    invite_code: 'DESHENG',
    is_public: 1,
    created_by: ADMIN_EMAIL,
    created_at: 1730000000000,
  },
  {
    id: 'group-issachar-2025',
    name: '南橙縣以薩迦靈糧堂 · 得勝共讀小組',
    description: '教会弟兄姊妹按小组自定义起始日期同心共读，彼此代祷守望。',
    plan_id: 'desheng',
    start_date: '2025-01-01',
    invite_code: 'ISSACHAR',
    is_public: 0,
    created_by: ADMIN_EMAIL,
    created_at: 1730000000000,
  },
];

function loadPersistedData() {
  if (typeof window === 'undefined') {
    return {
      user: null,
      allUsers: [
        {
          id: 'admin-default',
          email: ADMIN_EMAIL,
          nickname: '教会管理员',
          avatar_url: '',
          role: 'admin' as const,
        },
      ],
      activeGroupId: 'public-desheng',
      groups: DEFAULT_GROUPS,
      joinedGroupIds: ['public-desheng'],
      progressMap: {} as Record<string, ('ps' | 'nt' | 'ot')[]>,
      highlights: {} as Record<string, HighlightRecord>,
      notes: [] as NoteRecord[],
      sermons: DEFAULT_SERMONS,
      batchCopyItems: [] as MatchedVerseResult[],
      searchHistory: [] as SearchLogEntry[],
    };
  }

  try {
    const raw = localStorage.getItem(LOCAL_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const savedSermons: SermonItem[] = Array.isArray(parsed.sermons)
        ? parsed.sermons
        : DEFAULT_SERMONS;
      // Ensure default sermon is present
      for (const ds of DEFAULT_SERMONS) {
        if (!savedSermons.some((s) => s.id === ds.id)) {
          savedSermons.push(ds);
        }
      }
      return {
        user: parsed.user || null,
        allUsers: Array.isArray(parsed.allUsers) && parsed.allUsers.length > 0
          ? parsed.allUsers
          : [
              {
                id: 'admin-default',
                email: ADMIN_EMAIL,
                nickname: '教会管理员',
                avatar_url: '',
                role: 'admin' as const,
              },
            ],
        activeGroupId: parsed.activeGroupId || 'public-desheng',
        groups:
          Array.isArray(parsed.groups) && parsed.groups.length > 0
            ? parsed.groups
            : DEFAULT_GROUPS,
        joinedGroupIds:
          Array.isArray(parsed.joinedGroupIds) && parsed.joinedGroupIds.length > 0
            ? parsed.joinedGroupIds
            : ['public-desheng'],
        progressMap: parsed.progressMap || {},
        highlights: parsed.highlights || {},
        notes: Array.isArray(parsed.notes) ? parsed.notes : [],
        sermons: savedSermons,
        batchCopyItems: Array.isArray(parsed.batchCopyItems) ? parsed.batchCopyItems : [],
        searchHistory: Array.isArray(parsed.searchHistory) ? parsed.searchHistory : [],
      };
    }
  } catch {
    // ignore
  }

  return {
    user: null,
    allUsers: [
      {
        id: 'admin-default',
        email: ADMIN_EMAIL,
        nickname: '教会管理员',
        avatar_url: '',
        role: 'admin' as const,
      },
    ],
    activeGroupId: 'public-desheng',
    groups: DEFAULT_GROUPS,
    joinedGroupIds: ['public-desheng'],
    progressMap: {} as Record<string, ('ps' | 'nt' | 'ot')[]>,
    highlights: {} as Record<string, HighlightRecord>,
    notes: [] as NoteRecord[],
    sermons: DEFAULT_SERMONS,
    batchCopyItems: [] as MatchedVerseResult[],
    searchHistory: [] as SearchLogEntry[],
  };
}

function persistState(state: Partial<UserDataState>) {
  if (typeof window === 'undefined') return;
  try {
    const current = JSON.parse(localStorage.getItem(LOCAL_STATE_KEY) || '{}');
    const next = {
      ...current,
      user: state.user !== undefined ? state.user : current.user,
      allUsers: state.allUsers !== undefined ? state.allUsers : current.allUsers,
      activeGroupId:
        state.activeGroupId !== undefined ? state.activeGroupId : current.activeGroupId,
      groups: state.groups !== undefined ? state.groups : current.groups,
      joinedGroupIds:
        state.joinedGroupIds !== undefined ? state.joinedGroupIds : current.joinedGroupIds,
      progressMap:
        state.progressMap !== undefined ? state.progressMap : current.progressMap,
      highlights: state.highlights !== undefined ? state.highlights : current.highlights,
      notes: state.notes !== undefined ? state.notes : current.notes,
      sermons: state.sermons !== undefined ? state.sermons : current.sermons,
      batchCopyItems:
        state.batchCopyItems !== undefined ? state.batchCopyItems : current.batchCopyItems,
      searchHistory:
        state.searchHistory !== undefined ? state.searchHistory : current.searchHistory,
    };
    localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
}

function getClientDeviceId(): string {
  if (typeof window === 'undefined') return 'guest';
  try {
    let cid = localStorage.getItem('dailybible_client_id');
    if (!cid) {
      cid = 'guest-' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('dailybible_client_id', cid);
    }
    return cid;
  } catch {
    return 'guest';
  }
}

const initialData = loadPersistedData();

export const useUserDataStore = create<UserDataState>((set, get) => ({
  ...initialData,
  batchSelectMode: false,
  adminSearchLogs: [],

  loginOrRegister: async (mode, email, password, nickname) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { ok: false, error: '请输入有效的邮箱地址' };
    }
    if (!password || password.length < 6) {
      return { ok: false, error: '密码长度不能少于 6 位' };
    }

    // Try cloud API first
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password, nickname }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          try {
            localStorage.setItem('dailybible_token', data.token);
          } catch {
            // ignore
          }
        }
        if (data.user) {
          const allUsers = [...get().allUsers];
          const idx = allUsers.findIndex((u) => u.email.toLowerCase() === cleanEmail);
          if (idx >= 0) allUsers[idx] = data.user;
          else allUsers.push(data.user);

          set({ user: data.user, allUsers });
          persistState({ user: data.user, allUsers });
          get().syncWithCloud().catch(() => {});
          return { ok: true };
        }
      } else if (res.status === 400 || res.status === 401 || res.status === 409) {
        const errData = await res.json().catch(() => ({}));
        if (errData.error) {
          return { ok: false, error: errData.error };
        }
      }
    } catch {
      // Fallback to local offline-capable auth when running without Cloudflare D1 worker
    }

    const isDefaultAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();
    const existingUsers = [...get().allUsers];
    const found = existingUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    const userObj: UserProfile = found
      ? {
          ...found,
          role: isDefaultAdmin ? 'admin' : found.role,
          nickname: nickname?.trim() || found.nickname,
        }
      : {
          id: `user-${Date.now()}`,
          email: cleanEmail,
          nickname:
            nickname?.trim() ||
            (isDefaultAdmin ? '教会管理员' : cleanEmail.split('@')[0]),
          avatar_url: '',
          role: isDefaultAdmin ? 'admin' : 'user',
        };

    if (!found) {
      existingUsers.push(userObj);
    } else {
      const i = existingUsers.findIndex((u) => u.id === found.id);
      existingUsers[i] = userObj;
    }

    set({ user: userObj, allUsers: existingUsers });
    persistState({ user: userObj, allUsers: existingUsers });
    return { ok: true };
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    set({ user: null });
    persistState({ user: null });
  },

  updateProfile: async (patch) => {
    const current = get().user;
    if (!current) return;

    const updated: UserProfile = {
      ...current,
      nickname: patch.nickname !== undefined ? patch.nickname.trim() : current.nickname,
      checkin_name:
        patch.checkin_name !== undefined
          ? patch.checkin_name.trim()
          : current.checkin_name || current.nickname,
      email: patch.email !== undefined ? patch.email.trim().toLowerCase() : current.email,
      avatar_url: patch.avatar_url !== undefined ? patch.avatar_url : current.avatar_url,
      role:
        (patch.email || current.email).toLowerCase() === ADMIN_EMAIL
          ? 'admin'
          : current.role,
    };

    try {
      const token = localStorage.getItem('dailybible_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          ...patch,
          userId: current.id,
          currentEmail: current.email,
        }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.token) {
          localStorage.setItem('dailybible_token', data.token);
        }
      }
    } catch {
      // ignore offline
    }

    const allUsers = get().allUsers.map((u) => (u.id === updated.id ? updated : u));
    set({ user: updated, allUsers });
    persistState({ user: updated, allUsers });
  },

  changePassword: async (currentPassword, newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      return { ok: false, error: '新密码不少于 6 位' };
    }
    const current = get().user;
    try {
      const token = localStorage.getItem('dailybible_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/me/password', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: current?.id,
          email: current?.email,
          currentPassword,
          newPassword,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        return { ok: false, error: d.error || '密码修改失败' };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: '网络异常，密码修改未同步到云端' };
    }
  },

  deleteAccount: async () => {
    const current = get().user;
    if (!current) return;
    try {
      await fetch('/api/me', { method: 'DELETE' });
    } catch {
      // ignore
    }
    const allUsers = get().allUsers.filter((u) => u.id !== current.id);
    set({ user: null, allUsers });
    persistState({ user: null, allUsers });
  },

  setActiveGroup: (groupId) => {
    set({ activeGroupId: groupId });
    persistState({ activeGroupId: groupId });
  },

  togglePlanPart: (groupId, dayIndex, part) => {
    const key = `${groupId}:${dayIndex}`;
    const prevParts = get().progressMap[key] || [];
    const wasAllDone =
      prevParts.includes('ps') && prevParts.includes('nt') && prevParts.includes('ot');

    const nextParts = prevParts.includes(part)
      ? prevParts.filter((p) => p !== part)
      : [...prevParts, part];

    const isNowAllDone =
      nextParts.includes('ps') && nextParts.includes('nt') && nextParts.includes('ot');

    const nextMap = {
      ...get().progressMap,
      [key]: nextParts,
    };

    set({ progressMap: nextMap });
    persistState({ progressMap: nextMap });
    get().syncWithCloud().catch(() => {});

    return { newlyCompletedDay: !wasAllDone && isNowAllDone };
  },

  markAllDayPartsDone: (groupId, dayIndex) => {
    const key = `${groupId}:${dayIndex}`;
    const prevParts = get().progressMap[key] || [];
    const wasAllDone =
      prevParts.includes('ps') && prevParts.includes('nt') && prevParts.includes('ot');

    const nextParts: ('ps' | 'nt' | 'ot')[] = ['ps', 'nt', 'ot'];
    const nextMap = {
      ...get().progressMap,
      [key]: nextParts,
    };

    set({ progressMap: nextMap });
    persistState({ progressMap: nextMap });
    get().syncWithCloud().catch(() => {});

    return { newlyCompletedDay: !wasAllDone };
  },

  joinGroupByCode: async (inviteCode) => {
    const clean = inviteCode.trim().toUpperCase();
    if (!clean) return { ok: false, error: '请输入邀请码' };

    const found = get().groups.find((g) => g.invite_code.toUpperCase() === clean);
    if (!found) {
      return { ok: false, error: '未找到该邀请码对应的共读小组（示例邀请码：DESHENG 或 ISSACHAR）' };
    }

    const joined = Array.from(new Set([...get().joinedGroupIds, found.id]));
    set({ joinedGroupIds: joined, activeGroupId: found.id });
    persistState({ joinedGroupIds: joined, activeGroupId: found.id });

    try {
      await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: clean }),
      });
    } catch {
      // ignore offline
    }

    return { ok: true, group: found };
  },

  createAdminGroup: async (input) => {
    const newGroup: ReadingGroupItem = {
      id: `group-${Date.now()}`,
      name: input.name.trim(),
      description: input.description.trim(),
      plan_id: 'desheng',
      start_date: input.start_date || 'calendar',
      invite_code: input.invite_code.trim().toUpperCase(),
      is_public: input.is_public ? 1 : 0,
      created_by: get().user?.email || ADMIN_EMAIL,
      created_at: Date.now(),
    };

    const nextGroups = [...get().groups, newGroup];
    const nextJoined = Array.from(new Set([...get().joinedGroupIds, newGroup.id]));
    set({ groups: nextGroups, joinedGroupIds: nextJoined });
    persistState({ groups: nextGroups, joinedGroupIds: nextJoined });

    try {
      await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroup),
      });
    } catch {
      // ignore
    }

    return newGroup;
  },

  deleteAdminGroup: async (groupId) => {
    if (groupId === 'public-desheng') return;
    const nextGroups = get().groups.filter((g) => g.id !== groupId);
    const nextJoined = get().joinedGroupIds.filter((id) => id !== groupId);
    const nextActive =
      get().activeGroupId === groupId ? 'public-desheng' : get().activeGroupId;
    set({ groups: nextGroups, joinedGroupIds: nextJoined, activeGroupId: nextActive });
    persistState({
      groups: nextGroups,
      joinedGroupIds: nextJoined,
      activeGroupId: nextActive,
    });

    try {
      await fetch(`/api/admin/groups/${groupId}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
  },

  setVerseHighlight: (book, chapter, verse, color, verseText) => {
    const key = `${book}.${chapter}.${verse}`;
    const nextHighlights = { ...get().highlights };

    if (!color) {
      delete nextHighlights[key];
    } else {
      nextHighlights[key] = {
        id: `hl-${key}`,
        book,
        chapter,
        verse,
        verseText: verseText || nextHighlights[key]?.verseText || '',
        color,
        updated_at: Date.now(),
      };
    }

    set({ highlights: nextHighlights });
    persistState({ highlights: nextHighlights });
    get().syncWithCloud().catch(() => {});
  },

  saveNote: (input) => {
    const now = Date.now();
    const existing = [...get().notes];
    if (input.id) {
      const idx = existing.findIndex((n) => n.id === input.id);
      if (idx >= 0) {
        existing[idx] = {
          ...existing[idx],
          content: input.content,
          versePreview: input.versePreview ?? existing[idx].versePreview,
          updated_at: now,
        };
        set({ notes: existing });
        persistState({ notes: existing });
        get().syncWithCloud().catch(() => {});
        return;
      }
    }

    const newNote: NoteRecord = {
      id: `note-${now}-${Math.random().toString(36).slice(2, 6)}`,
      book: input.book,
      chapter: input.chapter,
      verse_start: input.verse_start,
      verse_end: input.verse_end,
      versePreview: input.versePreview || '',
      content: input.content,
      updated_at: now,
    };

    const nextNotes = [newNote, ...existing];
    set({ notes: nextNotes });
    persistState({ notes: nextNotes });
    get().syncWithCloud().catch(() => {});
  },

  deleteNote: (noteId) => {
    const nextNotes = get().notes.filter((n) => n.id !== noteId);
    set({ notes: nextNotes });
    persistState({ notes: nextNotes });
    get().syncWithCloud().catch(() => {});
  },

  saveSermon: async (sermon) => {
    const existing = [...get().sermons];
    const idx = existing.findIndex((s) => s.id === sermon.id);
    if (idx >= 0) {
      existing[idx] = sermon;
    } else {
      existing.unshift(sermon);
    }

    set({ sermons: existing });
    persistState({ sermons: existing });

    try {
      await fetch('/api/admin/sermons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sermon),
      });
    } catch {
      // ignore offline
    }
  },

  deleteSermon: async (sermonId) => {
    const nextSermons = get().sermons.filter((s) => s.id !== sermonId);
    set({ sermons: nextSermons });
    persistState({ sermons: nextSermons });

    try {
      await fetch(`/api/admin/sermons/${sermonId}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
  },

  fetchAdminUsers: async () => {
    const adminEmail = get().user?.email || ADMIN_EMAIL;
    try {
      const token = localStorage.getItem('dailybible_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(
        `/api/admin/users?adminEmail=${encodeURIComponent(adminEmail)}`,
        { headers }
      );
      if (res.ok) {
        const data = (await res.json()) as { users?: UserProfile[] };
        if (Array.isArray(data.users) && data.users.length > 0) {
          // Merge cloud users with any local users so none are lost
          const mergedMap = new Map<string, UserProfile>();
          for (const u of data.users) {
            mergedMap.set(u.email.toLowerCase(), u);
          }
          for (const localU of get().allUsers) {
            const key = localU.email.toLowerCase();
            if (!mergedMap.has(key)) {
              mergedMap.set(key, localU);
            }
          }
          const nextUsers = Array.from(mergedMap.values());
          set({ allUsers: nextUsers });
          persistState({ allUsers: nextUsers });
        }
      }
    } catch {
      // ignore offline
    }
  },

  setUserRole: async (userId, role) => {
    const target = get().allUsers.find((u) => u.id === userId);
    const nextUsers = get().allUsers.map((u) =>
      u.id === userId ? { ...u, role } : u
    );
    const currentUser = get().user;
    const nextUser =
      currentUser && currentUser.id === userId
        ? { ...currentUser, role }
        : currentUser;
    set({ allUsers: nextUsers, user: nextUser });
    persistState({ allUsers: nextUsers, user: nextUser });

    try {
      const token = localStorage.getItem('dailybible_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          role,
          email: target?.email,
          adminEmail: currentUser?.email || ADMIN_EMAIL,
        }),
      });
    } catch {
      // ignore
    }
  },

  adminResetUserPassword: async (userId, email, newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      return { ok: false, error: '新密码不能少于 6 位' };
    }
    const currentUser = get().user;
    const target = get().allUsers.find((u) => u.id === userId || u.email.toLowerCase() === email.toLowerCase());
    try {
      const token = localStorage.getItem('dailybible_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          email,
          nickname: target?.nickname,
          role: target?.role || 'user',
          resetPassword: newPassword,
          adminEmail: currentUser?.email || ADMIN_EMAIL,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        return { ok: false, error: d.error || '重置密码失败' };
      }
      return { ok: true };
    } catch {
      return { ok: true };
    }
  },

  adminCreateOrUpdateUser: async (input) => {
    const cleanEmail = input.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { ok: false, error: '请输入有效的邮箱' };
    }
    if (!input.password || input.password.length < 6) {
      return { ok: false, error: '密码长度不能少于 6 位' };
    }
    const currentUser = get().user;
    try {
      const token = localStorage.getItem('dailybible_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...input,
          email: cleanEmail,
          adminEmail: currentUser?.email || ADMIN_EMAIL,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const existing = [...get().allUsers];
          const idx = existing.findIndex(
            (u) => u.email.toLowerCase() === cleanEmail
          );
          if (idx >= 0) existing[idx] = data.user;
          else existing.unshift(data.user);
          set({ allUsers: existing });
          persistState({ allUsers: existing });
        }
        return { ok: true };
      } else {
        const d = await res.json().catch(() => ({}));
        return { ok: false, error: d.error || '操作失败' };
      }
    } catch {
      return { ok: false, error: '网络请求失败' };
    }
  },

  adminDeleteUser: async (userId) => {
    const currentUser = get().user;
    const nextUsers = get().allUsers.filter((u) => u.id !== userId);
    set({ allUsers: nextUsers });
    persistState({ allUsers: nextUsers });

    try {
      const token = localStorage.getItem('dailybible_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}?adminEmail=${encodeURIComponent(
          currentUser?.email || ADMIN_EMAIL
        )}`,
        {
          method: 'DELETE',
          headers,
        }
      );
    } catch {
      // ignore
    }
  },

  setBatchSelectMode: (enabled) => {
    set({ batchSelectMode: enabled });
  },

  toggleBatchCopyItem: (item) => {
    const current = get().batchCopyItems;
    const exists = current.some((v) => v.id === item.id);
    const next = exists
      ? current.filter((v) => v.id !== item.id)
      : [...current, item];
    set({ batchCopyItems: next });
    persistState({ batchCopyItems: next });
  },

  addBatchCopyItems: (items) => {
    const map = new Map<string, MatchedVerseResult>();
    for (const v of get().batchCopyItems) map.set(v.id, v);
    for (const v of items) map.set(v.id, v);
    const next = Array.from(map.values());
    set({ batchCopyItems: next });
    persistState({ batchCopyItems: next });
  },

  removeBatchCopyItem: (id) => {
    const next = get().batchCopyItems.filter((v) => v.id !== id);
    set({ batchCopyItems: next });
    persistState({ batchCopyItems: next });
  },

  clearBatchCopy: () => {
    set({ batchCopyItems: [] });
    persistState({ batchCopyItems: [] });
  },

  recordSearchQuery: async (keyword) => {
    const clean = keyword.trim();
    if (!clean) return;

    const u = get().user;
    const deviceId = getClientDeviceId();
    const userId = u?.id || deviceId;
    const userEmail = u?.email || '';
    const userName = u?.checkin_name || u?.nickname || '访客用户';
    const now = Date.now();

    // Update local searchHistory optimistically
    const current = get().searchHistory;
    const existingIdx = current.findIndex((item) => item.keyword === clean);
    let nextHistory: SearchLogEntry[];
    if (existingIdx >= 0) {
      const existing = current[existingIdx];
      const updated: SearchLogEntry = {
        ...existing,
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
        search_count: existing.search_count + 1,
        previous_searched_at: existing.last_searched_at,
        last_searched_at: now,
      };
      nextHistory = [
        updated,
        ...current.filter((_, idx) => idx !== existingIdx),
      ];
    } else {
      const created: SearchLogEntry = {
        id: `slog_${now}`,
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
        keyword: clean,
        search_count: 1,
        previous_searched_at: null,
        last_searched_at: now,
        opened_verses: [],
      };
      nextHistory = [created, ...current];
    }
    set({ searchHistory: nextHistory });
    persistState({ searchHistory: nextHistory });

    try {
      const res = await fetch('/api/search/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: clean,
          incrementSearch: true,
          userId,
          userEmail,
          userName,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { ok?: boolean; entry?: SearchLogEntry };
        if (data.entry) {
          const merged = get().searchHistory.map((item) =>
            item.keyword === clean ? data.entry! : item
          );
          set({ searchHistory: merged });
          persistState({ searchHistory: merged });
        }
      }
    } catch {
      // Offline mode keeps local state intact
    }
  },

  recordSearchOpenedVerse: async (keyword, verseInfo) => {
    const clean = keyword.trim() || '直接阅读';
    const u = get().user;
    const deviceId = getClientDeviceId();
    const userId = u?.id || deviceId;
    const userEmail = u?.email || '';
    const userName = u?.checkin_name || u?.nickname || '访客用户';
    const now = Date.now();

    const newVerseItem: OpenedVerseLogItem = {
      ...verseInfo,
      opened_at: now,
    };

    const current = get().searchHistory;
    const existingIdx = current.findIndex((item) => item.keyword === clean);
    let nextHistory: SearchLogEntry[];
    if (existingIdx >= 0) {
      const existing = current[existingIdx];
      const filteredVerses = existing.opened_verses.filter(
        (v) => v.id !== verseInfo.id
      );
      const updated: SearchLogEntry = {
        ...existing,
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
        opened_verses: [newVerseItem, ...filteredVerses].slice(0, 50),
      };
      nextHistory = [
        updated,
        ...current.filter((_, idx) => idx !== existingIdx),
      ];
    } else {
      const created: SearchLogEntry = {
        id: `slog_${now}`,
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
        keyword: clean,
        search_count: 1,
        previous_searched_at: null,
        last_searched_at: now,
        opened_verses: [newVerseItem],
      };
      nextHistory = [created, ...current];
    }
    set({ searchHistory: nextHistory });
    persistState({ searchHistory: nextHistory });

    try {
      const res = await fetch('/api/search/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: clean,
          incrementSearch: false,
          openedVerse: verseInfo,
          userId,
          userEmail,
          userName,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { ok?: boolean; entry?: SearchLogEntry };
        if (data.entry) {
          const merged = get().searchHistory.map((item) =>
            item.keyword === clean ? data.entry! : item
          );
          set({ searchHistory: merged });
          persistState({ searchHistory: merged });
        }
      }
    } catch {
      // Offline mode keeps local state intact
    }
  },

  fetchSearchHistory: async () => {
    const u = get().user;
    const deviceId = getClientDeviceId();
    const userId = u?.id || deviceId;

    try {
      const res = await fetch(
        `/api/search/history?userId=${encodeURIComponent(userId)}`
      );
      if (res.ok) {
        const data = (await res.json()) as { logs?: SearchLogEntry[] };
        if (Array.isArray(data.logs) && data.logs.length > 0) {
          set({ searchHistory: data.logs });
          persistState({ searchHistory: data.logs });
        }
      }
    } catch {
      // Offline mode keeps local state
    }
  },

  fetchAdminSearchLogs: async () => {
    const adminEmail = get().user?.email || ADMIN_EMAIL;
    try {
      const token = localStorage.getItem('dailybible_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(
        `/api/admin/search-logs?adminEmail=${encodeURIComponent(adminEmail)}`,
        { headers }
      );
      if (res.ok) {
        const data = (await res.json()) as { logs?: SearchLogEntry[] };
        if (Array.isArray(data.logs)) {
          set({ adminSearchLogs: data.logs });
        }
      }
    } catch {
      // Offline fallback: use local searchHistory
      set({ adminSearchLogs: get().searchHistory });
    }
  },

  syncWithCloud: async () => {
    const u = get().user;
    if (!u) return;

    const progressPayload: Array<{
      group_id: string;
      day_index: number;
      part: string;
      done_at: number;
    }> = [];
    for (const [key, parts] of Object.entries(get().progressMap)) {
      const [groupId, dayStr] = key.split(':');
      const dayIndex = parseInt(dayStr, 10);
      for (const p of parts) {
        progressPayload.push({
          group_id: groupId,
          day_index: dayIndex,
          part: p,
          done_at: Date.now(),
        });
      }
    }

    const highlightsPayload = Object.values(get().highlights);
    const notesPayload = get().notes;

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progress: progressPayload,
          highlights: highlightsPayload,
          notes: notesPayload,
        }),
      });
      if (!res.ok) return;
    } catch {
      // Offline mode keeps local state intact
    }
  },
}));
