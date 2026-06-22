import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fundApi } from '../../utils/api';
import { buildBankLabelMap } from '../../utils/bankUtils';

export const useSupportedBanks = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['supportedBanks'],
    queryFn: () => fundApi.getSupportedBanks(),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const banks = data?.banks ?? [];
  const labelMap = useMemo(() => buildBankLabelMap(banks), [banks]);

  const getBankLabel = useCallback(
    (bankCode) => labelMap.get(bankCode) || bankCode || '-',
    [labelMap],
  );

  return {
    banks,
    getBankLabel,
    isPending,
    isError,
    message: data?.message,
  };
};
