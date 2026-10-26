# 微读圣经 · 读经助手 (DailyBible)

基于 **React 18 + Vite + TypeScript + Tailwind CSS + Cloudflare Pages Functions (Hono) + Cloudflare D1** 构建的现代全栈读经助手，专为部署在 **Cloudflare 免费版** 设计。

---

## 一、核心功能一览

1. **新标点和合本圣经阅读 (`/bible/gen.1`)**
   - 界面参照 `https://wd.bible/bible/gen.1.cunps` 设计：支持段落连排（小标题 + 蓝色上标节号 + 全角空格「　神」排版）与逐节换行模式切换。
   - **简繁双版官方经文**：内置 `eBible.org` 收录之 `cmn-cu89s`（简体）与 `cmn-cu89t`（繁体）全本 66 卷 JSON 数据，界面与证道/笔记通过 `opencc-js` 实时简繁切换（默认简体）。
   - **三色主题**：支持 **浅色**、**深色** 以及仿粤读圣经（Can Read Bible `https://canread.bible/`）的 **护眼浅黄 (`#F5EBD7`)** 主题。
   - **阅读工具栏**：66 卷书卷章节快速选择器、5 档字号、3 档行距、简繁双版本对照阅读、全屏阅读。

2. **圣经语音朗读浮层 (`ReaderOverlay`)**
   - 基于浏览器原生 Web Speech API，支持**播放/暂停**、**上一节/下一节前后跳段**、**0.75x ~ 2.0x 语速调整**，朗读时自动高亮当前经文并平滑滚动跟随。

3. **得胜读经计划 & 共读小组 (`/` & `/plan`)**
   - 完整内置 365 天「得胜读经计划」（每天一篇诗篇/箴言 + 一章新约 + 两章旧约；闰年 2 月 29 日自动复用 2 月 28 日经文）。
   - **首页展示当天待读计划**：支持直接在首页展开阅读、语音朗读或跳转章节；三段经文全部打卡完成后，卡片变为**绿色状态**并播放 **庆祝礼花动画 (`canvas-confetti`)**。
   - **共读小组**：支持默认公开共读组（按日历 1 月 1 日开始）与管理员创建的自定义起始日期共读小组（通过邀请码如 `ISSACHAR` 加入），展示小组成员今日完成率与全年补读表。

4. **全能查经搜索 & 批次复制 (`/search`)**
   - **经文搜寻（怎么打都找得到）**：
     - 支持 `太6:33` / `太六33` / `馬太6:33` / `馬太福音6:33`
     - 区间搜寻：`太1.17-2.4`、`太5-7`
     - 懒人输入：`太7.1`、`使徒7`
     - 全圣经搜寻：`7:1`（查找全本圣经所有第 7 章第 1 节）
   - **多关键字搜寻（精准过滤）**：
     - 多词 AND 搜寻：`耶穌 愛 我`
     - 排除搜寻：`光-暗`
     - 每页 50 条流畅分页 + 关键字高亮
   - **批次复制篮 (`BatchCopyTray`)**：点击任意经文即可加入，支持跨搜索模式累积，自动按书卷章节排序合并连续经文并一键复制。
   - **离线可用**：首次加载后自动将全本圣经缓存至浏览器 `IndexedDB` 与 `Service Worker`，断网亦可查经与阅读。

5. **教会周日主日证道 & PPTX 自动转网页 (`/sermons` & `/admin`)**
   - 内置示例证道：**《南橙縣以薩迦靈糧堂 — 2024-12-01 聖靈的工作：聖靈引導 系列-3 (Works of the Holy Spirit!)》**。
   - 证道正文中的经文引用（如 `約翰福音 14:16-17`、`哥林多後書 3:17`）自动识别并渲染为可点击跳转链接。
   - **管理员上传 PPTX**：管理员（预设邮箱 `affbizm@gmail.com`）可在后台上传 `.pptx` 文件，浏览器端通过 `JSZip` 自动提取标题、讲道段落、圣经经文与内嵌图片，过滤固定片头页并转化为网页版全文与幻灯片卡片双视图。

6. **我的高亮、我的笔记 & 个人资料修改 (`/me`)**
   - 点击任意一节或多节经文即可标记 5 种颜色高亮、撰写灵修笔记、复制或朗读。
   - 支持按颜色/书卷筛选并导出 `.txt` / `.md` 文件。
   - 个人中心支持修改昵称、上传压缩头像、修改邮箱与密码、删除账号。

---

## 二、圣经译本版权与授权说明

1. **译本与数据源**：本站所使用的中文圣经经文源自《官话和合本圣经》（Chinese Union Version，1919 年出版，已进入公共领域 Public Domain），数字化文本与标点分段取自 `eBible.org` 收录之公开领域档案（`cmn-cu89s` 简体 / `cmn-cu89t` 繁体）。
2. **联合圣经公会 / 香港圣经公会权益说明**：《新标点和合本》（CUNP，1988 年出版）之专有修订与排版版权归联合圣经公会（United Bible Societies, UBS）及香港圣经公会（Hong Kong Bible Society）所有。若教会或机构将本系统部署于公共互联网并需正式冠名「新标点和合本 (CUNP)」，建议向当地圣经公会或香港圣经公会申请非商业电子事工授权。
3. **非商业事工声明**：本平台仅供教会信徒日常读经、灵修查经与主日证道学习使用，完全免费且无任何商业用途。

---

## 三、本地开发与 Cloudflare Pages 免费版部署指南

### 1. 本地运行
```bash
# 安装依赖
npm install

# 重新生成经文、得胜读经计划与示例 PPTX（已内置在 public/ 下，可跳过）
npm run data:all

# 运行单元测试
npm test

# 启动开发服务器
npm run dev

# 构建生产包
npm run build
```

### 2. 部署到 Cloudflare Pages (免费版)
1. 将本项目推送至 GitHub 仓库。
2. 登录 Cloudflare Dashboard -> **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**。
3. 构建设置（Build settings）：
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. （可选）绑定 D1 数据库：
   - 在 Cloudflare Dashboard 创建一个 D1 数据库 `dailybible-db`。
   - 执行建表 SQL：`npx wrangler d1 execute dailybible-db --remote --file=./migrations/0001_init.sql`。
   - 在 Pages 项目的 **Settings -> Functions -> D1 database bindings** 中添加变量名 `DB` 指向 `dailybible-db`。
   - 环境变量 `ADMIN_EMAIL` 默认已配置为 `affbizm@gmail.com`，使用该邮箱注册或登录即自动拥有管理员权限。
