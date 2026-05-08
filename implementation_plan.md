# Implementation Plan - Vamos Player App Evolution (Competitive & GUI)

This plan outlines the steps to transform the **Vamos Player App** into a high-engagement, competitive platform with premium visuals.

## Phase 1: Visual Identity & "Wow" Factor (GUI/UX)
**Goal:** Make the app feel premium and provide instant visual feedback for progression.

### 1.1 Dynamic Tier Cards
- [x] Create a new `TierCard` component in `vamos-player-app`.
- [x] Implement unique CSS styles for each tier:
    - **Bronze:** Simple, clean, dark slate.
    - **Silver:** Metallic gradient with subtle reflection.
    - **Gold:** Golden glow with "shimmer" animation.
    - **Platinum:** Holographic/Iridescent background with "pulsing" aura.
- [x] Update `DiscoveryHeader` to use this new card.

### 1.2 XP Progress & Level Up Visuals
- [x] Add a visible XP bar to the Dashboard showing `currentXP / nextLevelXP`.
- [x] Create a `LevelUpModal` with high-impact animations (confetti, glowing text).
- [x] Implement logic to detect level changes and trigger the modal.

### 1.3 Skeleton Loading & Micro-interactions
- [x] Replace empty states with Skeleton Screen placeholders.
- [x] Add Haptic Feedback (vibration) when a challenge is accepted or won.

---

## Phase 2: Competitive Depth (Social & Stats)
**Goal:** Increase social friction and prestige through statistics and achievements.

### 2.1 Achievement (Medal) Room
- [x] **Backend:** Define a list of `Badge` constants (ID, Name, Description, Icon).
- [x] **Frontend:** Create an `AchievementsScreen` (Integrated in Profile) showing medals.
- [ ] **Logic:** Implement "Medal Earned" notifications.

### 2.2 Head-to-Head (H2H) Stats
- [x] **Backend:** Create a new endpoint `GET /player/:id/h2h-detail`.
- [x] **Logic:** Calculate Win/Loss, score history, and total stakes between two players.
- [x] **Frontend:** Add a `RivalComparison` modal on player leaderboard.

### 2.3 Arena Live Feed (Activity Wall)
- [x] **Backend:** Emit socket events for "King Ascended", "Big Win", or "Level Up".
- [x] **Frontend:** Implement a scrolling "Live Ticker" on the Arena screen.

---

## Phase 3: Engagement & Retention (Missions & Seasons)
**Goal:** Provide daily/monthly reasons to open the app.

### 3.1 Daily Quests (Missions)
- [x] **Backend:** Create a `Quest` model (Daily Match, Win Streak, etc.).
- [x] **Logic:** Track progress of active quests and award bonus XP/Points upon completion.
- [x] **Frontend:** Add a `QuestCard` section on the Dashboard (Connected to API).

### 3.2 Seasonal Rankings
- [ ] Implement a "Monthly Leaderboard" with a countdown timer.
- [ ] Store "Hall of Fame" records for past season winners.

---

## Technical TODO List

### 🟢 Backend (vamos-pos-backend)
1. [x] **Service:** Update `LoyaltyService` to handle Quest progress tracking.
2. [ ] **Service:** Implement `AchievementService` to auto-award badges based on milestones.
3. [ ] **Socket:** Add more granular socket events for global announcements.
4. [ ] **Controller:** Add H2H stats endpoint.

### 🔵 Frontend (vamos-player-app)
1. [x] **Components:** Create `TierCard`, `XPProgressBar`, `AchievementBadge`, `QuestCard`.
2. [x] **Screens:** Profile Badge Collection, Rival Comparison.
3. [x] **Modals:** Create `LevelUpModal`, `RivalComparisonModal`.
4. [ ] **UX:** Integrate `Web Vibration API` for critical actions.

---

> [!TIP]
> **Aesthetic Advice:** Use `framer-motion` for all transitions. Platinum players should feel like "VIPs" every time they open the app with unique splash colors.
