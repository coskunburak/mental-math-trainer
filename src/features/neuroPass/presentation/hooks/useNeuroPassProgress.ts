import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { NeuroPassDashboard } from '@features/neuroPass/domain/models/NeuroPassDashboard';
import { LoadNeuroPassDashboard, NEURO_PASS_DEFAULT_DASHBOARD } from '@features/neuroPass/domain/usecases/LoadNeuroPassDashboard';

interface NeuroPassProgressState {
  loading: boolean;
  dashboard: NeuroPassDashboard;
}

export function useNeuroPassProgress(loadDashboard: LoadNeuroPassDashboard) {
  const [state, setState] = useState<NeuroPassProgressState>({
    loading: true,
    dashboard: NEURO_PASS_DEFAULT_DASHBOARD,
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async (strategy: 'cached_then_remote' | 'cached_only' = 'cached_then_remote') => {
    setState((previous) => ({
      ...previous,
      loading: true,
    }));

    const cached = await loadDashboard.execute({ strategy: 'cached_first' });
    if (!mountedRef.current) {
      return;
    }

    setState({
      loading: strategy !== 'cached_only',
      dashboard: cached,
    });

    if (strategy === 'cached_only') {
      return;
    }

    const refreshed = await loadDashboard.execute({ strategy: 'remote_first' });
    if (!mountedRef.current) {
      return;
    }

    setState({
      loading: false,
      dashboard: refreshed,
    });
  }, [loadDashboard]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(
    () => ({
      state,
      refresh,
    }),
    [refresh, state],
  );
}
