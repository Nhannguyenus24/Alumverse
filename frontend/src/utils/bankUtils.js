const formatBankLabel = (bank) => {
  const shortName = bank?.short_name || bank?.shortName;
  const code = bank?.code;
  const name = bank?.name;
  if (shortName && code) return `${shortName} (${code})`;
  return name || code || '-';
};

export const buildBankLabelMap = (banks) => {
  const map = new Map();
  (banks || []).forEach((bank) => {
    if (bank?.code) {
      map.set(bank.code, formatBankLabel(bank));
    }
  });
  return map;
};

export const formatReceivingInfoOptionLabel = (info, getBankLabel) => {
  const bankLabel = getBankLabel(info?.bankName);
  return `${bankLabel} — ${info?.accountName || '-'} — ${info?.accountNumber || '-'}`;
};
