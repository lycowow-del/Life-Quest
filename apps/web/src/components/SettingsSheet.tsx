import { useState } from 'react';
import { describeSchedule, questLabel, type GameState, type ReminderKind } from '@la66/core';
import { notificationsSupported, requestNotificationPermission, showNotification } from '../lib/notify';
import { useInstall } from '../lib/pwa/useInstall';
import { BUILD_DATE, BUILD_SHA, VERSION_LABEL } from '../lib/version';
import { useGame } from '../store/gameStore';
import { useSettings } from '../store/settingsStore';
import { downloadText } from '../store/saveFile';
import { ImportButton } from './ImportButton';
import { Sheet } from './Sheet';

const ghost = 'rounded-xl border-2 border-arc-cyan/40 bg-slate-800 px-4 py-3 text-sm';

function Switch({ on, onChange, label, danger = false }: { on: boolean; onChange: () => void; label: string; danger?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`relative h-7 w-12 flex-none rounded-full transition-colors ${on ? (danger ? 'bg-arc-crimson' : 'bg-arc-violet') : 'bg-slate-700'}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-6' : 'left-1'}`} />
    </button>
  );
}

const REMINDER_LABEL: Record<ReminderKind, { name: string; hint: string }> = {
  morning: { name: 'Morning Kickoff', hint: 'A nudge to start your quests.' },
  evening: { name: 'Evening Review', hint: 'Only if you still have quests left.' },
};

export function SettingsSheet({ open, onClose, state, onRetake }: { open: boolean; onClose: () => void; state: GameState; onRetake: () => void }) {
  const g = useGame();
  const settings = useSettings();
  const install = useInstall();
  const [msg, setMsg] = useState('');
  const [sure, setSure] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>(
    notificationsSupported() ? Notification.permission : 'unsupported',
  );
  const hard = state.profile.mode === 'hard';
  const endsTonight = state.profile.pendingMode === 'standard';
  const [confirmHard, setConfirmHard] = useState(false);

  const toggleReminder = async (kind: ReminderKind): Promise<void> => {
    const enabling = !settings.reminders[kind].enabled;
    if (enabling && perm !== 'granted') setPerm(await requestNotificationPermission());
    settings.setReminder(kind, { enabled: enabling });
  };

  const sendTest = async (): Promise<void> => {
    const p = perm === 'granted' ? perm : await requestNotificationPermission();
    setPerm(p);
    if (p !== 'granted') {
      setMsg('Notifications are not allowed yet.');
      return;
    }
    const ok = await showNotification('Life Quest', 'Test notification. Tap it to open the app.', 'test');
    setMsg(ok ? 'Test notification sent.' : 'Could not show a notification on this device.');
  };

  return (
    <Sheet open={open} onClose={() => { setSure(false); onClose(); }} title="Settings">
      <div className="space-y-6">
        <section className="space-y-3" aria-label="Hard Mode">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-bold">Hard Mode</p>
              <p className="text-xs text-slate-400">
                {endsTonight ? 'Turns off when today closes.' : 'Missed quests cost XP, empty days can restart your cycle, idle stats decay.'}
              </p>
            </div>
            <Switch
              on={hard && !endsTonight}
              danger
              label="Hard Mode"
              onChange={() => {
                if (!hard) setConfirmHard(true);
                else g.setMode(endsTonight ? 'hard' : 'standard');
              }}
            />
          </div>
          {confirmHard && !hard && (
            <div className="space-y-2 rounded-xl border border-arc-crimson/50 bg-arc-crimson/10 p-3 text-sm">
              <p className="font-bold text-arc-crimson">Turn on Hard Mode?</p>
              <ul className="list-disc space-y-1 pl-5 text-xs text-slate-300">
                <li>A missed quest costs half of its base XP when the day closes.</li>
                <li>Three empty days in a row restart your 66-day cycle (rank, XP and skill cards are kept).</li>
                <li>A stat idle for 5 days loses a level, and again every 5 days after that.</li>
                <li>Turning it off takes effect when today closes.</li>
              </ul>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className={ghost} onClick={() => setConfirmHard(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-arc-crimson px-4 py-3 text-sm font-bold text-obsidian"
                  onClick={() => {
                    g.setMode('hard');
                    setConfirmHard(false);
                  }}
                >
                  Turn on
                </button>
              </div>
            </div>
          )}
          {endsTonight && <p className="text-xs text-arc-violet">Hard Mode is still on for today. Flip the switch back to keep it.</p>}
        </section>

        <section className="space-y-4" aria-label="Reminders">
          <p className="font-bold">Reminders</p>
          {(['morning', 'evening'] as ReminderKind[]).map((kind) => {
            const r = settings.reminders[kind];
            return (
              <div key={kind} className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{REMINDER_LABEL[kind].name}</p>
                    <p className="text-xs text-slate-400">{REMINDER_LABEL[kind].hint}</p>
                  </div>
                  <Switch on={r.enabled} label={REMINDER_LABEL[kind].name} onChange={() => void toggleReminder(kind)} />
                </div>
                {r.enabled && (
                  <input
                    type="time"
                    value={r.time}
                    aria-label={`${REMINDER_LABEL[kind].name} time`}
                    onChange={(e) => e.target.value && settings.setReminder(kind, { time: e.target.value })}
                    className="rounded-xl border-2 border-arc-cyan/40 bg-slate-800 px-3 py-2 text-base text-slate-100"
                  />
                )}
              </div>
            );
          })}
          {perm === 'denied' && (
            <p className="rounded-xl border border-arc-crimson/40 bg-arc-crimson/10 p-3 text-xs text-arc-crimson">
              Notifications are blocked. Allow them for this app in your browser's site settings and in Android's app notification settings. Until then you still get the in-app banner.
            </p>
          )}
          {perm === 'unsupported' && <p className="text-xs text-slate-400">This browser cannot show notifications. You still get the in-app banner.</p>}
          <p className="text-xs text-slate-400">
            Reminders are sent while the app is open or running in the background. If the time passes while it is closed, you see a banner when you open it.
          </p>
          <button type="button" className={`${ghost} w-full`} onClick={() => void sendTest()}>
            Send a test notification
          </button>
        </section>

        <section className="space-y-4" aria-label="Sound and vibration">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium">Sound effects</p>
            <Switch on={settings.sound} label="Sound effects" onChange={() => settings.setSound(!settings.sound)} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium">Vibration</p>
            <Switch on={settings.vibrate} label="Vibration" onChange={() => settings.setVibrate(!settings.vibrate)} />
          </div>
        </section>

        <section className="space-y-3" aria-label="Your quests">
          <p className="font-bold">Your quests</p>
          {state.habits.filter((h) => !h.archived).length === 0 && <p className="text-xs text-slate-400">No quests yet.</p>}
          {state.habits
            .filter((h) => !h.archived)
            .map((h) => (
              <div key={h.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{questLabel(h)}</p>
                  {h.schedule && <p className="text-xs text-slate-400">{describeSchedule(h.schedule)}</p>}
                  {h.createdOnDay > state.profile.dayNumber && <p className="text-xs text-slate-400">Unlocks on day {h.createdOnDay}</p>}
                </div>
                {h.target && <Switch on={!h.target.frozen} label={`Grow ${h.name}`} onChange={() => g.toggleGrowth(h.id)} />}
                <button type="button" aria-label={`Remove ${h.name}`} onClick={() => g.archiveHabit(h.id)} className="rounded-lg px-2 py-1 text-xs text-arc-crimson active:bg-slate-800">
                  Remove
                </button>
              </div>
            ))}
          <p className="text-xs text-slate-400">The switch lets a measurable quest grow 25% every 5 completed days. Turn it off to keep the amount where it is.</p>
        </section>

        <section className="space-y-2" aria-label="Quiz">
          <p className="font-bold">Quiz</p>
          <p className="text-xs text-slate-400">Retake the habit quiz to update your stat levels and boss stat. Levels only go up, and your XP and rank stay as they are.</p>
          <button type="button" className={`${ghost} w-full`} onClick={onRetake}>
            Retake the quiz
          </button>
        </section>

        <section className="space-y-2" aria-label="Install">
          <p className="font-bold">Install</p>
          {install.installed ? (
            <p className="text-sm text-arc-emerald">Installed. You are running the app.</p>
          ) : install.canPrompt ? (
            <button type="button" className={`${ghost} w-full`} onClick={() => void install.install()}>
              Install app
            </button>
          ) : install.isIos ? (
            <p className="text-xs text-slate-400">On iPhone: tap the Share button, then Add to Home Screen.</p>
          ) : (
            <p className="text-xs text-slate-400">Open your browser menu and choose Install app or Add to Home screen.</p>
          )}
        </section>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={ghost}
            onClick={() => {
              const j = g.exportJson();
              if (j) downloadText('life-quest-save.json', j);
            }}
          >
            Export save
          </button>
          <ImportButton className={ghost} onResult={setMsg}>
            Import save
          </ImportButton>
        </div>

        <p className="text-xs text-slate-400">Journal photos stay on this device. They are not included in the save file.</p>

        <div className="space-y-2 rounded-xl border border-slate-700 p-3">
          <p className="text-xs text-slate-400">Developer tools (removed before v1.0)</p>
          <button type="button" className={`${ghost} w-full`} onClick={g.devSkipDay}>
            Skip to next day
          </button>
        </div>

        <button
          type="button"
          className={`${ghost} w-full text-arc-crimson`}
          onClick={() => {
            if (sure) void g.reset();
            else setSure(true);
          }}
        >
          {sure ? 'Tap again to erase everything' : 'Reset all data'}
        </button>
        {msg && <p className="text-center text-sm text-slate-300">{msg}</p>}

        <p className="text-center text-xs text-slate-500">
          {VERSION_LABEL} · build {BUILD_SHA} · {BUILD_DATE}
        </p>
      </div>
    </Sheet>
  );
}
