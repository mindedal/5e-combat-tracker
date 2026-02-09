"use client";

import type { EncounterSnapshot } from "../lib/encounter-types";

type SharedSnapshotPreviewProps = {
  snapshot: EncounterSnapshot;
  onLoad: () => void;
  onDismiss: () => void;
  versionMismatch: string | null;
};

export const SharedSnapshotPreview = ({
  snapshot,
  onLoad,
  onDismiss,
  versionMismatch,
}: SharedSnapshotPreviewProps) => {
  const { encounter } = snapshot;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-amber-100">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em]">
          Shared Snapshot
        </h3>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-semibold text-amber-200 transition hover:text-white"
        >
          Dismiss
        </button>
      </div>
      <div className="text-sm text-amber-50">
        <p className="font-semibold">
          {encounter.name?.trim() ? encounter.name : "Untitled Encounter"}
        </p>
        <p className="text-xs text-amber-200">
          {encounter.participants.length} combatants · Round {encounter.round}
        </p>
      </div>
      {versionMismatch ? (
        <p className="text-xs text-red-200">{versionMismatch}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onLoad}
          className="inline-flex items-center rounded-md bg-amber-400 px-3 py-1 text-xs font-semibold text-black transition hover:bg-amber-300"
        >
          Load Snapshot
        </button>
      </div>
    </div>
  );
};
