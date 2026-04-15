# Daily Challenge App - Project Memory

## Current Status: FULLY DEPLOYED & OPERATIONAL ✓

### Live Application

- **Production URL (Primary):** Vercel (auto-deployed from GitHub)
- **Production URL (Backup):** https://daily-challenge-app-mswn.onrender.com
- **GitHub Repo:** https://github.com/bnshaad/daily-challenge-app
- **Status:** Live, tested, and ready for users
- **Last Updated:** 2026-04-15

---

## What We Built

A production-ready full-stack daily challenge application:

- **10 Questions Per Day:** Each user gets 10 shuffled questions daily
- **Deterministic Shuffle:** Same user sees same order on refresh (seeded by userId + date)
- **Modern Dark UI:** Purple gradient theme with animations
- **Auth System:** Firebase Auth (Email/Password + Google Sign-In)
- **Progress Tracking:** Visual progress bar, score display, results screen
- **Share Feature:** Wordle-style emoji results for social sharing
- **Responsive:** Works on desktop and mobile

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| Backend | Node.js + Express (Serverless via Vercel) |
| Auth | Firebase Authentication |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel (primary), Render (backup) |
| Fonts | Syne (display), DM Sans (body) |

---

## Architecture

```
Frontend (Browser)
   ↓
Firebase Auth (login / signup / Google)
   ↓
Your API (/api/*)
   ↓
Supabase Database
```

Hybrid setup: Firebase for auth, Supabase for data — no migration needed.

---

## File Structure

```
daily-challenge-app/
├── api/
│   └── index.js          # Vercel serverless entrypoint
├── server/
│   ├── index.js          # Express app (exports app)
│   ├── package.json      # Dependencies
│   └── .env             # Supabase credentials (not in git)
├── public/
│   ├── index.html       # UI + Firebase scripts
│   ├── style.css        # Dark theme, CSS variables, animations
│   └── app.js           # Auth, questions, results, share logic
├── vercel.json           # Routing config
└── docs/
    └── PROJECT_MEMORY.md # This file
```

---

## Vercel Configuration

**vercel.json**
```json
{
  "version": 2,
  "builds": [
    { "src": "api/index.js", "use": "@vercel/node" },
    { "src": "public/**", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.js" },
    { "src": "/(.*)", "dest": "/public/$1" }
  ]
}
```

---

## Backend Changes (Important)

**server/index.js** exports the Express app for Vercel compatibility:

```js
module.exports = app;

// Conditional start — works locally and on Vercel
if (require.main === module) {
    app.listen(PORT, () => {
        console.log('Server running at http://localhost:' + PORT);
    });
}
```

---

## Authentication

**Migrated from Supabase Auth → Firebase Auth**

| Method | Status |
|--------|--------|
| Email/Password | ✅ |
| Google Sign-In | ✅ |

**Firebase scripts added to index.html:**
```html
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
```

**Critical fix — user ID:**
```js
// ❌ Old (Supabase)
currentUser.id

// ✅ New (Firebase)
currentUser.uid
```
Updated in: `loadSession()`, `submitAnswer()`, `loadScore()`, streak APIs.

**Google Sign-In:**
```js
async function googleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    currentUser = result.user;
    showApp();
}
```

---

## API Endpoints

```
GET    /api/session/:userId       # Get 10 shuffled questions
POST   /api/submit                # Submit answer
GET    /api/score/:userId         # Get user stats
GET    /api/streak/:userId        # Get streak info
POST   /api/streak/:userId        # Update streak
GET    /api/leaderboard           # Get top scores
GET    /api/history/:userId       # Get submission history
```

---

## Database Schema (Supabase — unchanged)

### questions
- id (uuid, pk)
- question_text (text)
- options (jsonb array)
- correct_answer (text)
- date (date)
- difficulty (text: easy/medium/hard)
- created_at (timestamp)

### submissions
- id (uuid, pk)
- user_id (uuid, fk)
- question_id (uuid, fk)
- selected_answer (text)
- is_correct (boolean)
- submitted_at (timestamp)

### streaks
- id (uuid, pk)
- user_id (uuid, fk)
- current_streak (int)
- longest_streak (int)
- last_answered_date (date)
- updated_at (timestamp)

---

## Implemented Features

### Core Functionality ✓
- [x] Firebase Auth (Email + Google)
- [x] 10 daily questions per user (shuffled)
- [x] One question at a time with progress bar
- [x] Answer submission with immediate feedback
- [x] Results screen (score, accuracy, breakdown)
- [x] Share to clipboard (Wordle-style)
- [x] Logout functionality

### UI/UX ✓
- [x] Dark theme (#08080e background)
- [x] Purple accent colors (#a78bfa)
- [x] Animated background grid
- [x] Rotating hero words (Daily/Sharp/Earned/Yours/Now)
- [x] Smooth transitions (fadeUp, slides)
- [x] Progress bar with fill animation
- [x] Toast notifications (success/error)
- [x] Loading spinner
- [x] Responsive mobile layout
- [x] Google Sign-In button styled properly

### Security ✓
- [x] Correct answer not exposed in API response
- [x] Environment variables for credentials
- [x] RLS policies on Supabase tables

---

## Design Tokens

```css
:root {
  --bg: #08080e;
  --surface: #111118;
  --surface-2: #18181f;
  --primary: #a78bfa;
  --accent: #34d399;    /* correct */
  --danger: #f87171;    /* wrong */
  --text-1: #f0f0f6;
  --text-2: #9494ab;
  --text-3: #5a5a72;

  --font-display: 'Syne', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  --transition: 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## Deployment Workflow

```bash
cd ~/daily-challenge-app
git add .
git commit -m "Description of changes"
git push origin master
# Vercel auto-deploys in ~1-2 minutes
```

---

## Render Configuration (Backup)

| Setting | Value |
|---------|-------|
| Runtime | Node |
| Build Command | `cd server && npm install` |
| Start Command | `cd server && npm start` |
| Environment | SUPABASE_URL, SUPABASE_ANON_KEY, PORT=3000 |

---

## Known Issues & Fixes

| Issue | Status | Fix |
|-------|--------|-----|
| Vercel 404 | ✅ Fixed | Added proper `vercel.json` routes |
| Firebase Authorized Domain | ⚠️ Required | Add `your-app.vercel.app` + `localhost` in Firebase → Auth → Settings → Authorized Domains |
| Email verification not enforced | ⚠️ Optional | Add `emailVerified` check in frontend |
| Correct answer not showing | ✅ Fixed | Use `sessionData.questions[currentIndex].correct_answer` |

---

## Completed Journey

1. ✓ Local setup with Node + Express
2. ✓ Supabase database + auth
3. ✓ Basic question display
4. ✓ Answer submission + scoring
5. ✓ Difficulty levels (easy/medium/hard)
6. ✓ CSV import for bulk questions
7. ✓ 10-question session system
8. ✓ Deterministic shuffle algorithm
9. ✓ Modern dark UI redesign
10. ✓ Animations + toast notifications
11. ✓ GitHub repository
12. ✓ Render deployment
13. ✓ Migrated auth to Firebase (Email + Google)
14. ✓ Migrated hosting to Vercel (serverless)
15. ✓ Live production URL

---

## Notes

- **Vercel:** Auto-deploys on every `git push`
- **Render (backup):** App sleeps after 15 min inactivity (wakes on request)
- **Database:** Questions must have `date` matching current day
- **Shuffling:** Seeded with `userId + date` for consistent order per user
- **Share format:** `"Daily Challenge YYYY-MM-DD: X/10 ✅❌✅..."`
- **Do NOT migrate database to Firebase** — Supabase is working fine

---

## Future Enhancements (Optional)

- [ ] Streak system frontend integration
- [ ] Leaderboard page
- [ ] Email verification enforcement
- [ ] Question categories/tags
- [ ] Timed mode (countdown per question)
- [ ] Badge/achievement system
- [ ] Friends/competition mode
- [ ] Push notifications
- [ ] Analytics

---

**Last Updated:** 2026-04-15
**Status:** PRODUCTION READY ✅ — Live on Vercel, Firebase Auth, Supabase DB