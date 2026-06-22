export function formatRiskLevel(level) {
  const map = {
    low: 'Low attention-support need',
    medium: 'Medium attention-support need',
    high: 'High attention-support need',
  };
  return map[level] || level;
}

export function riskBadgeClass(level) {
  return `badge badge-${level}`;
}

export function formatMs(ms) {
  if (!ms && ms !== 0) return '—';
  return `${Math.round(ms)} ms`;
}

export function formatPercent(value) {
  if (value == null) return '—';
  const normalized = value <= 1 ? value * 100 : value;
  return `${Math.round(normalized)}%`;
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function reportStatusLabel(status) {
  const labels = {
    pending: 'Pending',
    generated: 'Generated — awaiting review',
    reviewed: 'Reviewed',
  };
  return labels[status] || status;
}
