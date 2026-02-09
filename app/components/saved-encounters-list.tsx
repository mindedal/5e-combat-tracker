"use client";

import type { SavedEncounterRecord } from "../lib/encounter-types";

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

type SavedEncountersListProps = {
  records: SavedEncounterRecord[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
};

export const SavedEncountersList = ({
  records,
  onLoad,
  onDelete,
}: SavedEncountersListProps) => {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-zinc-950/60 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
        Saved Encounters
      </h3>
      {records.length === 0 ? (
        <p className="text-sm text-zinc-400">No saved encounters yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {records.map((record) => (
            <li
              key={record.id}
              className="flex flex-col gap-2 rounded-lg border border-white/10 bg-zinc-900/60 p-3 text-sm text-zinc-200"
            >
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-white">
                  {record.name?.trim() ? record.name : "Untitled Encounter"}
                </span>
                <span className="text-xs text-zinc-400">
                  Saved {formatTimestamp(record.savedAt)} ·{" "}
                  {record.encounter.participants.length} combatants
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onLoad(record.id)}
                  className="inline-flex items-center rounded-md bg-emerald-500 px-3 py-1 text-xs font-semibold text-black transition hover:bg-emerald-400"
                >
                  Load
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(record.id)}
                  className="inline-flex items-center rounded-md border border-white/10 px-3 py-1 text-xs font-semibold text-zinc-200 transition hover:border-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
