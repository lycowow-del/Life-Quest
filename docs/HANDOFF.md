# Life Quest handoff

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
- Retaking the quiz from Settings. Quiz answers are not saved if the app is closed mid-quiz.
- Pet companion, skill card collection (S9), offline install and reminders (S5), Focus timer and journal (S6), heatmap and radar (S8).
- Dev "Skip to next day" must be removed before v1.0.

## Next: S5 (offline and reminders)
Service worker verification and update prompt, install prompt, local reminders (Morning Kickoff, Evening Review), airplane-mode test.
