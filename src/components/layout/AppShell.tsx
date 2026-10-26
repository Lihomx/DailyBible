import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Search,
  CalendarCheck,
  FileText,
  User,
  Menu,
  Sun,
  Moon,
  Eye,
  Languages,
  Shield,
  Info,
  Highlighter,
  StickyNote,
} from 'lucide-react';
import { useSettingsStore, ThemeMode } from '../../stores/settingsStore';
import { useUserDataStore } from '../../stores/userDataStore';
import { ReaderOverlay } from '../tts/ReaderOverlay';
import { BatchCopyTray } from '../search/BatchCopyTray';
import { CopyrightModal } from '../common/CopyrightModal';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    theme,
    setTheme,
    script,
    toggleScript,
    sidebarCollapsed,
    setSidebarCollapsed,
    t,
  } = useSettingsStore();
  const { user } = useUserDataStore();
  const [copyrightOpen, setCopyrightOpen] = useState(false);

  const path = location.pathname;
  const isBibleActive = path.startsWith('/bible');
  const isSearchActive = path.startsWith('/search');
  const isPlanActive = path.startsWith('/plan');
  const isSermonsActive = path.startsWith('/sermons');
  const isMeActive = path.startsWith('/me');
  const isAdminActive = path.startsWith('/admin');
  const isHomeActive = path === '/';

  const themeOptions: Array<{ mode: ThemeMode; label: string; icon: React.ReactNode }> = [
    { mode: 'light', label: '浅色', icon: <Sun className="w-4 h-4" /> },
    { mode: 'sepia', label: '护眼浅黄', icon: <Eye className="w-4 h-4" /> },
    { mode: 'dark', label: '深色', icon: <Moon className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Desktop Left Sidebar (wd.bible style) */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r theme-sidebar transition-all duration-200 ${
          sidebarCollapsed ? 'w-16' : 'w-48'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-3.5 flex items-center justify-between border-b theme-border">
          <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center shrink-0 shadow-sm">
              <svg viewBox="0 0 64 64" className="w-5 h-5" fill="none">
                <path
                  d="M10 32C18 19 34 19 46 32C34 45 18 45 10 32Z"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M46 32L55 22M46 32L55 42"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-base tracking-tight whitespace-nowrap">
                {t('微读圣经')}
              </span>
            )}
          </Link>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={t('收起/展开侧栏')}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 theme-text-muted"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Main Navigation Items */}
        <nav className="flex-1 p-2.5 space-y-1">
          <SidebarLink
            to="/"
            active={isHomeActive}
            collapsed={sidebarCollapsed}
            icon={<Home className="w-4 h-4" />}
            label={t('首页')}
          />
          <SidebarLink
            to="/bible/gen.1"
            active={isBibleActive}
            collapsed={sidebarCollapsed}
            icon={<BookOpen className="w-4 h-4" />}
            label={t('圣经')}
          />
          <SidebarLink
            to="/search"
            active={isSearchActive}
            collapsed={sidebarCollapsed}
            icon={<Search className="w-4 h-4" />}
            label={t('搜索')}
          />
          <SidebarLink
            to="/sermons"
            active={isSermonsActive}
            collapsed={sidebarCollapsed}
            icon={<FileText className="w-4 h-4" />}
            label={t('主日证道')}
          />
          <SidebarLink
            to="/plan"
            active={isPlanActive}
            collapsed={sidebarCollapsed}
            icon={<CalendarCheck className="w-4 h-4" />}
            label={t('读经计划')}
          />
          <SidebarLink
            to="/me/highlights"
            active={path === '/me/highlights'}
            collapsed={sidebarCollapsed}
            icon={<Highlighter className="w-4 h-4" />}
            label={t('我的高亮')}
          />
          <SidebarLink
            to="/me/notes"
            active={path === '/me/notes'}
            collapsed={sidebarCollapsed}
            icon={<StickyNote className="w-4 h-4" />}
            label={t('我的笔记')}
          />
          <SidebarLink
            to="/me"
            active={isMeActive && path !== '/me/highlights' && path !== '/me/notes'}
            collapsed={sidebarCollapsed}
            icon={<User className="w-4 h-4" />}
            label={t('个人中心')}
          />
          {user?.role === 'admin' && (
            <SidebarLink
              to="/admin"
              active={isAdminActive}
              collapsed={sidebarCollapsed}
              icon={<Shield className="w-4 h-4" />}
              label={t('管理后台')}
            />
          )}
        </nav>

        {/* Bottom Simplified/Traditional & Copyright Footer */}
        <div className="p-3 border-t theme-border space-y-2">
          <button
            onClick={toggleScript}
            title={t('切换简体/繁體')}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium transition"
          >
            <span className="w-6 h-6 rounded-full bg-brand/15 text-brand font-bold flex items-center justify-center text-xs shrink-0">
              {script === 'simp' ? '简' : '繁'}
            </span>
            {!sidebarCollapsed && (
              <span>{script === 'simp' ? '切換為繁體中文' : '切换为简体中文'}</span>
            )}
          </button>

          <button
            onClick={() => setCopyrightOpen(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-xs theme-text-muted transition"
          >
            <Info className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>{t('译本授权说明')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Top Sub-Navbar (wd.bible pill style) */}
        <header className="h-14 px-3 sm:px-6 border-b theme-border theme-card sticky top-0 z-30 flex items-center justify-between gap-2">
          {/* Left pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
            <Link to="/" className="md:hidden flex items-center gap-1.5 mr-1 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-brand text-white flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </Link>

            <TopPill
              to="/bible/gen.1"
              active={isBibleActive}
              label={t('圣经')}
            />
            <TopPill
              to="/search"
              active={isSearchActive}
              label={t('搜索')}
            />
            <TopPill
              to="/plan"
              active={isPlanActive}
              label={t('得胜计划')}
            />
            <TopPill
              to="/sermons"
              active={isSermonsActive}
              label={t('主日证道')}
            />
            {user?.role === 'admin' && (
              <TopPill
                to="/admin"
                active={isAdminActive}
                label={t('后台管理')}
              />
            )}
          </div>

          {/* Right User, Theme Switcher (Light / Sepia / Dark), and Script Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Three-mode theme selector */}
            <div className="flex items-center rounded-xl border theme-border p-0.5 text-xs">
              {themeOptions.map((opt) => {
                const active = theme === opt.mode;
                return (
                  <button
                    key={opt.mode}
                    onClick={() => setTheme(opt.mode)}
                    title={t(opt.label)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg transition font-medium ${
                      active
                        ? 'bg-brand text-white shadow-sm'
                        : 'theme-text-muted hover:text-current'
                    }`}
                  >
                    {opt.icon}
                    <span className="hidden lg:inline">{t(opt.label)}</span>
                  </button>
                );
              })}
            </div>

            {/* Simplified / Traditional toggle */}
            <button
              onClick={toggleScript}
              title={t('简繁切换')}
              className="px-2.5 py-1.5 rounded-xl border theme-border text-xs font-bold hover:border-brand hover:text-brand transition flex items-center gap-1"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{script === 'simp' ? '简体' : '繁體'}</span>
            </button>

            {/* User Profile Button */}
            <button
              onClick={() => navigate('/me')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-xs sm:text-sm font-medium transition"
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.nickname}
                  className="w-6 h-6 rounded-full object-cover border theme-border"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-brand/15 text-brand flex items-center justify-center font-bold text-xs">
                  {user ? user.nickname.slice(0, 1).toUpperCase() : <User className="w-3.5 h-3.5" />}
                </div>
              )}
              <span className="hidden sm:inline max-w-[100px] truncate">
                {user ? user.nickname : t('登录')}
              </span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">{children}</main>
      </div>

      {/* Mobile Bottom 5-Tab Bar (Single-hand friendly) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 h-14 theme-card border-t theme-border z-30 grid grid-cols-5">
        <MobileTab
          to="/"
          active={isHomeActive}
          icon={<Home className="w-5 h-5" />}
          label={t('首页')}
        />
        <MobileTab
          to="/bible/gen.1"
          active={isBibleActive}
          icon={<BookOpen className="w-5 h-5" />}
          label={t('圣经')}
        />
        <MobileTab
          to="/search"
          active={isSearchActive}
          icon={<Search className="w-5 h-5" />}
          label={t('搜索')}
        />
        <MobileTab
          to="/sermons"
          active={isSermonsActive}
          icon={<FileText className="w-5 h-5" />}
          label={t('证道')}
        />
        <MobileTab
          to="/me"
          active={isMeActive || isAdminActive}
          icon={<User className="w-5 h-5" />}
          label={t('我的')}
        />
      </nav>

      {/* Global Floating Audio Reader Overlay & Batch Copy Tray */}
      <ReaderOverlay />
      <BatchCopyTray />
      <CopyrightModal open={copyrightOpen} onClose={() => setCopyrightOpen(false)} />
    </div>
  );
};

const SidebarLink: React.FC<{
  to: string;
  active: boolean;
  collapsed: boolean;
  icon: React.ReactNode;
  label: string;
}> = ({ to, active, collapsed, icon, label }) => (
  <Link
    to={to}
    title={collapsed ? label : undefined}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
      active
        ? 'bg-white dark:bg-white/10 text-brand shadow-sm font-semibold'
        : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-85 hover:opacity-100'
    }`}
  >
    <span className={active ? 'text-brand' : 'theme-text-muted'}>{icon}</span>
    {!collapsed && <span className="truncate">{label}</span>}
  </Link>
);

const TopPill: React.FC<{ to: string; active: boolean; label: string }> = ({
  to,
  active,
  label,
}) => (
  <Link
    to={to}
    className={`px-3 py-1 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition ${
      active
        ? 'bg-brand text-white shadow-sm'
        : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-85'
    }`}
  >
    {label}
  </Link>
);

const MobileTab: React.FC<{
  to: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}> = ({ to, active, icon, label }) => (
  <Link
    to={to}
    className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
      active ? 'text-brand font-semibold' : 'theme-text-muted'
    }`}
  >
    {icon}
    <span>{label}</span>
  </Link>
);
