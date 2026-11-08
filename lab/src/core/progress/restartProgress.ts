// Run before either progress ledger reads its initial in-memory state.
try {
  if (localStorage.getItem('requireRestartProgress') !== 'false') {
    localStorage.setItem('requireRestartProgress', 'true');
    localStorage.removeItem('sterilab:levelProgress');
    localStorage.removeItem('sterilab:evaluationProgress');
    localStorage.setItem('requireRestartProgress', 'false');
  }
} catch {
  // Storage may be unavailable; retry the migration on the next load.
}
