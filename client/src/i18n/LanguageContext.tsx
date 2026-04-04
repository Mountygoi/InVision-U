import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { translations, type Lang } from './translations';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('lang') as Lang) || 'en';
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    const dict = translations[lang];
    let str = (dict as any)[key] ?? (translations.en as any)[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
