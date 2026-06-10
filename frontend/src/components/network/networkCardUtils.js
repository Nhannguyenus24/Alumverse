export function formatAcademicValue(value, fallback) {
  if (Array.isArray(value)) {
    const items = value.filter(Boolean);
    return items.length > 0 ? items.join(' · ') : fallback;
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const items = parsed.filter(Boolean);
        return items.length > 0 ? items.join(' · ') : fallback;
      }
    } catch {
      return value;
    }
    return value;
  }

  return fallback;
}
