import { ArrowLeft, RefreshCw, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import {
  BOSS_CHEST_XP,
  BOSS_END_DAY,
  BOSS_START_DAY,
  BOSS_XP_MULT,
  QUEST_COUNT_DEFAULT,
  QUEST_COUNT_MAX,
  QUEST_COUNT_MIN,
  QUIZ,
  QUIZ_LENGTH,
  STAT_KEYS,
  XP_VALUES,
  alternatives,
  archetype,
  buildRoadmap,
  customTarget,
  formatAmount,
  phaseSummary,
  scoreQuiz,
  startingStatXp,
  statLevel,
  weakestStat,
  type Difficulty,
  type PlannedHabit,
  type StatKey,
  type TargetUnit,
  type TimeOfDay,
} from '@la66/core';
import { STAT_META, TIME_LABEL } from '../lib/theme';
import { useGame } from '../store/gameStore';
import { Choice } from './AddQuestSheet';
import { StatEmblem } from './StatEmblem';
import { TargetFields } from './TargetFields';

type Phase = 'name' | 'quiz' | 'setup' | 'review';
const TIMES: TimeOfDay[] = ['morning', 'afternoon', 'evening'];

function Shell({ children, onBack, progress }: { children: ReactNode; onBack: () => void; progress?: number }) {
  return (
    <main
      className="mx-auto min-h-screen max-w-md bg-obsidian px-5 font-display"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)' }}
    >
      <div className="mb-5 flex items-center gap-3">
        <button type="button" onClick={onBack} aria-label="Back" className="rounded-xl p-2 text-slate-300 active:bg-slate-800">
          <ArrowLeft size={22} />
        </button>
        {progress !== undefined && (
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800"
            role="progressbar"
            aria-label="Quiz progress"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-gradient-to-r from-arc-violet to-arc-cyan transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
        )}
      </div>
      {children}
    </main>
  );
}

const primary = 'w-full rounded-xl bg-arc-violet py-3 font-bold text-obsidian shadow-glow-violet disabled:opacity-40';

export function Onboarding({ onBack }: { onBack: () => void }) {
  const start = useGame((s) => s.startFromOnboarding);
  const [phase, setPhase] = useState<Phase>('name');
  const [name, setName] = useState('');
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<(number | undefined)[]>(() => Array.from({ length: QUIZ_LENGTH }, () => undefined));
  const [count, setCount] = useState(QUEST_COUNT_DEFAULT);
  const [times, setTimes] = useState<TimeOfDay[]>(['morning', 'evening']);
  const [habits, setHabits] = useState<PlannedHabit[]>([]);
  const [adding, setAdding] = useState(false);
  const [cName, setCName] = useState('');
  const [cStat, setCStat] = useState<StatKey>('DIS');
  const [cDiff, setCDiff] = useState<Difficulty>('medium');
  const [cTime, setCTime] = useState<TimeOfDay>('morning');
  const [cAmount, setCAmount] = useState('');
  const [cUnit, setCUnit] = useState<TargetUnit>('min');

  const scores = scoreQuiz(answers);
  const boss = weakestStat(scores);

  if (phase === 'name') {
    return (
      <Shell onBack={onBack}>
        <div className="space-y-5">
          <h1 className="text-3xl font-bold">Create your character</h1>
          <p className="text-slate-300">
            Answer 15 quick questions about your real habits. They set your starting stats and build a 66-day plan.
          </p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder="Your name"
            aria-label="Your name"
            className="w-full rounded-xl border-2 border-arc-cyan/40 bg-slate-800 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500"
          />
          <button type="button" className={primary} onClick={() => setPhase('quiz')}>
            Start the quiz
          </button>
        </div>
      </Shell>
    );
  }

  if (phase === 'quiz') {
    const question = QUIZ[qi]!;
    const meta = STAT_META[question.stat];
    const pick = (value: number) => {
      setAnswers((a) => a.map((x, i) => (i === qi ? value : x)));
      if (qi + 1 >= QUIZ_LENGTH) setPhase('setup');
      else setQi(qi + 1);
    };
    return (
      <Shell onBack={() => (qi === 0 ? setPhase('name') : setQi(qi - 1))} progress={qi / QUIZ_LENGTH}>
        <div className="space-y-5">
          <p className="flex items-center gap-2 text-sm" style={{ color: meta.color }}>
            <StatEmblem stat={question.stat} size={28} />
            {meta.label} · question {qi + 1} of {QUIZ_LENGTH}
          </p>
          <h1 className="text-2xl font-bold leading-snug">{question.text}</h1>
          <div className="space-y-2">
            {question.options.map((label, value) => {
              const on = answers[qi] === value;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => pick(value)}
                  aria-pressed={on}
                  className={`glass w-full p-4 text-left text-base ${on ? 'border-arc-violet bg-arc-violet/10' : 'active:border-arc-violet/70'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </Shell>
    );
  }

  if (phase === 'setup') {
    const toggle = (t: TimeOfDay) =>
      setTimes((cur) => (cur.includes(t) ? (cur.length > 1 ? cur.filter((x) => x !== t) : cur) : [...cur, t]));
    return (
      <Shell onBack={() => { setQi(QUIZ_LENGTH - 1); setPhase('quiz'); }}>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Shape your plan</h1>
          <div className="space-y-2">
            <p className="font-medium">How many daily quests do you want by day 15?</p>
            <p className="text-sm text-slate-400">You start with the easy ones. Medium quests unlock on day 8 and hard ones on day 15.</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Daily quests">
              {Array.from({ length: QUEST_COUNT_MAX - QUEST_COUNT_MIN + 1 }, (_, i) => QUEST_COUNT_MIN + i).map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={count === n}
                  onClick={() => setCount(n)}
                  className={`h-12 w-12 rounded-xl border-2 text-lg font-bold ${count === n ? 'border-arc-violet bg-arc-violet text-obsidian' : 'border-arc-cyan/40'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-medium">When are you free for quests?</p>
            <div className="flex flex-wrap gap-2">
              {TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={times.includes(t)}
                  onClick={() => toggle(t)}
                  className={`rounded-full border-2 px-4 py-2 ${times.includes(t) ? 'border-arc-violet bg-arc-violet/20' : 'border-arc-cyan/40 text-slate-400'}`}
                >
                  {TIME_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            className={primary}
            onClick={() => {
              setHabits(buildRoadmap(scores, count, times).habits);
              setPhase('review');
            }}
          >
            Build my plan
          </button>
        </div>
      </Shell>
    );
  }

  // review
  const xp = startingStatXp(scores);
  const swap = (i: number) => {
    const h = habits[i]!;
    const alts = alternatives(h.stat, h.difficulty);
    const used = new Set(habits.map((x) => x.name));
    const next = alts.find((a) => !used.has(a.name)) ?? alts[(alts.findIndex((a) => a.name === h.name) + 1) % alts.length];
    if (next) setHabits((hs) => hs.map((x, j) => (j === i ? { ...x, name: next.name } : x)));
  };
  const addOwn = () => {
    const n = cName.trim();
    if (!n) return;
    const target = customTarget(Number(cAmount), cUnit);
    setHabits((hs) => [...hs, { name: n, stat: cStat, difficulty: cDiff, timeOfDay: cTime, activeFromDay: 1, ...(target ? { target } : {}) }]);
    setCName('');
    setCAmount('');
    setAdding(false);
  };
  const bossQuests = habits.filter((h) => h.stat === boss).length;

  return (
    <Shell onBack={() => setPhase('setup')}>
      <div className="space-y-5">
        <h1 className="text-3xl font-bold">Your starting build</h1>
        <section className="glass p-4">
          <p className="mb-3 text-sm text-slate-300">
            {name.trim() || 'Hunter'} · <span className="font-bold text-arc-violet">{archetype(xp)}</span> · rank Iron IV
          </p>
          <div className="grid grid-cols-5 gap-2 text-center">
            {STAT_KEYS.map((k) => (
              <div key={k} className="flex flex-col items-center gap-1">
                <StatEmblem stat={k} size={40} labelled />
                <span className="text-lg font-bold leading-none" style={{ color: STAT_META[k].color }}>
                  {statLevel(xp[k])}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="glass border-arc-violet/60 p-4 text-sm">
          <p className="font-bold text-arc-violet">Boss stat: {STAT_META[boss].label}</p>
          <p className="mt-1 text-slate-300">
            Your weakest stat. On days {BOSS_START_DAY} to {BOSS_END_DAY}, its quests give {BOSS_XP_MULT}x XP, and clearing all of them every day wins a {BOSS_CHEST_XP} XP chest.
          </p>
          {bossQuests === 0 && <p className="mt-1 text-arc-crimson">You removed every {STAT_META[boss].label} quest, so boss week will have no chest.</p>}
        </section>

        <section className="space-y-1 text-sm text-slate-300">
          {phaseSummary(habits).map((p) => (
            <p key={p.day}>
              <span className="font-bold text-arc-cyan">Day {p.day}:</span> {p.count} {p.count === 1 ? 'quest unlocks' : 'quests unlock'}
            </p>
          ))}
        </section>

        <section className="space-y-2" aria-label="Your quests">
          {habits.map((h, i) => (
            <div key={`${h.name}-${i}`} className="glass flex items-center gap-3 p-3">
              <StatEmblem stat={h.stat} size={28} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{h.target ? `${h.name} · ${formatAmount(h.target.base, h.target.unit)}` : h.name}</p>
                <p className="text-xs text-slate-400">
                  {TIME_LABEL[h.timeOfDay]} · {h.difficulty} +{XP_VALUES[h.difficulty]} · day {h.activeFromDay}
                </p>
              </div>
              <button type="button" aria-label={`Swap ${h.name}`} onClick={() => swap(i)} className="rounded-lg p-2 text-slate-300 active:bg-slate-800">
                <RefreshCw size={18} />
              </button>
              <button type="button" aria-label={`Remove ${h.name}`} onClick={() => setHabits((hs) => hs.filter((_, j) => j !== i))} className="rounded-lg p-2 text-slate-300 active:bg-slate-800">
                <X size={18} />
              </button>
            </div>
          ))}
        </section>

        {adding ? (
          <section className="glass space-y-4 p-4">
            <input
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              maxLength={40}
              placeholder="Your own quest"
              aria-label="Quest name"
              className="w-full rounded-xl border-2 border-arc-cyan/40 bg-slate-800 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500"
            />
            <Choice label="Stat" value={cStat} onChange={setCStat} options={STAT_KEYS.map((k) => ({ value: k, label: STAT_META[k].label, color: STAT_META[k].color }))} />
            <Choice label="Difficulty" value={cDiff} onChange={setCDiff} options={(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => ({ value: d, label: `${d} +${XP_VALUES[d]}` }))} />
            <Choice label="When" value={cTime} onChange={setCTime} options={TIMES.map((t) => ({ value: t, label: TIME_LABEL[t] }))} />
            <TargetFields amount={cAmount} unit={cUnit} onAmount={setCAmount} onUnit={setCUnit} />
            <p className="text-xs text-slate-400">Your own quests are active from day 1.</p>
            <button type="button" className={primary} disabled={!cName.trim()} onClick={addOwn}>
              Add quest
            </button>
          </section>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="w-full rounded-xl border-2 border-arc-cyan/40 bg-slate-800 py-3 text-sm">
            Add your own quest
          </button>
        )}

        <button
          type="button"
          className={primary}
          disabled={habits.length === 0}
          onClick={() => start({ name: name.trim() || 'Hunter', scores, bossStat: boss, habits })}
        >
          Begin the 66 days
        </button>
      </div>
    </Shell>
  );
}
