import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Upload,
  FileSpreadsheet,
  Plus,
  Trash2,
  Users,
  CheckCircle2,
  Sparkles,
  Eye,
  History,
  BookOpen,
  RefreshCw,
  KeyRound,
  UserPlus,
} from 'lucide-react';
import { parsePptxFile, SermonBlock, ExtractedSlide } from '../lib/pptx';
import { useSettingsStore } from '../stores/settingsStore';
import { useUserDataStore } from '../stores/userDataStore';
import { SermonItem } from '../data/defaultSermons';

function formatTimestamp(ts: number | null | undefined): string {
  if (!ts) return '—';
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useSettingsStore();
  const {
    user,
    loginOrRegister,
    sermons,
    saveSermon,
    deleteSermon,
    groups,
    createAdminGroup,
    deleteAdminGroup,
    allUsers,
    fetchAdminUsers,
    setUserRole,
    adminResetUserPassword,
    adminCreateOrUpdateUser,
    adminDeleteUser,
    adminSearchLogs,
    fetchAdminSearchLogs,
  } = useUserDataStore();

  const [tab, setTab] = useState<'sermons' | 'groups' | 'users' | 'searchLogs'>('sermons');

  // Admin user password reset & user creation states
  const [resetPwdMap, setResetPwdMap] = useState<Record<string, string>>({});
  const [resetMsgMap, setResetMsgMap] = useState<Record<string, string>>({});
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserNickname, setNewUserNickname] = useState('');
  const [newUserPwd, setNewUserPwd] = useState('');
  const [newUserMsg, setNewUserMsg] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminUsers();
      fetchAdminSearchLogs();
    }
  }, [user?.role, tab, fetchAdminUsers, fetchAdminSearchLogs]);

  // PPTX Upload & Web Conversion Editor State
  const [parsing, setParsing] = useState(false);
  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('主日講員');
  const [church, setChurch] = useState('南橙縣以薩迦靈糧堂');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [series, setSeries] = useState('');
  const [scriptureRef, setScriptureRef] = useState('');
  const [summary, setSummary] = useState('');
  const [blocks, setBlocks] = useState<SermonBlock[]>([]);
  const [slides, setSlides] = useState<ExtractedSlide[]>([]);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');

  // Group creation state
  const [grpName, setGrpName] = useState('');
  const [grpDesc, setGrpDesc] = useState('');
  const [grpStart, setGrpStart] = useState('2025-01-01');
  const [grpCode, setGrpCode] = useState('');
  const [grpPublic, setGrpPublic] = useState(true);

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-brand/15 text-brand flex items-center justify-center mx-auto">
          <Shield className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold">{t('需要管理员权限')}</h1>
        <p className="text-sm theme-text-muted leading-relaxed">
          {t(
            '主日证道 PPTX 上传转换、共读小组创建及用户管理仅限教会管理员（affbizm@gmail.com）操作。'
          )}
        </p>
        <button
          onClick={async () => {
            await loginOrRegister(
              'login',
              'affbizm@gmail.com',
              'admin123456',
              '教会管理员'
            );
          }}
          className="px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover shadow-sm"
        >
          {t('以管理员 (affbizm@gmail.com) 身份登录')}
        </button>
      </div>
    );
  }

  const handlePptxFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    setUploadSuccessMsg('');
    try {
      const buf = await file.arrayBuffer();
      const parsed = await parsePptxFile(buf);
      setTitle(parsed.inferredTitle);
      setDate(parsed.inferredDate);
      setSeries(parsed.inferredSeries);
      setChurch(parsed.inferredChurch);
      setScriptureRef(parsed.inferredScriptureRef);
      setBlocks(parsed.blocks);
      setSlides(parsed.slides);
      setSummary(
        `从 ${file.name} 自动提取 ${parsed.slides.length} 页幻灯片与 ${parsed.blocks.length} 段讲道内容。`
      );
    } catch (err: any) {
      alert('解析 PPTX 失败，请确认文件为 .pptx 格式: ' + String(err?.message || err));
    } finally {
      setParsing(false);
    }
  };

  const handleLoadSamplePptx = async () => {
    setParsing(true);
    setUploadSuccessMsg('');
    try {
      const res = await fetch('/samples/2024-12-01-works-of-the-holy-spirit.pptx');
      const buf = await res.arrayBuffer();
      const parsed = await parsePptxFile(buf);
      setTitle(parsed.inferredTitle);
      setDate(parsed.inferredDate);
      setSeries(parsed.inferredSeries);
      setChurch(parsed.inferredChurch);
      setScriptureRef(parsed.inferredScriptureRef);
      setBlocks(parsed.blocks);
      setSlides(parsed.slides);
      setSummary(
        '从示例证道《2024-12-01 聖靈的工作：聖靈引導 系列-3.pptx》自动读取文字、经文与结构化段落。'
      );
    } finally {
      setParsing(false);
    }
  };

  const handlePublishSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || blocks.length === 0) return;

    const newSermon: SermonItem = {
      id: `sermon-${date}-${Date.now().toString().slice(-4)}`,
      title: title.trim(),
      speaker: speaker.trim() || '主日講員',
      church: church.trim() || '南橙縣以薩迦靈糧堂',
      date,
      series: series.trim(),
      scripture_ref: scriptureRef.trim(),
      summary: summary.trim(),
      blocks,
      slides,
      updated_at: Date.now(),
    };

    await saveSermon(newSermon);
    setUploadSuccessMsg(t('主日证道已成功转化为网页版并发布！'));
    setTimeout(() => {
      navigate(`/sermons/${newSermon.id}`);
    }, 900);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grpName.trim() || !grpCode.trim()) return;
    await createAdminGroup({
      name: grpName,
      description: grpDesc,
      start_date: grpStart,
      invite_code: grpCode,
      is_public: grpPublic,
    });
    setGrpName('');
    setGrpDesc('');
    setGrpCode('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 pb-24 space-y-6">
      {/* Header & Admin Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b theme-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold">{t('教会管理员后台')}</h1>
            <p className="text-xs theme-text-muted">
              {t('当前管理员：')}
              {user.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('sermons')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              tab === 'sermons'
                ? 'bg-brand text-white'
                : 'theme-card border theme-border'
            }`}
          >
            {t('主日证道 PPTX 上传与管理')}
          </button>
          <button
            onClick={() => setTab('groups')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              tab === 'groups'
                ? 'bg-brand text-white'
                : 'theme-card border theme-border'
            }`}
          >
            {t('共读小组管理')}
          </button>
          <button
            onClick={() => setTab('users')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              tab === 'users'
                ? 'bg-brand text-white'
                : 'theme-card border theme-border'
            }`}
          >
            {t('用户与权限')}
          </button>
          <button
            onClick={() => setTab('searchLogs')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
              tab === 'searchLogs'
                ? 'bg-brand text-white'
                : 'theme-card border theme-border'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{t('用户搜索与阅读记录')}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PPTX Upload & Web Sermon Converter */}
      {tab === 'sermons' && (
        <div className="space-y-6">
          {/* PPTX Dropzone Card */}
          <div className="rounded-2xl border-2 border-dashed border-brand/50 theme-card p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold">
                {t('上传主日证道 PPTX 自动转化为网页版')}
              </h2>
              <p className="text-xs theme-text-muted max-w-xl mx-auto">
                {t(
                  '系统将在浏览器端直接读取 .pptx 幻灯片中的标题、讲道段落、圣经经节及内嵌图片，自动过滤片头固定宣言页并生成网页版预览。'
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <label className="px-5 py-2.5 rounded-xl bg-brand text-white text-xs sm:text-sm font-semibold hover:bg-brand-hover cursor-pointer flex items-center gap-2 shadow-sm">
                <Upload className="w-4 h-4" />
                <span>{parsing ? t('正在解析 PPTX...') : t('选择本地 .pptx 文件上传')}</span>
                <input
                  type="file"
                  accept=".pptx"
                  onChange={handlePptxFileSelected}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleLoadSamplePptx}
                className="px-4 py-2.5 rounded-xl border theme-border theme-elevated text-xs sm:text-sm font-semibold hover:border-brand hover:text-brand flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-brand" />
                <span>
                  {t('一键载入示例《聖靈的工作：聖靈引導 系列-3.pptx》测试转换')}
                </span>
              </button>
            </div>
          </div>

          {/* Preview & Editable Web Sermon Form */}
          {blocks.length > 0 && (
            <form
              onSubmit={handlePublishSermon}
              className="rounded-2xl border theme-border theme-card p-6 space-y-5 shadow-sm"
            >
              <div className="flex items-center justify-between border-b theme-border pb-3">
                <h3 className="font-bold text-base text-brand">
                  {t('PPTX 解析结果预览与网页排版微调')}
                </h3>
                <span className="text-xs theme-text-muted">
                  {t('已提取')} {slides.length} {t('页幻灯片')} · {blocks.length}{' '}
                  {t('个网页段落')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div className="sm:col-span-2">
                  <label className="block text-xs theme-text-muted mb-1">
                    {t('主日证道题目')}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border theme-border theme-elevated font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs theme-text-muted mb-1">
                    {t('主日日期')}
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border theme-border theme-elevated"
                  />
                </div>

                <div>
                  <label className="block text-xs theme-text-muted mb-1">
                    {t('教会名称')}
                  </label>
                  <input
                    type="text"
                    value={church}
                    onChange={(e) => setChurch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border theme-border theme-elevated"
                  />
                </div>

                <div>
                  <label className="block text-xs theme-text-muted mb-1">
                    {t('系列名称')}
                  </label>
                  <input
                    type="text"
                    value={series}
                    onChange={(e) => setSeries(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border theme-border theme-elevated"
                  />
                </div>

                <div>
                  <label className="block text-xs theme-text-muted mb-1">
                    {t('主题经节')}
                  </label>
                  <input
                    type="text"
                    value={scriptureRef}
                    onChange={(e) => setScriptureRef(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border theme-border theme-elevated"
                  />
                </div>
              </div>

              {/* Editable Blocks List */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {blocks.map((blk, idx) => (
                  <div
                    key={blk.id}
                    className="p-3 rounded-xl theme-elevated border theme-border space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <select
                        value={blk.type}
                        onChange={(e) => {
                          const next = [...blocks];
                          next[idx] = {
                            ...blk,
                            type: e.target.value as SermonBlock['type'],
                          };
                          setBlocks(next);
                        }}
                        className="px-2 py-1 rounded border theme-border theme-card font-semibold"
                      >
                        <option value="heading">{t('小标题 (Heading)')}</option>
                        <option value="scripture">{t('引用经文 (Scripture)')}</option>
                        <option value="paragraph">{t('正文段落 (Paragraph)')}</option>
                        <option value="callout">{t('重点宣告 (Callout)')}</option>
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          setBlocks(blocks.filter((_, i) => i !== idx))
                        }
                        className="text-red-500 hover:underline"
                      >
                        {t('移除此段')}
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      value={blk.content}
                      onChange={(e) => {
                        const next = [...blocks];
                        next[idx] = { ...blk, content: e.target.value };
                        setBlocks(next);
                      }}
                      className="w-full p-2 rounded-lg border theme-border theme-card text-xs sm:text-sm"
                    />
                  </div>
                ))}
              </div>

              {uploadSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-700 text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{uploadSuccessMsg}</span>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setBlocks([])}
                  className="px-4 py-2 rounded-xl border theme-border text-xs font-medium"
                >
                  {t('取消')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand text-white text-xs sm:text-sm font-semibold hover:bg-brand-hover shadow-sm"
                >
                  {t('确认发布为网页版证道')}
                </button>
              </div>
            </form>
          )}

          {/* Published Sermons List */}
          <div className="rounded-2xl border theme-border theme-card p-5 space-y-3">
            <h3 className="font-bold text-sm">
              {t('已发布主日证道')} ({sermons.length})
            </h3>
            <div className="divide-y theme-border">
              {sermons.map((s) => (
                <div
                  key={s.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <div>
                    <div className="font-bold">{t(s.title)}</div>
                    <div className="text-xs theme-text-muted">
                      {s.date} · {t(s.church)} · {s.blocks.length} {t('段')}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate(`/sermons/${s.id}`)}
                      className="text-brand hover:underline flex items-center gap-1 text-xs font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t('查看网页')}</span>
                    </button>
                    {s.id !== 'sermon-2024-12-01-holy-spirit-3' && (
                      <button
                        onClick={() => deleteSermon(s.id)}
                        className="text-red-500 hover:underline flex items-center gap-1 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t('删除')}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Reading Groups Admin */}
      {tab === 'groups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form
            onSubmit={handleCreateGroup}
            className="rounded-2xl border theme-border theme-card p-5 space-y-4"
          >
            <h3 className="font-bold text-base flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand" />
              <span>{t('创建新得胜共读小组')}</span>
            </h3>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs theme-text-muted mb-1">
                  {t('小组名称')}
                </label>
                <input
                  type="text"
                  required
                  value={grpName}
                  onChange={(e) => setGrpName(e.target.value)}
                  placeholder={t('例如：2025春季主日共读小组')}
                  className="w-full px-3 py-2 rounded-xl border theme-border theme-elevated"
                />
              </div>

              <div>
                <label className="block text-xs theme-text-muted mb-1">
                  {t('开始日期（按天数顺延计算每日经文）')}
                </label>
                <input
                  type="date"
                  required
                  value={grpStart}
                  onChange={(e) => setGrpStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border theme-border theme-elevated"
                />
              </div>

              <div>
                <label className="block text-xs theme-text-muted mb-1">
                  {t('加入邀请码')}
                </label>
                <input
                  type="text"
                  required
                  value={grpCode}
                  onChange={(e) => setGrpCode(e.target.value.toUpperCase())}
                  placeholder="SPRING2025"
                  className="w-full px-3 py-2 rounded-xl border theme-border theme-elevated uppercase"
                />
              </div>

              <div>
                <label className="block text-xs theme-text-muted mb-1">
                  {t('小组简介')}
                </label>
                <textarea
                  rows={2}
                  value={grpDesc}
                  onChange={(e) => setGrpDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border theme-border theme-elevated"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={grpPublic}
                  onChange={(e) => setGrpPublic(e.target.checked)}
                  className="accent-brand"
                />
                <span>{t('设为公开小组（所有用户无需邀请码即可切换）')}</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-brand text-white text-xs sm:text-sm font-semibold hover:bg-brand-hover"
            >
              {t('创建共读小组')}
            </button>
          </form>

          <div className="rounded-2xl border theme-border theme-card p-5 space-y-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-brand" />
              <span>
                {t('现有共读小组')} ({groups.length})
              </span>
            </h3>
            <div className="space-y-2.5">
              {groups.map((g) => (
                <div
                  key={g.id}
                  className="p-3.5 rounded-xl theme-elevated border theme-border flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-sm">{t(g.name)}</div>
                    <div className="theme-text-muted mt-0.5">
                      {t('邀请码')}: <strong className="text-brand">{g.invite_code}</strong> ·{' '}
                      {g.start_date === 'calendar'
                        ? t('日历固定 (1月1日开始)')
                        : `${t('起始日')}: ${g.start_date}`}
                    </div>
                  </div>
                  {g.id !== 'public-desheng' && (
                    <button
                      onClick={() => deleteAdminGroup(g.id)}
                      className="text-red-500 hover:underline"
                    >
                      {t('删除')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Users Management & Password Reset */}
      {tab === 'users' && (
        <div className="space-y-6">
          {/* Quick Add / Reset Any Email Password Card */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setNewUserMsg('');
              const res = await adminCreateOrUpdateUser({
                email: newUserEmail,
                password: newUserPwd,
                nickname: newUserNickname,
              });
              if (res.ok) {
                setNewUserMsg(
                  `已成功为 ${newUserEmail.trim()} 设置密码（${newUserPwd}）！`
                );
                setNewUserEmail('');
                setNewUserNickname('');
                setNewUserPwd('');
                fetchAdminUsers();
              } else {
                setNewUserMsg(res.error || '操作失败');
              }
            }}
            className="rounded-2xl border theme-border theme-card p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b theme-border pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-brand" />
                <span>{t('新增用户 / 按邮箱直接重置密码')}</span>
              </h3>
              <span className="text-xs theme-text-muted">
                {t('输入任意用户邮箱和新密码即可立即生效（若账号未注册会自动创建）')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs theme-text-muted mb-1">
                  {t('用户邮箱')}
                </label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="例如：lizhenyuan@gmail.com"
                  className="w-full px-3 py-2 rounded-xl border theme-border theme-elevated outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-xs theme-text-muted mb-1">
                  {t('昵称 / 打卡名字（选填）')}
                </label>
                <input
                  type="text"
                  value={newUserNickname}
                  onChange={(e) => setNewUserNickname(e.target.value)}
                  placeholder={t('例如：慕道 / 弟兄姊妹名字')}
                  className="w-full px-3 py-2 rounded-xl border theme-border theme-elevated outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-xs theme-text-muted mb-1">
                  {t('设置新密码（至少 6 位）')}
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={newUserPwd}
                  onChange={(e) => setNewUserPwd(e.target.value)}
                  placeholder={t('例如：123456')}
                  className="w-full px-3 py-2 rounded-xl border theme-border theme-elevated outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              {newUserMsg ? (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{newUserMsg}</span>
                </span>
              ) : (
                <span />
              )}

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-brand text-white text-xs sm:text-sm font-semibold hover:bg-brand-hover flex items-center gap-1.5"
              >
                <KeyRound className="w-4 h-4" />
                <span>{t('确认创建 / 重置该邮箱密码')}</span>
              </button>
            </div>
          </form>

          {/* All Registered Users List with One-Click Password Reset */}
          <div className="rounded-2xl border theme-border theme-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b theme-border pb-3">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand" />
                  <span>
                    {t('全站注册用户管理与密码重置')} ({allUsers.length})
                  </span>
                </h3>
                <p className="text-xs theme-text-muted mt-0.5">
                  {t('可在此直接帮任意弟兄姊妹重置登录密码、切换管理员权限或删除测试账号')}
                </p>
              </div>

              <button
                onClick={() => fetchAdminUsers()}
                className="px-3 py-1.5 rounded-xl border theme-border text-xs font-semibold hover:border-brand hover:text-brand flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t('刷新用户列表')}</span>
              </button>
            </div>

            <div className="divide-y theme-border text-xs sm:text-sm">
              {allUsers.map((u) => {
                const pwdVal = resetPwdMap[u.id] ?? '';
                const msgVal = resetMsgMap[u.id] ?? '';
                return (
                  <div
                    key={u.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-sm flex flex-wrap items-center gap-2">
                        <span>{u.nickname}</span>
                        {u.checkin_name && u.checkin_name !== u.nickname && (
                          <span className="px-2 py-0.5 rounded bg-brand/10 text-brand text-xs">
                            {t('打卡名：')}{u.checkin_name}
                          </span>
                        )}
                        <span className="font-normal theme-text-muted">
                          ({u.email})
                        </span>
                      </div>
                      <div className="text-xs theme-text-muted flex items-center gap-3">
                        <span>
                          {t('当前角色：')}
                          <strong
                            className={u.role === 'admin' ? 'text-brand' : ''}
                          >
                            {u.role === 'admin' ? t('管理员') : t('普通成员')}
                          </strong>
                        </span>
                      </div>
                      {msgVal && (
                        <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1 pt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{msgVal}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Password Reset Input + Buttons */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={pwdVal}
                          onChange={(e) =>
                            setResetPwdMap((prev) => ({
                              ...prev,
                              [u.id]: e.target.value,
                            }))
                          }
                          placeholder={t('输入新密码 (至少6位)')}
                          className="w-36 sm:w-40 px-2.5 py-1.5 rounded-lg border theme-border theme-elevated text-xs outline-none focus:border-brand"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const targetPwd = (pwdVal || '').trim() || '123456';
                            if (targetPwd.length < 6) {
                              setResetMsgMap((prev) => ({
                                ...prev,
                                [u.id]: '密码需不少于 6 位',
                              }));
                              return;
                            }
                            const res = await adminResetUserPassword(
                              u.id,
                              u.email,
                              targetPwd
                            );
                            if (res.ok) {
                              setResetPwdMap((prev) => ({ ...prev, [u.id]: '' }));
                              setResetMsgMap((prev) => ({
                                ...prev,
                                [u.id]: `密码已重置为：${targetPwd}`,
                              }));
                            } else {
                              setResetMsgMap((prev) => ({
                                ...prev,
                                [u.id]: res.error || '重置失败',
                              }));
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover flex items-center gap-1 shrink-0"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>
                            {pwdVal.trim()
                              ? t('重置为此密码')
                              : t('一键重置为 123456')}
                          </span>
                        </button>
                      </div>

                      {u.email.toLowerCase() !== 'affbizm@gmail.com' && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setUserRole(
                                u.id,
                                u.role === 'admin' ? 'user' : 'admin'
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg border theme-border text-xs hover:border-brand"
                          >
                            {u.role === 'admin'
                              ? t('设为普通成员')
                              : t('设为管理员')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `确定要删除用户 ${u.email} 吗？`
                                )
                              ) {
                                adminDeleteUser(u.id);
                              }
                            }}
                            className="p-1.5 rounded-lg border theme-border text-red-500 hover:border-red-500"
                            title={t('删除用户')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: All Users Search & Opened Verses Logs */}
      {tab === 'searchLogs' && (
        <div className="rounded-2xl border theme-border theme-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b theme-border pb-3">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <History className="w-4 h-4 text-brand" />
                <span>
                  {t('全站用户搜索记录与打开经文统计')} ({adminSearchLogs.length})
                </span>
              </h3>
              <p className="text-xs theme-text-muted mt-0.5">
                {t(
                  '展示每个用户的最后搜索时间、此前搜索次数与上次搜索时间、搜索关键词，以及点击打开阅读的具体经文。'
                )}
              </p>
            </div>

            <button
              onClick={() => fetchAdminSearchLogs()}
              className="px-3 py-1.5 rounded-xl border theme-border text-xs font-semibold hover:border-brand hover:text-brand flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('刷新记录')}</span>
            </button>
          </div>

          {adminSearchLogs.length === 0 ? (
            <div className="py-12 text-center text-xs sm:text-sm theme-text-muted">
              {t('暂无用户搜索记录。')}
            </div>
          ) : (
            <div className="space-y-3">
              {adminSearchLogs.map((log) => (
                <div
                  key={log.id || `${log.user_id}-${log.keyword}`}
                  className="p-4 rounded-xl theme-elevated border theme-border text-xs space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-brand text-white font-semibold">
                        {log.user_name || t('访客用户')}
                      </span>
                      {log.user_email && (
                        <span className="theme-text-muted">
                          ({log.user_email})
                        </span>
                      )}
                      <span className="theme-text-muted">·</span>
                      <span>
                        {t('搜索关键词：')}
                        <Link
                          to={`/search?q=${encodeURIComponent(log.keyword)}`}
                          className="text-sm font-bold text-brand hover:underline ml-0.5"
                        >
                          {log.keyword}
                        </Link>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-brand/15 text-brand font-bold">
                        {t('累计搜索')} {log.search_count} {t('次')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 theme-text-muted">
                      <span>
                        {t('最后搜索时间：')}
                        <strong className="text-current">
                          {formatTimestamp(log.last_searched_at)}
                        </strong>
                      </span>
                      {log.previous_searched_at && (
                        <span>
                          {t('上次搜索时间：')}
                          <strong className="text-amber-700 dark:text-amber-400">
                            {formatTimestamp(log.previous_searched_at)}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {log.opened_verses && log.opened_verses.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t theme-border">
                      <span className="inline-flex items-center gap-1 theme-text-muted">
                        <BookOpen className="w-3.5 h-3.5 text-brand" />
                        <span>{t('打开阅读的经文：')}</span>
                      </span>
                      {log.opened_verses.map((v) => (
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
                    <div className="text-[11px] theme-text-muted pt-1 border-t theme-border">
                      {t('该次搜索暂未点击打开具体经文阅读')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
