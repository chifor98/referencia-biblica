'use client';

import { useCallback, useState } from 'react';
import { DEFAULT_MIC_SETTINGS, loadMicSettings, saveMicSettings, type MicSettings } from '@/lib/mic-settings';

export function useMicSettings() {
  // Inicializador perezoso (en vez de useState(DEFAULT) + useEffect que carga
  // localStorage) — loadMicSettings() ya es seguro en SSR (devuelve los
  // valores por defecto si `window` no existe) y el modal de ajustes solo se
  // monta cuando el usuario lo abre, así que no hay riesgo de mismatch de hidratación.
  const [settings, setSettings] = useState<MicSettings>(() => loadMicSettings());

  const update = useCallback((updater: (prev: MicSettings) => MicSettings) => {
    setSettings((prev) => {
      const next = updater(prev);
      saveMicSettings(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_MIC_SETTINGS);
    saveMicSettings(DEFAULT_MIC_SETTINGS);
  }, []);

  return { settings, update, reset };
}
