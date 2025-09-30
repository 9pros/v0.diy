# v0.diy

```
██╗   ██╗ ██████╗       ██████╗ ██╗██╗   ██╗
██║   ██║██╔═████╗      ██╔══██╗██║╚██╗ ██╔╝
██║   ██║██║██╔██║█████╗██║  ██║██║ ╚████╔╝ 
╚██╗ ██╔╝████╔╝██║╚════╝██║  ██║██║  ╚██╔╝  
 ╚████╔╝ ╚██████╔╝      ██████╔╝██║   ██║   
  ╚═══╝   ╚═════╝       ╚═════╝ ╚═╝   ╚═╝   
```

**Open-source clone of v0.dev with AI-powered React component generation**

Transform your ideas into production-ready React components using natural language

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/github/license/SujalXplores/v0.diy?style=for-the-badge)

**Navigation:** [⚡ Quick Start](#quick-start) • [🚀 Features](#features) • [🛠️ Tech Stack](#tech-stack)

---

## 🚀 Features

> **What makes v0.diy special?**

```bash
├── ✨ AI Component Generation    # Natural language → React components
├── ⚡ Real-time Streaming       # Watch code generate live
├── 🔐 Multi-tenant Auth         # Secure user management
├── 💾 Chat History             # Never lose your conversations
├── 🎨 Live Preview             # Split-screen development
└── 📱 Responsive Design        # Works everywhere
```

## ⚡ Quick Start

> **Get up and running in under 2 minutes**

**Step 1: Clone & Install**
```bash
git clone https://github.com/SujalXplores/v0.diy.git
cd v0.diy && pnpm install
```

**Step 2: Environment Setup**
```bash
cp .env.example .env.local
# Edit .env.local with your credentials ⬇️
```

**Step 3: Database & Launch**
```bash
pnpm db:migrate && pnpm dev
```

🎉 **Done!** Visit [localhost:3000](http://localhost:3000) to start building

### 🔧 Environment Variables

```bash
# 🤖 AI Configuration
V0_API_KEY=your_v0_api_key_here          # Get from https://v0.dev/chat/settings/keys

# 🔐 Authentication
AUTH_SECRET=your-auth-secret-here        # Generate: openssl rand -base64 32

# 🗄️ Database
POSTGRES_URL=postgresql://user:pass@localhost:5432/v0_diy
```

### 📊 Database Commands

```bash
pnpm db:generate    # 📝 Generate migration files
pnpm db:migrate     # 🚀 Apply migrations  
pnpm db:studio      # 🔍 Open database studio
```

## 🛠️ Tech Stack

> **Built with modern, battle-tested technologies**

**Frontend Stack**
```
⚛️  React 19          # Latest React with concurrent features
⚡  Next.js 15        # Full-stack React framework  
🔷  TypeScript 5.9    # Type-safe development
🎨  Tailwind CSS      # Utility-first styling
```

**Backend & Data**
```
🔐  NextAuth.js       # Authentication & sessions
🗄️  PostgreSQL       # Robust relational database
⚙️  Drizzle ORM      # Type-safe database operations
☁️  Vercel Postgres  # Cloud database hosting
```

**AI & Integration**  
```
🤖  v0 SDK           # v0.dev API integration
🧠  AI SDK           # Streaming AI responses
📡  @v0-sdk/react    # React components for AI
```

---

## 🤝 Contributing

**Want to contribute?** We'd love your help!

```bash
# 🐛 Found a bug?
- Open an issue with details

# 💡 Have an idea? 
- Start a discussion or create a feature request

# 🔧 Want to code?
- Fork the repo, make changes, submit a PR

# ⭐ Like the project?
- Give us a star on GitHub!
```

## 📄 License

**MIT License** - see [LICENSE](LICENSE) for details.

## 👨‍💻 Author

**Built with ❤️ by [Sujal Shah](https://github.com/SujalXplores)**

[![GitHub](https://img.shields.io/badge/Follow-SujalXplores-black?style=flat&logo=github)](https://github.com/SujalXplores)
[![Email](https://img.shields.io/badge/Email-sujal.shah.dev@gmail.com-red?style=flat&logo=gmail)](mailto:sujal.shah.dev@gmail.com)

> **⭐ If you found this project helpful, please consider giving it a star!**
