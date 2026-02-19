import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { createKeyValueStore } from '@core/storage/mmkvStore';
import type { KeyValueStore } from '@core/storage/KeyValueStore';
import { storageKeys } from '@core/storage/storageKeys';

import { copyByLanguage, type AppCopy, type AppLanguage } from './copy';

export interface LocalizationContextValue {
  language: AppLanguage;
  copy: AppCopy;
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
}

export const LocalizationContext = createContext<LocalizationContextValue | undefined>(undefined);

export function LocalizationProvider({ children }: PropsWithChildren) {
  const storageRef = useRef<KeyValueStore | null>(null);
  if (!storageRef.current) {
    storageRef.current = createKeyValueStore();
  }

  const storage = storageRef.current;
  const [language, setLanguageState] = useState<AppLanguage>('en');

  useEffect(() => {
    let active = true;
    void storage.getString(storageKeys.appLanguage).then((value) => {
      if (!active) {
        return;
      }

      if (value === 'en' || value === 'tr') {
        setLanguageState(value);
      }
    });

    return () => {
      active = false;
    };
  }, [storage]);

  const setLanguage = useCallback(
    (nextLanguage: AppLanguage) => {
      setLanguageState(nextLanguage);
      void storage.setString(storageKeys.appLanguage, nextLanguage);
    },
    [storage],
  );

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'tr' : 'en');
  }, [language, setLanguage]);

  const value = useMemo<LocalizationContextValue>(() => {
    return {
      language,
      copy: copyByLanguage[language],
      setLanguage,
      toggleLanguage,
    };
  }, [language, setLanguage, toggleLanguage]);

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocalization(): LocalizationContextValue {
  const value = useContext(LocalizationContext);

  if (!value) {
    throw new Error('useLocalization must be used inside LocalizationProvider');
  }

  return value;
}
