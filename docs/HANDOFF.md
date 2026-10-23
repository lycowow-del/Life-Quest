# Life Quest handoff

## Current version: 0.6.0 (S6). See docs/CHANGELOG.md for the history.

## 0.6.0 changes (focus, mood, journal)
- Core: `activity.ts` (`completeFocusSession`, `logMood`, `saveJournalEntry`, `focusQuest`, `suggestedFocusMinutes`, `todayFocus`, `todayJournal`) and `reward.ts` (`grantXp` returns a `Reward` with rank and level changes). `GameState` gains optional `journal` and `focus` records (validated in `serialize.ts`). Constants: `FOCUS_XP_PER_MIN` 1.2, `FOCUS_MIN_MINUTES` 10, `FOCUS_DAILY_XP_CAP` 120, `MOOD_XP` 5, `JOURNAL_XP` 15.
- Web: `store/focusTimer.ts` (clock-based timer, runs across tabs), `lib/focusAudio.ts` (ambient and chimes), `lib/photos.ts` (journal photos in their own IndexedDB `life-quest-photos`, shrunk to 1600 px JPEG), `components/{BottomNav,FocusScreen,JournalScreen,PhotoThumb}.tsx`. `Hub.tsx` owns the tabs, the timer ticker, ambient control and reward handling.
- Reset all data also clears photos. Settings notes that photos are not in the save file.
- Dependency check run before packaging: every imported library is in package.json (this caught nothing new; the S5 failure was a missing `workbox-window`, now fixed).

## Limits
- Timer does not survive closing the app. Photos are not in export and would be lost if browser data is cleared.
- The paper journal is photos only; there is no handwriting-to-text.


## 0.5.5 changes (progressive quests)
- `Habit.target` (`QuestTarget`): base amount, unit, rounding step, optional max, `completions`, `frozen`. Old saves load fine (the field is optional and validated when present).
- `packages/core/src/progression.ts`: level = min(maxLevel, floor(completions / 5)); amount = base x 1.25^level rounded; XP scale = 1.25^level; max level 3 (about 1.95x) or lower if the quest's own `max` is hit. `questLabel`, `formatAmount`, `daysToNextLevel`, `customTarget`, `setProgressionFrozen`.
- `completeQuest` pays XP at the level held before the completion, increments `completions` (unless frozen), and returns `questLevelUp` when a level is gained. `questXp` takes a fifth argument, the target scale.
- Library quests in `onboarding.ts` now carry targets where measurable (names no longer contain amounts).
- UI: `QuestRow` shows the label and next-level hint; `TargetFields` in both add forms; Settings "Your quests" (growth switch, Remove); Hub toast "Quest level up".
- Pacing check (66 perfect days, default quiz plan): 5 quests end at about 24,850 XP (Gold II) with growth, versus 14,650 (Silver II) without it; 3 quests reach Silver I and 8 quests reach Platinum I. No change to the rank curve was needed.
- Tests: 89 core tests plus 6 pixel tests (95 in total).


## S5 changes (offline, updates, install, reminders)
- `vite.config.ts`: `registerType: 'prompt'`, `workbox.importScripts: ['sw-extras.js']`, and build info (`__APP_VERSION__`, `__BUILD_SHA__` from GITHUB_SHA, `__BUILD_DATE__`).
- `public/sw-extras.js` adds a `notificationclick` handler so tapping a reminder opens the app.
- `components/PwaBanner.tsx` uses `useRegisterSW` from `virtual:pwa-register/react` (types come from `vite-plugin-pwa/react` in tsconfig): offline-ready toast, Reload banner, hourly update check.
- `lib/pwa/useInstall.ts` captures `beforeinstallprompt` at module load; Settings shows Install app, iPhone instructions, or an installed state.
- Reminders: pure logic in `packages/core/src/reminders.ts` (`dueNotifications`, `reminderMessage`, `reminderBanner`; a notification only fires within 15 minutes of the set time, once per day; Morning needs nothing done yet, Evening needs unfinished quests). `lib/useReminders.ts` checks every 30 s and on returning to the app, and sends through the service worker (`lib/notify.ts`). `components/ReminderBanner.tsx` shows the in-app banner when the time has passed.
- `store/settingsStore.ts` (localStorage key `lq:settings`): reminders, lastFired, sound, vibrate.
- Settings sheet: Hard Mode, Reminders (switch plus time each, permission help, test notification), sound and vibration, Install, export and import, dev tools, reset, version line.
- Root `eslint.config.js` now ignores `apps/web/public/**`.

## Limits
- A phone cannot wake a closed web app, so reminders do not fire with the app fully closed. Options later: a small push server (Brave needs "Use Google Services for Push Messaging" turned on in its privacy settings) or an APK wrapper with native scheduling.
- The service worker and install flow could not be run in the build environment; verify on a device.
- No quiz retake, no skill card collection screen, no pet yet. Dev "Skip to next day" must be removed before v1.0.

## Next: S6.5 (routine quests and quiz retake)
Quests due every N days or on set weekdays (rest days must not break streaks; settle missed-day rules first), and retaking the quiz from Settings. Then S7 Hard Mode polish, S8 heatmap and radar, S8.5 pet, S9 skill cards and achievements, S10 launch.

## S4.5 changes (rank ladder and promotion scenes)
- **Ladder is 31 steps.** Iron to Diamond have divisions IV to I (steps 0-27). **Master (28), Grandmaster (29), Challenger (30) have no divisions** and use **points**: 10 XP each, one running total from the start of Master that carries over between tiers and never resets. Grandmaster begins at 425 pts, Challenger at 855 pts (`APEX_TIER_POINTS`). No ceiling.
- XP to start of step n (n up to Master) is `355 * n^1.6` rounded to 50. Apex thresholds: Master 73,400 XP, Grandmaster 77,650, Challenger 81,950. 66 perfect days still end near Gold II.
- `rankInfo` now returns `points` for Master and above, plus `pointsToNext` for Master and Grandmaster. Header shows "N pts to Grandmaster".
- **Promotion scenes** (`components/PromotionScene.tsx`): a division-up slams the new chevron into the shield (layer from `chevronPixels`, shockwave, shake, particles); a tier-up breaks the old shield and forms the new one under rotating rays. Reduced-motion phones get a short fade. `lib/sound.ts` adds a thud and arpeggio. Hub shows the scene on any rank-up; level-up and skill-card toasts wait until it closes.
- Points gained inside an apex tier do not trigger a scene; only a tier change does.

## State after S4 (onboarding)
- First launch: Welcome, then Onboarding (name, 15-question quiz, plan setup, review), then the Hub. "Skip the quiz" still starts an empty game with the starter pack.
- Internal ids stay `life-arc-66` (IndexedDB name, save-file `app` field) so older saves keep working. Old saves load fine: new profile fields are optional.

## Quiz and starting build (packages/core/src/onboarding.ts)
- 15 multiple-choice questions about real habits, 3 per stat, scored 0-3 each, so 0-9 per stat.
- Score maps to a starting stat level 0-4 (`startingStatXp`). Total XP and rank still start at 0 / Iron IV. The class title (e.g. Monk) shows immediately from the stat levels.
- Weakest stat (ties: STR, INT, FOC, DIS, WIS order) becomes the **boss stat**.

## Roadmap generator
- Player picks 3-8 daily quests and the times of day they are free.
- Composition: easy about 40%, hard about 25%, medium the rest. Weakest stat gets at least 2 quests; slots cycle weakest to strongest; harder quests go to stronger stats.
- Ramp by unlock day: easy day 1, medium day 8, hard day 15 (`RAMP_UNLOCK_DAY`). Stored as `Habit.createdOnDay`. Locked quests are hidden, cannot be completed, and cannot cost Hard Mode penalties.
- 45-quest library (`QUEST_LIBRARY`): 3 per stat per difficulty. Review screen lets the player swap, remove, or add own quests (own quests are active from day 1).

## Boss week (cycle days 15-21)
- Boss stat quests give 2x XP (`BOSS_XP_MULT`). Each receipt has `boss: true`.
- If every boss-stat quest is completed on every one of the 7 days, a 250 XP chest (`BOSS_CHEST_XP`) pays when day 21 closes, once per cycle (`bossChestClaimedCycle`).
- Hub shows a boss banner during the week, a heads-up in the last 7 days before it, and a chest line after.
- Selectors: `bossWeekStatus`, `upcomingUnlocks`; `activeHabits` now excludes locked quests.

## Not done yet
- Sound has no mute toggle yet (add to Settings).
- Retaking the quiz from Settings. Quiz answers are not saved if the app is closed mid-quiz.
- Pet companion, skill card collection (S9), offline install and reminders (S5), Focus timer and journal (S6), heatmap and radar (S8).
- Dev "Skip to next day" must be removed before v1.0.

## Next: S5 (offline and reminders)
Service worker verification and update prompt, install prompt, local reminders (Morning Kickoff, Evening Review), airplane-mode test.
