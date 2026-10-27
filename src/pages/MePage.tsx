import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  LogOut,
  Shield,
  Highlighter,
  StickyNote,
  CalendarCheck,
  Camera,
  KeyRound,
  Trash2,
  Check,
  History,
  BookOpen,
  Search,
} from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { useUserDataStore } from '../stores/userDataStore';

function formatTimestamp(ts: number | null | undefined): string {
  if (!ts) return '—';
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export const MePage: React.FC = () => {
  const { t } = useSettingsStore();
  const {
    user,
    loginOrRegister,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    highlights,
    notes,
    searchHistory,
    fetchSearchHistory,
  } = useUserDataStore();

  useEffect(() => {
    fetchSearchHistory();
  }, [fetchSearchHistory]);

  // Auth form state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [authError, setAuthError] = useState('');

  // Profile edit state
  const [editNickname, setEditNickname] = useState(user?.nickname || '');
  const [editCheckinName, setEditCheckinName] = useState(
    user?.checkin_name || user?.nickname || ''
  );
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // Password change state
  const [currPwd, setCurrPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const res = await loginOrRegister(authMode, email, password, nickname);
    if (!res.ok) {
      setAuthError(res.error || '操作失败');
    } else {
      const latest = useUserDataStore.getState().user;
      if (latest) {
        setEditNickname(latest.nickname);
        setEditCheckinName(latest.checkin_name || latest.nickname);
        setEditEmail(latest.email);
      }
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress image to 256x256 Data URL on client side
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, size, size);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          updateProfile({ avatar_url: dataUrl });
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      nickname: editNickname,
      checkin_name: editCheckinName,
      email: editEmail,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await changePassword(currPwd, newPwd);
    if (res.ok) {
      setPwdMsg(t('密码已成功更新！'));
      setCurrPwd('');
      setNewPwd('');
    } else {
      setPwdMsg(res.error || t('修改失败'));
    }
  };

  const highlightCount = Object.keys(highlights).length;
  const noteCount = notes.length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 pb-24 space-y-6">
      {/* Quick Shortcuts Row: My Highlights, My Notes, My Reading Plan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          to="/me/highlights"
          className="rounded-2xl border theme-border theme-card p-4 flex items-center justify-between hover:border-brand transition shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
              <Highlighter className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm">{t('我的高亮经文')}</div>
              <div className="text-xs theme-text-muted">
                {highlightCount} {t('节标记')}
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/me/notes"
          className="rounded-2xl border theme-border theme-card p-4 flex items-center justify-between hover:border-brand transition shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/15 text-brand flex items-center justify-center">
              <StickyNote className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm">{t('我的灵修笔记')}</div>
              <div className="text-xs theme-text-muted">
                {noteCount} {t('篇笔记')}
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/plan"
          className="rounded-2xl border theme-border theme-card p-4 flex items-center justify-between hover:border-brand transition shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm">{t('我的共读计划')}</div>
              <div className="text-xs theme-text-muted">{t('得胜读经计划')}</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Logged Out View -> Login / Register Card */}
      {!user ? (
        <div className="rounded-2xl border theme-border theme-card p-6 sm:p-8 max-w-md mx-auto space-y-5 shadow-sm">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold">
              {authMode === 'login' ? t('账号登录') : t('注册新账号')}
            </h1>
            <p className="text-xs theme-text-muted">
              {t('登录后可跨设备同步读经进度、高亮经文与灵修笔记')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl theme-elevated text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`py-2 rounded-lg transition ${
                authMode === 'login' ? 'bg-brand text-white' : 'theme-text-muted'
              }`}
            >
              {t('邮箱登录')}
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`py-2 rounded-lg transition ${
                authMode === 'register' ? 'bg-brand text-white' : 'theme-text-muted'
              }`}
            >
              {t('新用户注册')}
            </button>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-500/15 text-red-600 text-xs font-medium">
              {t(authError)}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-sm">
            {authMode === 'register' && (
              <div>
                <label className="block text-xs theme-text-muted mb-1">
                  {t('昵称 / 主内称呼')}
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={t('例如：主内弟兄 / 姊妹')}
                  className="w-full px-3.5 py-2.5 rounded-xl border theme-border theme-elevated outline-none focus:border-brand"
                />
              </div>
            )}

            <div>
              <label className="block text-xs theme-text-muted mb-1">
                {t('电子邮箱')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="affbizm@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border theme-border theme-elevated outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-xs theme-text-muted mb-1">
                {t('密码（至少6位）')}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border theme-border theme-elevated outline-none focus:border-brand"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-brand text-white font-semibold hover:bg-brand-hover transition shadow-sm"
            >
              {authMode === 'login' ? t('立即登录') : t('立即注册')}
            </button>
          </form>
        </div>
      ) : (
        /* Logged In -> Personal Profile Modification & Account Security */
        <div className="space-y-6">
          {/* User Banner */}
          <div className="rounded-2xl border theme-border theme-card p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.nickname}
                    className="w-16 h-16 rounded-full object-cover border-2 border-brand"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-brand text-white flex items-center justify-center text-2xl font-bold">
                    {user.nickname.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <label
                  title={t('上传修改头像')}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full theme-card border theme-border shadow flex items-center justify-center cursor-pointer hover:text-brand"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">{user.nickname}</h2>
                  {user.role === 'admin' && (
                    <span className="px-2 py-0.5 rounded-full bg-brand text-white text-xs font-bold flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      <span>{t('管理员')}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm theme-text-muted">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="px-4 py-2 rounded-xl bg-brand text-white text-xs sm:text-sm font-semibold hover:bg-brand-hover flex items-center gap-1.5"
                >
                  <Shield className="w-4 h-4" />
                  <span>{t('进入管理后台 / 上传证道 PPT')}</span>
                </Link>
              )}

              <button
                onClick={logout}
                className="px-3.5 py-2 rounded-xl border theme-border text-xs sm:text-sm font-medium hover:text-red-500 flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('退出登录')}</span>
              </button>
            </div>
          </div>

          {/* Profile Edit Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form
              onSubmit={handleSaveProfile}
              className="rounded-2xl border theme-border theme-card p-6 space-y-4"
            >
              <h3 className="font-bold text-base flex items-center gap-2 border-b theme-border pb-2.5">
                <User className="w-4 h-4 text-brand" />
                <span>{t('个人账号资料修改')}</span>
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs theme-text-muted mb-1">
                    {t('昵称')}
                  </label>
                  <input
                    type="text"
                    required
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border theme-border theme-elevated outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs theme-text-muted mb-1">
                    {t('打卡名字（点击「一键完成今日三段读经」时自动复制打卡文案）')}
                  </label>
                  <input
                    type="text"
                    value={editCheckinName}
                    onChange={(e) => setEditCheckinName(e.target.value)}
                    placeholder={t('例如：慕道 / 弟兄姊妹名字')}
                    className="w-full px-3.5 py-2 rounded-xl border theme-border theme-elevated outline-none focus:border-brand"
                  />
                  <p className="text-[11px] theme-text-muted mt-1">
                    {t('预览文案：')}{editCheckinName.trim() || editNickname.trim() || t('慕道')}{t('打卡，已读今日经文')}
                  </p>
                </div>

                <div>
                  <label className="block text-xs theme-text-muted mb-1">
                    {t('电子邮箱')}
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border theme-border theme-elevated outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                {profileSaved ? (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    <span>{t('个人资料已保存！')}</span>
                  </span>
                ) : (
                  <span />
                )}

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover"
                >
                  {t('保存资料修改')}
                </button>
              </div>
            </form>

            {/* Change Password & Danger Zone */}
            <form
              onSubmit={handlePasswordSubmit}
              className="rounded-2xl border theme-border theme-card p-6 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <h3 className="font-bold text-base flex items-center gap-2 border-b theme-border pb-2.5">
                  <KeyRound className="w-4 h-4 text-brand" />
                  <span>{t('修改登录密码')}</span>
                </h3>

                <div className="space-y-3 text-sm">
                  <div>
                    <label className="block text-xs theme-text-muted mb-1">
                      {t('当前密码')}
                    </label>
                    <input
                      type="password"
                      value={currPwd}
                      onChange={(e) => setCurrPwd(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 rounded-xl border theme-border theme-elevated outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs theme-text-muted mb-1">
                      {t('新密码（至少6位）')}
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 rounded-xl border theme-border theme-elevated outline-none focus:border-brand"
                    />
                  </div>
                </div>

                {pwdMsg && (
                  <div className="text-xs font-medium text-emerald-600">
                    {pwdMsg}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between border-t theme-border">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(t('确定要删除当前账号及关联资料吗？'))) {
                      deleteAccount();
                    }
                  }}
                  className="text-xs text-red-500 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('删除账号')}</span>
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover"
                >
                  {t('更新密码')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User's Personal Search & Opened Verses History Card */}
      <div className="rounded-2xl border theme-border theme-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b theme-border pb-3">
          <h3 className="font-bold text-base flex items-center gap-2">
            <History className="w-4 h-4 text-brand" />
            <span>
              {t('我的查经搜索与打开经文记录')} ({searchHistory.length})
            </span>
          </h3>
          <Link
            to="/search"
            className="text-xs font-semibold text-brand hover:underline flex items-center gap-1"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{t('前往查经搜索')}</span>
          </Link>
        </div>

        {searchHistory.length === 0 ? (
          <p className="text-xs theme-text-muted py-4 text-center">
            {t('暂无搜索记录。您在「搜索」页面输入的关键词及点开阅读的经文会自动记录在此。')}
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {searchHistory.map((item) => (
              <div
                key={item.id || item.keyword}
                className="p-3.5 rounded-xl theme-elevated border theme-border text-xs space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/search?q=${encodeURIComponent(item.keyword)}`}
                      className="text-sm font-bold text-brand hover:underline"
                    >
                      {item.keyword}
                    </Link>
                    <span className="px-2 py-0.5 rounded-full bg-brand/15 text-brand font-semibold">
                      {t('已搜索')} {item.search_count} {t('次')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 theme-text-muted">
                    <span>
                      {t('最后搜索时间：')}
                      <strong className="text-current">
                        {formatTimestamp(item.last_searched_at)}
                      </strong>
                    </span>
                    {item.previous_searched_at && (
                      <span>
                        {t('上次搜索时间：')}
                        <strong className="text-amber-700 dark:text-amber-400">
                          {formatTimestamp(item.previous_searched_at)}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>

                {item.opened_verses && item.opened_verses.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t theme-border">
                    <span className="inline-flex items-center gap-1 theme-text-muted">
                      <BookOpen className="w-3.5 h-3.5 text-brand" />
                      <span>{t('打开阅读的经文：')}</span>
                    </span>
                    {item.opened_verses.map((v) => (
                      <Link
                        key={`${v.id}-${v.opened_at}`}
                        to={`/bible/${v.bookId}.${v.chapter}?v=${v.verse}`}
                        className="px-2 py-0.5 rounded-md bg-brand/10 text-brand font-medium hover:bg-brand hover:text-white transition"
                      >
                        {t(v.label)}{' '}
                        <span className="opacity-75 text-[11px]">
                          ({formatTimestamp(v.opened_at)})
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] theme-text-muted">
                    {t('暂未点击打开具体经文')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
