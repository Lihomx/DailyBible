import React, { useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  Trash2,
  RefreshCw,
  HardDrive,
  Wifi,
  WifiOff,
  Cloud,
  Layers,
} from 'lucide-react';
import { useOfflineSyncStore } from '../stores/offlineSyncStore';
import { useUserDataStore } from '../stores/userDataStore';
import { useSettingsStore } from '../stores/settingsStore';

export const OfflineSyncCard: React.FC = () => {
  const { script, t } = useSettingsStore();
  const {
    bibleStatus,
    downloadingScript,
    downloadProgress,
    downloadError,
    queue,
    isOnline,
    isSyncing,
    lastSyncedAt,
    syncError,
    refreshBibleStatus,
    downloadBible,
    clearBibleCache,
    triggerSyncQueue,
  } = useOfflineSyncStore();

  const { syncWithCloud, user } = useUserDataStore();

  useEffect(() => {
    refreshBibleStatus();
  }, [refreshBibleStatus]);

  const handleManualSync = () => {
    triggerSyncQueue(() => syncWithCloud());
  };

  const isCurrentDownloaded =
    script === 'trad' ? bibleStatus.cunpt : bibleStatus.cunps;

  const totalCachedBytes =
    (bibleStatus.cunps ? bibleStatus.cunpsSize : 0) +
    (bibleStatus.cunpt ? bibleStatus.cunptSize : 0);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatTime = (ts: number | null) => {
    if (!ts) return t('尚未同步');
    const d = new Date(ts);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-2xl border theme-border theme-card p-6 space-y-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b theme-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <span>{t('离线圣经与多设备同步')}</span>
              {isOnline ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <Wifi className="w-3 h-3" />
                  <span>{t('网络在线')}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  <WifiOff className="w-3 h-3" />
                  <span>{t('离线模式')}</span>
                </span>
              )}
            </h3>
            <p className="text-xs theme-text-muted">
              {t('持久化预热全本经文到 IndexedDB，并在断网打卡/笔记后联网自动合并')}
            </p>
          </div>
        </div>

        {totalCachedBytes > 0 && (
          <div className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 theme-text-muted">
            {t('已缓存占用：')}
            <strong className="text-brand ml-1">{formatSize(totalCachedBytes)}</strong>
          </div>
        )}
      </div>

      {/* Part 1: Full Bible Offline Cache */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
          <span className="flex items-center gap-1.5 text-brand">
            <Layers className="w-4 h-4" />
            <span>{t('全本圣经 66 卷离线数据包')}</span>
          </span>
          <span className="text-xs theme-text-muted">
            {isCurrentDownloaded ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('当前语言已就绪 (可无网秒开)')}</span>
              </span>
            ) : (
              t('未完整缓存')
            )}
          </span>
        </div>

        {downloadingScript && (
          <div className="space-y-1.5 p-3 rounded-xl bg-brand/5 border border-brand/20">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-brand">
                {t('正在下载离线圣经数据包...')} (
                {downloadingScript === 'all'
                  ? t('简繁两版')
                  : downloadingScript === 'trad'
                  ? t('繁体和合本')
                  : t('简体和合本')}
                )
              </span>
              <span className="text-brand">{downloadProgress}%</span>
            </div>
            <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-brand h-full rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {downloadError && (
          <div className="p-3 rounded-xl bg-red-500/15 text-red-600 text-xs font-semibold">
            {downloadError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Option 1: Current Script */}
          <div className="p-3.5 rounded-xl border theme-border theme-elevated flex flex-col justify-between space-y-2.5">
            <div>
              <div className="font-bold flex items-center justify-between">
                <span>
                  {script === 'trad' ? t('繁体和合本 (CUNPT)') : t('简体和合本 (CUNPS)')}
                </span>
                <span className="text-[11px] theme-text-muted">~4.5 MB</span>
              </div>
              <p className="text-[11px] theme-text-muted mt-1 leading-relaxed">
                {isCurrentDownloaded
                  ? t('已完整持久化至手机/电脑存储中，飞行模式下任意翻阅。')
                  : t('推荐！满足您当前界面的阅读与全圣经疾速检索。')}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={Boolean(downloadingScript)}
                onClick={() => downloadBible('current', script)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-sm ${
                  isCurrentDownloaded
                    ? 'border theme-border theme-card hover:border-brand text-brand'
                    : 'bg-brand text-white hover:bg-brand-hover'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>
                  {isCurrentDownloaded ? t('重新下载') : t('一键下载当前语言')}
                </span>
              </button>

              {isCurrentDownloaded && (
                <button
                  type="button"
                  onClick={() => clearBibleCache(script)}
                  title={t('清空缓存释放存储')}
                  className="px-2.5 py-1.5 rounded-lg border theme-border text-red-500 hover:bg-red-500/10 text-xs transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Option 2: Both Scripts */}
          <div className="p-3.5 rounded-xl border theme-border theme-elevated flex flex-col justify-between space-y-2.5">
            <div>
              <div className="font-bold flex items-center justify-between">
                <span>{t('简繁双语完整包')}</span>
                <span className="text-[11px] theme-text-muted">~9.0 MB</span>
              </div>
              <p className="text-[11px] theme-text-muted mt-1 leading-relaxed">
                {bibleStatus.cunps && bibleStatus.cunpt
                  ? t('简繁两版已全部缓存就绪，切换语言均无需任何网络。')
                  : t('包含简体与繁体和合本全本经文，适合经常切换字体的读者。')}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={Boolean(downloadingScript)}
                onClick={() => downloadBible('all', script)}
                className="px-3 py-1.5 rounded-lg bg-brand/10 text-brand hover:bg-brand hover:text-white text-xs font-semibold transition flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('下载全部简繁两版')}</span>
              </button>

              {totalCachedBytes > 0 && (
                <button
                  type="button"
                  onClick={() => clearBibleCache()}
                  className="px-2.5 py-1.5 rounded-lg border theme-border text-red-500 hover:bg-red-500/10 text-xs transition"
                >
                  {t('全部清空')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Part 2: Offline Mutation Queue & Multi-device Sync */}
      <div className="pt-4 border-t theme-border space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
          <span className="flex items-center gap-1.5 text-brand">
            <Cloud className="w-4 h-4" />
            <span>{t('多设备无感实时同步与离线队列')}</span>
          </span>
          <span className="text-xs theme-text-muted">
            {user ? (
              <span>
                {t('上次同步：')}
                <strong className="text-current ml-0.5">{formatTime(lastSyncedAt)}</strong>
              </span>
            ) : (
              <span className="text-amber-600">{t('未登录（仅保存在本机）')}</span>
            )}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border theme-border theme-elevated flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="font-semibold flex items-center gap-2">
              {queue.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                  {t('有')} {queue.length} {t('条离线操作待同步')}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('本地数据与云端已完全同步')}</span>
                </span>
              )}
            </div>
            <p className="text-[11px] theme-text-muted">
              {t(
                '合并规则：读经打卡双向并集（已读不覆盖丢失）；高亮与笔记按最新编辑时间戳自动合并。'
              )}
            </p>
          </div>

          <button
            type="button"
            disabled={isSyncing || !isOnline}
            onClick={handleManualSync}
            className="px-3.5 py-2 rounded-xl bg-brand text-white font-semibold hover:bg-brand-hover transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? t('正在同步...') : t('立即强制全量同步')}</span>
          </button>
        </div>

        {syncError && (
          <div className="p-2.5 rounded-xl bg-red-500/15 text-red-600 text-xs font-semibold">
            {syncError}
          </div>
        )}
      </div>
    </div>
  );
};
