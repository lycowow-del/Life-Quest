# Life Arc 66 handoff

## State after S3
- pnpm monorepo: `apps/web` (Vite, React, TS, Tailwind, vite-plugin-pwa), `packages/core` (pure TS engine, tested), `packages/ui` (Tailwind preset).
- Pages base path is `/life-arc-66/`. CI on PRs; deploy on push to `main`.
- New deps in `apps/web`: `framer-motion`, `lucide-react` (plus `zustand`, `localforage` from S2). Run `pnpm install` and commit `pnpm-lock.yaml`.

## packages/core
- S1 engine (constants, types, xp, engine), S2 (dates, sync, serialize).
- S3: `selectors.ts` (`activeHabits`, `groupByTimeOfDay`, `completedToday`, `todayProgress`, `statSummary`, `rankProgress`, `penaltyAtRisk`) and `starters.ts` (`STARTER_HABITS`, `HabitInput`).

## apps/web
- `App.tsx`: hydrates the store, syncs the date, shows `Welcome` (no save) or `Hub`.
- `components/`: `Hub` (screen), `PlayerHeader` (rank crest, level, XP bar, streak, cycle day, multiplier, HARD badge), `RankCrest` (SVG per rank), `StatStrip` (5 stat levels), `QuestList` + `QuestRow` (grouped Morning/Afternoon/Evening, projected or earned XP), `Burst` (Framer Motion particles + floating XP, respects reduced motion), `Toast` (level, rank, skill card), `Sheet`, `AddQuestSheet`, `SettingsSheet` (Hard Mode, export/import, reset, dev skip day), `ImportButton`, `Welcome`.
- `lib/theme.ts`: stat colors/labels, rank colors, time labels.
- Store: `addHabits` added so starter packs save in one write.

## Design notes
- Stat colors avoid the semantic palette: emerald means completed, crimson means penalty. Stats use orange, cyan, violet, yellow, pink.
- Hard Mode shows the XP currently at risk at the bottom of the quest list (matches `endDay`).

## Known limits
- Skill cards unlock and toast, but the collection screen and SVG export come in S9.
- Quest editing (rename, archive UI) is not built yet; archive exists in the store.
- Onboarding quiz replaces the starter pack in S4. Focus timer and journal in S6, heatmap and radar in S8.
- Dev "Skip to next day" must be removed before v1.0.

## Next: S4 (Onboarding)
6-step readiness quiz scoring baseline per stat, roadmap generator (21-day ramp from Easy to Hard, boss week for the weakest stat), quest categories, replaces `Welcome` start flow.
