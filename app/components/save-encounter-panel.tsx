"use client";

import { useState } from "react";

type SaveEncounterPanelProps = {
  onSave: (name: string) => void;
  storageAvailable: boolean | null;
  error: string | null;
};

export const SaveEncounterPanel = ({
  onSave,
  storageAvailable,
  error,
}: SaveEncounterPanelProps) => {
  const [name, setName] = useState("");

  const handleSave = () => {
    if (storageAvailable !== true) return;
    onSave(name.trim());
    setName("");
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-zinc-950/60 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
          Save Encounter
        </h3>
        {storageAvailable === false ? (
          <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-300 ring-1 ring-red-500/30">
            Storage Unavailable
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className="flex-1 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none ring-emerald-500/50 transition focus:ring"
          placeholder="Optional name (e.g., Goblin Ambush)"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={storageAvailable !== true}
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={storageAvailable !== true}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-black shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/40"
        >
          Save Encounter
        </button>
      </div>
      {error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : (
        <p className="text-xs text-zinc-400">
          Saves a snapshot of the current initiative order, HP, and conditions.
        </p>
      )}
    </div>
  );
};
