# 🚀 Multi-Agent Development Guide

## Overview

This directory contains **10 independent context files** for parallel development. Each agent works on a specific module without interfering with others.

## 📋 Agent List & Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│  WEEK 1: Foundation                                         │
├─────────────────────────────────────────────────────────────┤
│  ✅ AGENT 1: Shared Types (START FIRST)                     │
│      ↓                                                       │
│  ⏳ AGENT 2: Database & Tenants (after Agent 1)            │
│  ⏳ AGENT 10: DevOps Setup (after Agent 1)                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  WEEK 2: Core Features                                      │
├─────────────────────────────────────────────────────────────┤
│  ⏳ AGENT 3: Products & Menu (after Agent 2)               │
│  ⏳ AGENT 4: Orders (after Agent 2, 3)                     │
│  ⏳ AGENT 6: Frontend Customer (after Agent 2, 3)          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  WEEK 3: Payments & Delivery                                │
├─────────────────────────────────────────────────────────────┤
│  ⏳ AGENT 5: Payments (after Agent 4)                      │
│  ⏳ AGENT 7: Delivery/Wolt (after Agent 4, 5)              │
│  ⏳ AGENT 6: Frontend Checkout (continues)                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  WEEK 4: Admin & Launch                                     │
├─────────────────────────────────────────────────────────────┤
│  ⏳ AGENT 8: Admin Dashboard (after Agent 4)               │
│  ⏳ AGENT 9: Order Tracking (after Agent 4, 7)             │
│  ⏳ AGENT 10: Deploy to Production (final)                 │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 How to Use

### Step 1: Open Multiple Cursor Windows/Tabs

**Option A: Multiple Windows (Recommended)**
1. Open Cursor normally (Agent 1)
2. Press `Cmd+Shift+N` 9 more times (Agents 2-10)
3. Arrange windows in a grid

**Option B: Multiple Composer Tabs**
1. Press `Cmd+Shift+P` → "Composer: Open in New Tab"
2. Repeat 9 times
3. Label each tab

### Step 2: Copy Context to Each Agent

For each agent:
1. Open the agent's context file (e.g., `AGENT-01-SHARED-TYPES.md`)
2. Select all (`Cmd+A`)
3. Copy (`Cmd+C`)
4. Switch to that agent's Cursor window
5. Paste (`Cmd+V`) into the chat
6. Press Enter

The agent will read the full context and start working!

### Step 3: Start Agents in Order

**⚠️ Important:** Follow the dependency order!

#### Week 1 (START HERE)
```bash
# Start these chats:
1️⃣ Agent 1: Shared Types (START NOW - no dependencies)

# Wait for Agent 1 to create: /shared/AGENT-1-COMPLETE.md
# Then start:

2️⃣ Agent 2: Database & Tenants
🔧 Agent 10: DevOps Setup
```

#### Week 2
```bash
# Wait for Agent 2 to create: /backend/AGENT-2-COMPLETE.md
# Then start:

3️⃣ Agent 3: Products & Menu
4️⃣ Agent 4: Orders
6️⃣ Agent 6: Frontend Customer (can start with just menu display)
```

#### Week 3
```bash
# Wait for Agent 4 to create: /backend/src/orders/AGENT-4-COMPLETE.md
# Then start:

5️⃣ Agent 5: Payments
7️⃣ Agent 7: Delivery/Wolt
# Agent 6 continues with checkout flow
```

#### Week 4
```bash
# All previous agents complete, now start:

8️⃣ Agent 8: Admin Dashboard
9️⃣ Agent 9: Order Tracking
# Agent 10 deploys everything
```

## 📁 Agent Summaries

| Agent | Module | Workspace | Dependencies |
|-------|--------|-----------|--------------|
| **1** | Shared Types | `/shared/` | None |
| **2** | Database & Tenants | `/backend/prisma/`, `/backend/src/tenants/` | Agent 1 |
| **3** | Products & Menu | `/backend/src/products/` | Agent 1, 2 |
| **4** | Orders | `/backend/src/orders/` | Agent 1, 2, 3 |
| **5** | Payments (Adyen) | `/backend/src/payments/` | Agent 1, 2, 4 |
| **6** | Frontend Customer | `/frontend/app/` | Agent 1, 2, 3, 4, 5 |
| **7** | Delivery (Wolt) | `/backend/src/delivery/` | Agent 1, 2, 4, 5 |
| **8** | Admin Dashboard | `/frontend/app/admin/` | Agent 1, 4 |
| **9** | Order Tracking | `/frontend/app/track/` | Agent 1, 4, 7 |
| **10** | DevOps & Deploy | `/.github/`, configs | All agents |

## 🔄 Handoff Protocol

Each agent creates a completion file when done:

```bash
# Agent 1
/shared/AGENT-1-COMPLETE.md

# Agent 2
/backend/AGENT-2-COMPLETE.md

# Agent 3
/backend/src/products/AGENT-3-COMPLETE.md

# And so on...
```

**Check for these files to know when to start dependent agents.**

## 📊 Progress Tracking

Create a simple checklist:

```markdown
## Development Progress

### Week 1
- [ ] Agent 1: Shared Types
- [ ] Agent 2: Database & Tenants
- [ ] Agent 10: CI/CD Setup

### Week 2
- [ ] Agent 3: Products & Menu
- [ ] Agent 4: Orders
- [ ] Agent 6: Frontend (menu)

### Week 3
- [ ] Agent 5: Payments
- [ ] Agent 7: Delivery
- [ ] Agent 6: Frontend (checkout)

### Week 4
- [ ] Agent 8: Admin Dashboard
- [ ] Agent 9: Order Tracking
- [ ] Agent 10: Production Deploy
```

## 🎓 Tips for Success

### 1. Clear Communication
Each agent should:
- Read their full context before starting
- Create completion files when done
- Update CHANGELOG.md with changes

### 2. Git Workflow
```bash
# Each agent works on their branch
git checkout -b feat/agent-1-shared-types
git checkout -b feat/agent-2-database
# etc.
```

### 3. Testing
Each agent should test their work before marking complete:
```bash
# Backend agents
npm run build
npm test

# Frontend agents
npm run type-check
npm run lint
```

### 4. Integration
After all agents complete, test the full flow:
1. Start backend: `cd backend && npm run start:dev`
2. Start frontend: `cd frontend && npm run dev`
3. Test order flow end-to-end
4. Fix any integration issues

## 🚨 Troubleshooting

### "Agent X needs Agent Y, but Y isn't done"
- Wait for Agent Y to create their completion file
- Or review their current progress
- Don't skip dependencies!

### "Two agents modified the same file"
- Shouldn't happen if following workspace rules
- Each agent has exclusive folder access
- Merge conflicts only in shared/ (rare)

### "Can't find completion file"
- Agent may still be working
- Check the specified folder
- Ask agent to create it when done

## 📈 Expected Timeline

| Week | Agents Active | Deliverables |
|------|---------------|--------------|
| 1 | 1, 2, 10 | Types, DB, CI/CD |
| 2 | 3, 4, 6 | Products, Orders, Menu |
| 3 | 5, 6, 7 | Payments, Delivery, Checkout |
| 4 | 6, 8, 9, 10 | Dashboard, Tracking, Deploy |

**Total: 4 weeks to MVP** 🚀

## 🎉 Launch Checklist

Before going live:
- [ ] All 10 agents complete
- [ ] Integration tests pass
- [ ] Environment variables configured
- [ ] Domain DNS configured
- [ ] Payment provider (Adyen) live keys
- [ ] Wolt Drive production keys
- [ ] Monitoring (Sentry) active
- [ ] Backups enabled
- [ ] Test order end-to-end in production

## 📞 Support

Each agent context includes:
- ✅ Full context (what to build)
- ✅ Exact files to create
- ✅ Code examples
- ✅ Dependencies
- ✅ Testing instructions
- ✅ Completion criteria

If stuck, review the agent's context file again!

---

**Ready?** Start with Agent 1! 🚀

Open `AGENT-01-SHARED-TYPES.md`, copy it into a new Cursor chat, and BEGIN!


