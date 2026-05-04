# Yupi Hot Monitor

一个用于监控和搜索热点内容的全栈项目。系统会围绕你配置的关键词，从多个公开来源抓取信息，调用 AI 做真假判断、相关性分析和摘要生成，并通过页面通知与邮件提醒推送结果。

## 功能概览

- 监控关键词的热点变化，支持启用和停用
- 聚合多个来源的数据：Twitter/X、Bing、Hacker News、搜狗、Bilibili、微博
- 基于 AI 做内容真实性、相关性、重要程度分析
- 支持手动触发扫描和全网搜索
- 提供实时通知、未读角标和邮件通知
- 支持切换 AI Provider（OpenAI、Anthropic、Google、兼容 OpenAI 的接口）

## 技术栈

- 前端：React 19、TypeScript、Vite、Tailwind CSS、Framer Motion
- 后端：Express 5、TypeScript、Socket.IO
- 数据库：SQLite、Prisma
- 调度：node-cron

## 目录结构

```text
.
├─ client/               # 前端应用
├─ server/               # 后端服务、Prisma、定时任务
├─ docs/                 # 补充文档
├─ skills/               # 热点监控 Skill
└─ README.md
```

## 快速开始

### 1. 环境要求

- Node.js 18+
- 一个可用的 AI API Key

### 2. 安装依赖

```bash
# 后端
cd server
npm install
npx prisma generate
npx prisma db push

# 前端
cd ../client
npm install
```

### 3. 配置环境变量

复制 [server/.env.example](/D:/Code/yupi-hot-monitor/server/.env.example) 为 `server/.env`，至少填写一组 AI 配置：

```bash
DATABASE_URL="file:./dev.db"

PORT=3001
CLIENT_URL=http://localhost:5000

AI_PROVIDER=openai
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=your_ai_api_key_here
AI_MODEL=gpt-4o-mini
```

可选配置：

```bash
# Twitter/X 搜索
TWITTER_API_KEY=your_twitter_api_key_here

# 邮件通知
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
NOTIFY_EMAIL=notify_to@example.com
```

### 4. 启动服务

```bash
# 终端 1
cd server
npm run dev

# 终端 2
cd client
npm run dev
```

启动后访问：

- 前端：http://localhost:5000
- 后端：http://localhost:3001

## 常用命令

### 后端

```bash
cd server
npm run dev
npm run build
npm run test
npx prisma studio
```

### 前端

```bash
cd client
npm run dev
npm run build
npm run lint
```

## 通知说明

- 页面右上角通知铃铛展示最近通知和未读数
- 扫描到新热点时会写入数据库通知记录，并通过 Socket.IO 实时推送
- 配置 SMTP 后，高重要性热点会额外发送邮件

## 相关文档

- [docs/LOCAL_SETUP.md](/D:/Code/yupi-hot-monitor/docs/LOCAL_SETUP.md)
- [docs/README.md](/D:/Code/yupi-hot-monitor/docs/README.md)
- [docs/REQUIREMENTS.md](/D:/Code/yupi-hot-monitor/docs/REQUIREMENTS.md)
