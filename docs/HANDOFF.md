# Life Quest handoff

## State after the art integration session
- App renamed **Life Quest** (title, manifest, header, welcome). Internal ids stay `life-arc-66` on purpose: the IndexedDB name and save-file `app` field are unchanged so existing saves keep working.
- Palette is navy pastel (`packages/ui/tailwind-preset.js`; token names `arc-*` kept, values changed). Pixel font: Press Start 2P (`font-pixel`).
- pnpm monorepo: `apps/web` (Vite, React, TS, Tailwind, vite-plugin-pwa), `packages/core` (pure TS engine, tested), `packages/ui` (Tailwind preset).

## Rank ladder (34 steps)
- Iron, Bronze, Silver, Gold, Platinum, Emerald, Diamond each have divisions IV to I (steps 0-27). Master (28) and Grandmaster (29) have none. Challenger has IV to I (steps 30-33).
- After **Challenger I** the ladder ends and XP becomes points (`POINT_XP = 10` XP per point), shown as "Challenger I · N pts".
- Step n starts at `355 * n^1.6` XP rounded to 50 (`RANK_CURVE` in `constants.ts`). 66 perfect days with the 8 starter quests earn about 26,954 XP, which is Gold II (Gold reached around day 52).
- API: `rankInfo(xp)` returns step, tier, division, points, label, ratio, xpToNext, nextLabel. `completeQuest` returns `rankedUp` (any promotion), `tierUp`, and `newRank`.
- Old E to S ranks are gone. Rank is derived from XP, so saves need no migration.

## Pixel art (apps/web/src/lib/pixel)
- `crest.ts` draws the 64x64 winged-shield crest per tier: more feathers and wider wings, trim, gems, engraving inside the shield, crowns, sparkles. Division chevrons (1 to 4) sit under the shield.
- `emblem.ts` draws the five stat emblems: sword (STR), book (INT), target (FOC), pillar (DIS), moon and star (WIS).
- Sprites render once to data URLs (`sprites.ts`), shown through `PixelSprite` with `image-rendering: pixelated`. Components: `RankCrest`, `StatEmblem`.
- PWA icons were regenerated from the Gold crest.

## Known limits and next steps
- Pet companion (egg, hatchling, grown) is designed in a preview but not in the app yet.
- Skill card collection screen and SVG export: S9. Dev "Skip to next day" must be removed before v1.0.
- Onboarding quiz and roadmap generator: S4 (replaces the starter pack).
- Offline install and reminders: S5. Focus timer and journal: S6. Heatmap and radar: S8.
