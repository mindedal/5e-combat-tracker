"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import {
  advanceTurn,
  clampAllHp,
  sortCombatants,
  startCombat,
  type Combatant,
  type CombatState,
  updateCombatantHp,
} from "../lib/combat-logic";
import { SaveEncounterPanel } from "./save-encounter-panel";
import { SavedEncountersList } from "./saved-encounters-list";
import { ShareEncounterButton } from "./share-encounter-button";
import { SharedSnapshotPreview } from "./shared-snapshot-preview";
import { SHARE_PARAM_KEY, STORAGE_VERSION } from "../lib/encounter-constants";
import {
  buildShareUrl,
  decodeEncounterSnapshot,
  encodeEncounterSnapshot,
  stripShareParam,
} from "../lib/encounter-share";
import {
  buildRecordFromState,
  buildSnapshotFromState,
  checkStorageAvailability,
  deleteSavedEncounter,
  loadActiveCombatState,
  loadSavedEncounters,
  restoreCombatState,
  saveActiveCombatState,
  saveEncounterRecord,
} from "../lib/encounter-storage";
import type {
  EncounterSnapshot,
  SavedEncounterRecord,
} from "../lib/encounter-types";

type NewCombatantForm = {
  name: string;
  initiative: string;
  maxHp: string;
  armorClass: string;
};

const createEmptyState = (): CombatState => ({
  combatants: [],
  activeIndex: -1,
  round: 1,
  started: false,
});

const findActiveIndex = (
  combatants: Combatant[],
  activeId: string | null,
): number => {
  if (!activeId) return combatants.length > 0 ? 0 : -1;
  return combatants.findIndex((combatant) => combatant.id === activeId);
};

export const CombatTrackerClient = () => {
  const searchParams = useSearchParams();
  const [state, setState] = useState<CombatState>(() => {
    return createEmptyState();
  });
  const [form, setForm] = useState<NewCombatantForm>({
    name: "",
    initiative: "",
    maxHp: "",
    armorClass: "",
  });
  const [hpEdits, setHpEdits] = useState<Record<string, string>>({});
  const [savedEncounters, setSavedEncounters] = useState<
    SavedEncounterRecord[]
  >([]);
  const [storageAvailable, setStorageAvailable] = useState<boolean | null>(
    null,
  );
  const [storageError, setStorageError] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [versionMessage, setVersionMessage] = useState<string | null>(null);
  const [dismissedPayload, setDismissedPayload] = useState<string | null>(null);

  const sharePayload = searchParams.get(SHARE_PARAM_KEY);
  const decodedSnapshot = useMemo(() => {
    if (!sharePayload) return null;
    return decodeEncounterSnapshot(sharePayload);
  }, [sharePayload]);
  const pendingSnapshot: EncounterSnapshot | null =
    decodedSnapshot && decodedSnapshot.ok && sharePayload !== dismissedPayload
      ? decodedSnapshot.value
      : null;
  const shareDecodeError =
    decodedSnapshot && !decodedSnapshot.ok ? decodedSnapshot.error : null;
  const shareVersionMessage =
    pendingSnapshot && pendingSnapshot.version !== STORAGE_VERSION
      ? "This snapshot was created with an incompatible version and cannot be loaded."
      : null;

  useEffect(() => {
    let canceled = false;
    queueMicrotask(() => {
      if (canceled) return;
      const availability = checkStorageAvailability();
      setStorageAvailable(availability.ok);
      if (!availability.ok) {
        setStorageError(availability.error);
        return;
      }

      const savedResult = loadSavedEncounters();
      if (savedResult.ok) {
        setSavedEncounters(savedResult.value);
      } else {
        setStorageError(savedResult.error);
      }

      const storedResult = loadActiveCombatState();
      if (storedResult.ok && storedResult.value) {
        const parsed = storedResult.value;
        const clampedCombatants = clampAllHp(
          sortCombatants(parsed.combatants ?? []),
        );
        const activeId =
          parsed.activeIndex >= 0
            ? (clampedCombatants[parsed.activeIndex]?.id ?? null)
            : null;
        setState({
          combatants: clampedCombatants,
          activeIndex: findActiveIndex(clampedCombatants, activeId),
          round: parsed.round ?? 1,
          started: parsed.started ?? false,
        });
      }
    });

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    const saveResult = saveActiveCombatState(state);
    if (!saveResult.ok) {
      console.error("Failed to save active combat state", saveResult.error);
    }
  }, [state]);

  const handleInputChange = (field: keyof NewCombatantForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddCombatant = () => {
    const initiative = Number.parseInt(form.initiative, 10);
    const maxHp = Number.parseInt(form.maxHp, 10);
    const armorClass = Number.parseInt(form.armorClass, 10);

    if (
      !form.name.trim() ||
      Number.isNaN(initiative) ||
      Number.isNaN(maxHp) ||
      Number.isNaN(armorClass)
    ) {
      return;
    }

    const newCombatant: Combatant = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      initiative,
      maxHp: Math.max(maxHp, 0),
      currentHp: Math.max(maxHp, 0),
      armorClass: Math.max(armorClass, 0),
    };

    setState((prev) => {
      const previousActiveId =
        prev.activeIndex >= 0
          ? (prev.combatants[prev.activeIndex]?.id ?? null)
          : null;
      const updatedCombatants = sortCombatants([
        ...prev.combatants,
        newCombatant,
      ]);
      const nextIndex = prev.started
        ? findActiveIndex(updatedCombatants, previousActiveId)
        : -1;
      return {
        ...prev,
        combatants: updatedCombatants,
        activeIndex: nextIndex,
      };
    });

    setForm({ name: "", initiative: "", maxHp: "", armorClass: "" });
  };

  const handleStartCombat = () => {
    setState((prev) =>
      startCombat({ ...prev, combatants: sortCombatants(prev.combatants) }),
    );
  };

  const handleNextTurn = () => {
    setState((prev) => advanceTurn({ ...prev, combatants: prev.combatants }));
  };

  const handleHpApply = (combatantId: string) => {
    const input = hpEdits[combatantId] ?? "";
    setState((prev) => ({
      ...prev,
      combatants: updateCombatantHp(prev.combatants, combatantId, input),
    }));
    setHpEdits((prev) => ({ ...prev, [combatantId]: "" }));
  };

  const handleHpChange = (combatantId: string, value: string) => {
    setHpEdits((prev) => ({ ...prev, [combatantId]: value }));
  };

  const handleHpBlur = (combatantId: string) => handleHpApply(combatantId);

  const handleKeySubmit = (
    combatantId: string,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleHpApply(combatantId);
    }
  };

  const handleClearAll = () => {
    setState(createEmptyState());
    setHpEdits({});
  };

  const handleSaveEncounter = (name: string) => {
    setStorageError(null);
    const record = buildRecordFromState(state, name || null);
    const saveResult = saveEncounterRecord(record);
    if (!saveResult.ok) {
      setStorageError(saveResult.error);
      return;
    }
    setSavedEncounters(saveResult.value);
  };

  const handleLoadEncounter = (id: string) => {
    const record = savedEncounters.find((entry) => entry.id === id);
    if (!record) return;
    if (record.encounter.version !== STORAGE_VERSION) {
      setVersionMessage(
        "This saved encounter was created with an incompatible version and cannot be loaded.",
      );
      return;
    }
    const confirmed = window.confirm("Load this saved encounter?");
    if (!confirmed) return;
    setState(restoreCombatState(record.encounter));
    setVersionMessage(null);
  };

  const handleDeleteEncounter = (id: string) => {
    const confirmed = window.confirm("Delete this saved encounter?");
    if (!confirmed) return;
    const deleteResult = deleteSavedEncounter(id);
    if (!deleteResult.ok) {
      setStorageError(deleteResult.error);
      return;
    }
    setSavedEncounters(deleteResult.value);
  };

  const handleGenerateShare = () => {
    setShareError(null);
    const snapshot = buildSnapshotFromState(state, null);
    const encoded = encodeEncounterSnapshot(snapshot);
    if (!encoded.ok) {
      setShareError(encoded.error);
      setShareUrl(null);
      return;
    }
    const urlResult = buildShareUrl(window.location.href, encoded.payload);
    if (!urlResult.ok) {
      setShareError(urlResult.error);
      setShareUrl(null);
      return;
    }
    setShareUrl(urlResult.payload);
  };

  const handleLoadSharedSnapshot = () => {
    if (!pendingSnapshot) return;
    if (pendingSnapshot.version !== STORAGE_VERSION) return;
    const confirmed = window.confirm("Load this shared snapshot?");
    if (!confirmed) return;
    setState(restoreCombatState(pendingSnapshot.encounter));
    setDismissedPayload(sharePayload ?? null);
    setShareError(null);
    const nextUrl = stripShareParam(window.location.href);
    window.history.replaceState(null, "", nextUrl);
  };

  const handleDismissSharedSnapshot = () => {
    setDismissedPayload(sharePayload ?? null);
    setShareError(null);
    const nextUrl = stripShareParam(window.location.href);
    window.history.replaceState(null, "", nextUrl);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-black px-4 py-10 text-zinc-50">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-2xl border border-white/10 bg-zinc-900/70 p-8 shadow-2xl shadow-black/50 backdrop-blur">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-zinc-400">
              Utility
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-white">
              D&D 5e Combat Tracker
            </h1>
            <p className="text-sm text-zinc-400">
              Bun · Next.js App Router · Tailwind · Local-only storage
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-300 ring-1 ring-emerald-500/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {state.started ? "Combat Active" : "Ready"}
            </span>
            <span className="rounded-full bg-zinc-800 px-3 py-1 ring-1 ring-white/10">
              Round {state.round}
            </span>
          </div>
        </header>

        {pendingSnapshot ? (
          <SharedSnapshotPreview
            snapshot={pendingSnapshot}
            onLoad={handleLoadSharedSnapshot}
            onDismiss={handleDismissSharedSnapshot}
            versionMismatch={shareVersionMessage}
          />
        ) : null}

        {versionMessage ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {versionMessage}
          </div>
        ) : null}

        <section className="grid gap-6 rounded-xl border border-white/5 bg-zinc-950/60 p-6 shadow-inner shadow-black/30">
          <h2 className="text-lg font-semibold text-white">Add Combatant</h2>
          <div className="grid gap-4 sm:grid-cols-5 sm:items-end">
            <label className="flex flex-col gap-2 text-sm text-zinc-300">
              Name
              <input
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none ring-emerald-500/50 transition focus:ring"
                value={form.name}
                onChange={(event) =>
                  handleInputChange("name", event.target.value)
                }
                placeholder="Goblin"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-zinc-300">
              Initiative
              <input
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none ring-emerald-500/50 transition focus:ring"
                value={form.initiative}
                onChange={(event) =>
                  handleInputChange("initiative", event.target.value)
                }
                inputMode="numeric"
                placeholder="15"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-zinc-300">
              Max HP
              <input
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none ring-emerald-500/50 transition focus:ring"
                value={form.maxHp}
                onChange={(event) =>
                  handleInputChange("maxHp", event.target.value)
                }
                inputMode="numeric"
                placeholder="22"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-zinc-300">
              Armor Class
              <input
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none ring-emerald-500/50 transition focus:ring"
                value={form.armorClass}
                onChange={(event) =>
                  handleInputChange("armorClass", event.target.value)
                }
                inputMode="numeric"
                placeholder="13"
              />
            </label>
            <button
              type="button"
              onClick={handleAddCombatant}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-black shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/50"
              disabled={
                !form.name.trim() ||
                !form.initiative ||
                !form.maxHp ||
                !form.armorClass
              }
            >
              Add
            </button>
          </div>
        </section>

        <section className="grid gap-4 rounded-xl border border-white/5 bg-zinc-950/60 p-6 shadow-inner shadow-black/30">
          <h2 className="text-lg font-semibold text-white">Encounter Tools</h2>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <SaveEncounterPanel
              onSave={handleSaveEncounter}
              storageAvailable={storageAvailable}
              error={storageError}
            />
            <ShareEncounterButton
              onGenerate={handleGenerateShare}
              shareUrl={shareUrl}
              error={shareError ?? shareDecodeError}
            />
          </div>
          <SavedEncountersList
            records={savedEncounters}
            onLoad={handleLoadEncounter}
            onDelete={handleDeleteEncounter}
          />
        </section>

        <section className="grid gap-4 rounded-xl border border-white/5 bg-zinc-950/60 p-6 shadow-inner shadow-black/30">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-white">Combatants</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <button
                type="button"
                onClick={handleStartCombat}
                disabled={state.combatants.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 font-semibold text-black shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-sky-500/40"
              >
                Start Combat
              </button>
              <button
                type="button"
                onClick={handleNextTurn}
                disabled={!state.started || state.combatants.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-black shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/40"
              >
                Next Turn
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 font-semibold text-zinc-200 transition hover:border-red-400 hover:text-red-300"
              >
                Clear
              </button>
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-400">
                Initiative: High → Low
              </span>
            </div>
          </div>

          {state.combatants.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/10 bg-zinc-900/60 px-4 py-6 text-sm text-zinc-400">
              No combatants yet. Add players or monsters to begin.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/10">
              <div className="grid grid-cols-12 bg-zinc-900/80 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <span className="col-span-3">Name</span>
                <span className="col-span-1 text-right">Init</span>
                <span className="col-span-2 text-right">AC</span>
                <span className="col-span-3 text-right">
                  HP (Current / Max)
                </span>
                <span className="col-span-3 text-right">Adjust HP</span>
              </div>
              <ul className="divide-y divide-white/5 bg-zinc-950/50">
                {state.combatants.map((combatant, index) => {
                  const isActive = state.started && index === state.activeIndex;
                  return (
                    <li
                      key={combatant.id}
                      className={`grid grid-cols-12 items-center px-4 py-3 text-sm transition ${
                        isActive
                          ? "bg-emerald-500/10 ring-1 ring-emerald-400/60"
                          : ""
                      }`}
                    >
                      <div className="col-span-3 flex items-center gap-2 font-semibold text-white">
                        {isActive ? (
                          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                        ) : (
                          <span className="inline-flex h-2 w-2 rounded-full bg-zinc-600" />
                        )}
                        <span>{combatant.name}</span>
                      </div>
                      <div className="col-span-1 text-right font-mono text-zinc-200">
                        {combatant.initiative}
                      </div>
                      <div className="col-span-2 text-right font-mono text-zinc-200">
                        AC {combatant.armorClass}
                      </div>
                      <div className="col-span-3 text-right font-mono text-zinc-200">
                        {combatant.currentHp} / {combatant.maxHp}
                      </div>
                      <div className="col-span-3 flex items-center justify-end gap-2">
                        <input
                          className="w-24 rounded-lg border border-white/10 bg-zinc-900 px-2 py-1 text-right font-mono text-white outline-none ring-emerald-500/50 transition focus:ring"
                          placeholder="-5 or 12"
                          value={hpEdits[combatant.id] ?? ""}
                          onChange={(event) =>
                            handleHpChange(combatant.id, event.target.value)
                          }
                          onBlur={() => handleHpBlur(combatant.id)}
                          onKeyDown={(event) =>
                            handleKeySubmit(combatant.id, event)
                          }
                          inputMode="numeric"
                        />
                        <button
                          type="button"
                          className="rounded-md bg-emerald-500 px-3 py-1 text-xs font-semibold text-black transition hover:bg-emerald-400"
                          onClick={() => handleHpApply(combatant.id)}
                        >
                          Apply
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
