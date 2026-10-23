import { useState } from 'react';
import { JOURNAL_MAX_CHARS, JOURNAL_MAX_PHOTOS, addDaysToKey, todayJournal, type GameState, type Mood, type Reward } from '@la66/core';
import { deletePhoto, savePhoto } from '../lib/photos';
import { useGame } from '../store/gameStore';
import { PhotoThumb, PhotoViewer } from './PhotoThumb';

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 1, emoji: '😞', label: 'Rough' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];
const emojiOf = (m?: Mood): string => MOODS.find((x) => x.value === m)?.emoji ?? '';
const primary = 'w-full rounded-xl bg-arc-violet py-3 font-bold text-obsidian shadow-glow-violet disabled:opacity-40';
const ghost = 'flex w-full cursor-pointer items-center justify-center rounded-xl border-2 border-arc-cyan/40 bg-slate-800 py-3 text-sm';

/** Mood tap, a typed journal, and photos of a paper journal. Mount with key={dayNumber} so it resets each day. */
export function JournalScreen({ state, onReward }: { state: GameState; onReward: (r: Reward) => void }) {
  const entry = todayJournal(state);
  const today = state.profile.dayNumber;
  const startDateKey = useGame((s) => s.startDateKey);
  const setMood = useGame((s) => s.setMood);
  const saveJournal = useGame((s) => s.saveJournal);
  const [draft, setDraft] = useState(entry?.text ?? '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const photos = entry?.photoIds ?? [];
  const past = Object.values(state.journal ?? {})
    .filter((e) => e.day !== today && (e.mood || e.text || e.photoIds?.length))
    .sort((a, b) => b.day - a.day)
    .slice(0, 14);

  const afterSave = (rw: Reward | null, saved: string): void => {
    if (rw) onReward(rw);
    setNote(rw ? `${saved} +${rw.xp} Wisdom XP.` : saved);
  };

  const addPhoto = async (file: File): Promise<void> => {
    setBusy(true);
    try {
      const id = await savePhoto(file);
      afterSave(saveJournal(draft, [...photos, id]), 'Photo saved.');
    } catch {
      setNote('Could not save that photo.');
    } finally {
      setBusy(false);
    }
  };
  const removePhoto = async (id: string): Promise<void> => {
    await deletePhoto(id);
    saveJournal(draft, photos.filter((p) => p !== id));
    setNote('Photo removed.');
  };
  const dateLabel = (day: number): string => (startDateKey ? addDaysToKey(startDateKey, day - 1) : `Day ${day}`);

  return (
    <section className="space-y-5" aria-label="Journal">
      <h2 className="text-lg font-bold">Journal</h2>

      <div className="glass space-y-3 p-4">
        <p className="text-sm font-medium">How are you today?</p>
        <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Mood">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={entry?.mood === m.value}
              aria-label={m.label}
              onClick={() => {
                const rw = setMood(m.value);
                if (rw) onReward(rw);
              }}
              className={`rounded-xl border-2 py-2 text-2xl ${entry?.mood === m.value ? 'border-arc-violet bg-arc-violet/20' : 'border-arc-cyan/30'}`}
            >
              {m.emoji}
            </button>
          ))}
        </div>
        {!entry?.moodPaid && <p className="text-xs text-slate-400">Your first mood each day earns a little Wisdom XP.</p>}
      </div>

      <div className="glass space-y-3 p-4">
        <p className="text-sm font-medium">Write in your journal</p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, JOURNAL_MAX_CHARS))}
          rows={6}
          placeholder="What went well? What will you do tomorrow?"
          aria-label="Journal entry"
          className="w-full rounded-xl border-2 border-arc-cyan/40 bg-slate-800 p-3 text-base text-slate-100 placeholder:text-slate-500"
        />
        <button type="button" className={primary} disabled={draft === (entry?.text ?? '')} onClick={() => afterSave(saveJournal(draft, photos), 'Saved.')}>
          Save entry
        </button>
        {!entry?.journalPaid && <p className="text-xs text-slate-400">An entry of 20 or more characters, or a photo of a paper page, earns Wisdom XP once a day.</p>}
      </div>

      <div className="glass space-y-3 p-4">
        <p className="text-sm font-medium">Journal on paper?</p>
        <p className="text-xs text-slate-400">Take a photo of your page. It is saved on this device and counts like a written entry.</p>
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {photos.map((id) => (
              <PhotoThumb key={id} id={id} onOpen={setViewing} onRemove={(p) => void removePhoto(p)} />
            ))}
          </div>
        )}
        <label className={`${ghost} ${busy || photos.length >= JOURNAL_MAX_PHOTOS ? 'opacity-40' : ''}`}>
          {busy ? 'Saving…' : photos.length >= JOURNAL_MAX_PHOTOS ? 'Photo limit reached' : 'Take a photo of your page'}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={busy || photos.length >= JOURNAL_MAX_PHOTOS}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void addPhoto(f);
            }}
          />
        </label>
      </div>

      {note && <p className="text-center text-sm text-arc-emerald" role="status">{note}</p>}

      {past.length > 0 && (
        <div className="space-y-2">
          <h3 className="px-1 text-sm font-medium text-arc-cyan">Past entries</h3>
          {past.map((e) => (
            <details key={e.day} className="glass p-3">
              <summary className="cursor-pointer text-sm">
                {dateLabel(e.day)} {emojiOf(e.mood)}
                {e.photoIds?.length ? ` · ${e.photoIds.length} ${e.photoIds.length === 1 ? 'photo' : 'photos'}` : ''}
              </summary>
              {e.text && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{e.text}</p>}
              {e.photoIds && (
                <div className="mt-2 flex flex-wrap gap-3">
                  {e.photoIds.map((id) => (
                    <PhotoThumb key={id} id={id} size={64} onOpen={setViewing} />
                  ))}
                </div>
              )}
            </details>
          ))}
        </div>
      )}

      {viewing && <PhotoViewer id={viewing} onClose={() => setViewing(null)} />}
    </section>
  );
}
