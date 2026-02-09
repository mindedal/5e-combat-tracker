"use client";

import { useState } from "react";

type ShareEncounterButtonProps = {
  onGenerate: () => void;
  shareUrl: string | null;
  error: string | null;
};

export const ShareEncounterButton = ({
  onGenerate,
  shareUrl,
  error,
}: ShareEncounterButtonProps) => {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  const displayUrl = (() => {
    if (!shareUrl) return null;
    if (shareUrl.length <= 60) return shareUrl;
    return `${shareUrl.slice(0, 32)}…${shareUrl.slice(-16)}`;
  })();

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("failed");
      setTimeout(() => setCopyState("idle"), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-zinc-950/60 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
        Share Snapshot
      </h3>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onGenerate}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-sky-500 px-4 text-sm font-semibold text-black shadow-lg shadow-sky-500/30 transition hover:bg-sky-400"
        >
          Generate Link
        </button>
        {shareUrl ? (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-200 transition hover:border-emerald-400 hover:text-emerald-200"
          >
            {copyState === "copied"
              ? "Copied!"
              : copyState === "failed"
                ? "Copy Failed"
                : "Copy Link"}
          </button>
        ) : null}
      </div>
      {displayUrl ? (
        <p className="text-xs text-zinc-400">{displayUrl}</p>
      ) : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
};
