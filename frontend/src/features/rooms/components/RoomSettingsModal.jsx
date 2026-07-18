import { Button } from "@/components/ui/button";

export default function RoomSettingsModal({ settings }) {
  if (!settings.showSettings) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-5 text-white shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Room Settings</h2>
          <button
            type="button"
            className="text-slate-400 hover:text-white"
            onClick={() => settings.setShowSettings(false)}
          >
            x
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Room Name
            </label>
            <input
              className="w-full rounded bg-slate-800 px-3 py-2 text-white"
              value={settings.settings.title}
              disabled={!settings.isOwner}
              onChange={(event) =>
                settings.setSettings((currentSettings) => ({
                  ...currentSettings,
                  title: event.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Language
            </label>
            <select
              className="w-full rounded bg-slate-800 px-3 py-2 text-white"
              value={settings.settings.language}
              disabled={!settings.isOwner}
              onChange={(event) =>
                settings.setSettings((currentSettings) => ({
                  ...currentSettings,
                  language: event.target.value,
                }))
              }
            >
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={settings.settings.interviewMode}
              disabled={!settings.isOwner}
              onChange={(event) =>
                settings.setSettings((currentSettings) => ({
                  ...currentSettings,
                  interviewMode: event.target.checked,
                }))
              }
            />
            Interview Mode
          </label>

          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Interview Duration
            </label>
            <select
              className="w-full rounded bg-slate-800 px-3 py-2 text-white"
              value={settings.settings.duration}
              disabled={!settings.isOwner}
              onChange={(event) =>
                settings.setSettings((currentSettings) => ({
                  ...currentSettings,
                  duration: Number(event.target.value),
                }))
              }
            >
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes</option>
              <option value={45}>45 Minutes</option>
              <option value={60}>60 Minutes</option>
              <option value={90}>90 Minutes</option>
            </select>
          </div>

          {!settings.isOwner && (
            <p className="rounded bg-slate-800 px-3 py-2 text-sm text-slate-400">
              Participants can view settings only.
            </p>
          )}

          {settings.isOwner && (
            <div className="flex justify-between gap-3">
              <Button onClick={settings.saveSettings}>Save Settings</Button>
              <Button variant="destructive" onClick={settings.deleteRoom}>
                Delete Room
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
