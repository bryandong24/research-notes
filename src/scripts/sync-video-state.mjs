export function claimGroupInitialization(group) {
  if (group.dataset.initialized === "true") return false;
  group.dataset.initialized = "true";
  return true;
}

export function sourceSwitchPlan({ timeline, playing, duration }) {
  const finiteDuration = Number.isFinite(duration) ? Math.max(0, duration) : 0;
  const seekTime =
    finiteDuration > 0
      ? Math.min(Math.max(0, timeline), Math.max(0, finiteDuration - 0.04))
      : Math.max(0, timeline);
  return {
    timeline,
    playing,
    seekTime,
    resume: Boolean(playing && finiteDuration > 0 && timeline < finiteDuration - 0.04)
  };
}

export function unavailableSourceIds(selectedIds, currentId) {
  return new Set(selectedIds.filter((id) => id !== currentId));
}
