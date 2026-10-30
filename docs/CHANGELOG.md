# Life Quest changelog

Version numbers follow the build sessions. The version shows in the app under Settings, with the build commit and date.

## 0.9.0: S9 skill cards and achievements (current)
- Stats tab now has three sections: Overview, Cards and Achievements.
- Skill cards: a collection of the cards you have earned (day 7, 21, 30 and 66, from common to mythic), shown as full cards with your crest, rank, class title, top stat, name, cycle and date. Tap one to see it large and download it as a PNG image. Cards you have not earned yet show what is needed.
- New cards remember the rank you had when you earned them. Cards earned before this version show your top stat emblem instead.
- Achievements: 36 achievements across Quests, Streaks, Ranks, Growth, Focus, Journal and Collection, each with a progress bar. A banner appears when one unlocks. Once earned, an achievement is never removed. Progress you already had is credited quietly when you update.

## 0.8.5: S8.5 companion and Library
- Companion: a tortoise that carries a shield-shaped shell. It starts as an egg and hatches at Iron III. Its whole body changes shape four times (baby, young from Silver IV, adult from Platinum IV, legend from Master), and its shell takes your tier colours.
- Every division adds a chevron to its shell. From Master up it also grows every 100 points, with sparkles.
- It idles and blinks, hops when you finish a quest, looks happy when everything due is done, and falls asleep (with Zzz) in the evening if your streak still needs a quest. A bar shows how close it is to its next growth.
- New Library tab (fifth tab): every mood check, journal entry and paper-journal photo, grouped by month, with search, Written and Photos filters, a 30-day mood strip and counts.
- The Journal tab is now for writing today; it links to the Library for older entries.

## 0.8.0: S8 analytics
- New Stats tab (fourth tab in the bottom bar).
- Stat radar: your five stat levels as a shape, with a row for each stat showing its emblem, level, XP and progress; tags mark the boss stat and your lagging stat.
- 66-day heatmap for the current cycle: all done, some done, missed, rest day, today, and days ahead. Boss week is underlined and skill card days carry a diamond. Tap any day for details. It restarts if a Hard Mode restart starts a new cycle.
- Cycle summary (perfect, partial, missed and rest days, and the percentage of perfect days) and all-time totals (quests completed, best streak, focus minutes and sessions, journal days, active days, skill cards).

## 0.7.0: S7 Hard Mode polish
- Hard Mode panel on the Quests tab: which quests would cost XP and how much, a warning before the 3-empty-day cycle restart, and a warning when a stat is within 2 days of losing a level.
- Turning Hard Mode off now takes effect when today closes, so a penalty cannot be dodged by flipping the switch. Turning it on is immediate, and flipping the switch back cancels a pending turn-off.
- Turning Hard Mode on asks you to confirm and lists the rules first.
- "Hard Mode report: yesterday" card explains what was taken (XP and which quests, stat levels lost, cycle restart) and can be dismissed.
- Day logs now record which quests were missed and whether a restart happened.

## 0.6.5: S6.5 routine quests and quiz retake
- Routine quests: a quest can repeat every N days or on set weekdays. Quests that are not due today are hidden; the quest list shows "Coming up" for the next ones.
- A missed due day stays open for one extra day ("Due yesterday: last chance today"), then counts as missed. If the next day is also a due day there is no extra day.
- Rest days: a day with quests but none due keeps your streak, is not counted as missed, and counts toward skill cards. The list shows a "Rest day" card.
- Hard Mode penalties, the penalty preview, reminders and the boss chest all follow the schedule (the chest only needs the boss quests that were actually due).
- Add-quest forms (in the app and in the quiz plan) have a "How often" picker. Settings shows each quest's schedule.
- Retake the quiz from Settings: stat levels only go up, XP and rank stay, the boss stat is re-picked, and you can optionally replace your quests with a new plan (the ramp starts today).
- Weekday schedules use the weekday of your first day, stored with the save.

## 0.6.0: S6 focus, mood and journal
- Bottom tab bar: Quests, Focus, Journal.
- Focus Forge: a timer ring with 15, 25, 45 and 60 minute presets plus your focus quest's current target. Sessions of 10 minutes or more earn 1.2 Focus XP a minute (up to 120 base XP a day, scaled by your streak multiplier). It keeps running while you use other tabs, and finishing it plays a chime and vibrates.
- After a session you can complete your focus quest in one tap, or start a 5 minute break.
- Ambient sound (soft brown noise) during focus sessions; follows the Sound effects switch.
- Mood tap (5 faces): the first mood each day earns 5 Wisdom XP.
- Journal: a typed entry of 20 or more characters earns 15 Wisdom XP once a day.
- Paper journal: take a photo of your page; it is shrunk and saved on the device, counts like a written entry (15 Wisdom XP), and shows in past entries. Photos are not part of the save file.
- Rewards from the timer and journal can trigger rank promotions and level-up banners.
- Library fix: added the missing `workbox-window` dependency that broke the S5 build.

## 0.5.5: progressive quests
- Measurable quests (minutes, pages, steps, reps, lines) now grow: +25% every 5 completed days. Missed days only pause the count.
- Targets round to tidy numbers and are capped near 2x (for example 60 min becomes 75, 95, then 115). Each quest can also have its own maximum.
- XP grows with the target (1.25x, 1.56x, 1.95x). A level-up shows a banner, and each quest shows "+25% after N more days".
- About 20 library quests are measurable (Workout, Step goal, Read a book, Study, Focus session, Deep work, Meditate and more); yes-or-no quests stay as they are.
- Your own quests can track an amount. Settings has a new "Your quests" list with a growth switch and Remove for each quest.
- Boss-week double XP and the target scaling now show in the projected XP on each quest.

## 0.5.0: S5 offline, updates, install, reminders
- "Ready to use offline" message the first time the app is cached.
- Update prompt: a banner with a Reload button when a new version is waiting (checked every hour while open).
- Install button in Settings (Android and desktop Chrome and Brave), a how-to for iPhone, and an "Installed" state.
- Reminders: Morning Kickoff and Evening Review, off by default, times at 08:00 and 20:00 (editable). Sent while the app is open or running; otherwise an in-app banner. Test notification button.
- Sound effects and vibration switches.
- Version, build commit and date shown in Settings.

## 0.4.5: S4.5 ranks and promotions
- Ladder is 31 steps: Iron to Diamond with divisions IV to I, then Master, Grandmaster, Challenger on one running point total that carries over (10 XP per point; Grandmaster at 425 pts, Challenger at 855 pts).
- Division promotion scene (chevron slams in) and tier promotion scene (shield breaks and a new one forms), with sound.

## 0.4.0: S4 onboarding
- 15-question habit quiz, starting stat levels, quest-count and time-of-day setup, plan review with swap, remove and custom quests.
- 66-day ramp: easy quests day 1, medium day 8, hard day 15.
- Boss week on days 15 to 21: weakest stat gives 2x XP, plus a 250 XP chest for clearing every one of its quests each day.

## 0.3.5: art integration
- Renamed to Life Quest. Navy pastel palette, Press Start 2P labels.
- Pixel winged-shield crests for ten tiers, five stat emblems (sword, book, target, pillar, moon), new app icons.

## 0.3.0: S3 the Hub
- Dashboard with rank crest, XP bar, streak, cycle day, multiplier, stat strip, quests by time of day, particle bursts, settings and add-quest sheets.

## 0.2.0: S2 saving
- Local saving (IndexedDB), real-date day tracking with catch-up for missed days, export and import with validation.

## 0.1.0: S1 game engine
- XP, streaks, multiplier, Hard Mode penalties, stat decay, skill card milestones, 66-day cycle.

## 0.0.1: S0 scaffold
- Monorepo, design tokens, PWA shell, GitHub Pages deploy.
