# Life Quest changelog

Version numbers follow the build sessions. The version shows in the app under Settings, with the build commit and date.

## 0.5.5: progressive quests (current)
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
