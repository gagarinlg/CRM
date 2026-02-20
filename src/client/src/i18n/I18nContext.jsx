import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';
import { DEFAULT_LANGUAGE } from './languages.js';

const I18nContext = createContext(null);

// Flat key lookup with fallback
const lookup = (translations, key) => {
  if (!translations) return key;
  return translations[key] ?? key;
};

export const I18nProvider = ({ children }) => {
  const [locale, setLocale] = useState(() => localStorage.getItem('locale') || DEFAULT_LANGUAGE);
  const [translations, setTranslations] = useState({});
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch active languages from the database on mount so the language
  // selector only shows languages that actually have translations.
  useEffect(() => {
    api.get('/i18n/languages').then(res => {
      const data = res.data.data || res.data;
      if (Array.isArray(data) && data.length > 0) setLanguages(data);
    }).catch(() => {});
  }, []);

  // When the user's preferred_language is available (after login), apply it
  // only if the user has never explicitly chosen a language in this browser.
  useEffect(() => {
    const syncUserLang = async () => {
      try {
        const hasExplicitChoice = localStorage.getItem('locale_explicit');
        if (hasExplicitChoice) return;
        const res = await api.get('/auth/me');
        const userData = res.data.data || res.data;
        if (userData?.preferred_language) {
          setLocale(userData.preferred_language);
          localStorage.setItem('locale', userData.preferred_language);
        }
      } catch { /* not logged in */ }
    };
    syncUserLang();
  }, []);

  const loadTranslations = useCallback(async (lang) => {
    try {
      const res = await api.get(`/i18n/${lang}`);
      const data = res.data.data || res.data;
      // Flatten nested object: { common: { save: 'Save' } } => { 'common.save': 'Save' }
      const flat = {};
      const flatten = (obj, prefix = '') => {
        Object.entries(obj).forEach(([k, v]) => {
          const key = prefix ? `${prefix}.${k}` : k;
          if (typeof v === 'object' && v !== null) flatten(v, key);
          else flat[key] = v;
        });
      };
      if (typeof data === 'object') flatten(data);
      setTranslations(flat);
    } catch {
      // Keep previous translations on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTranslations(locale);
  }, [locale, loadTranslations]);

  const changeLocale = (lang) => {
    localStorage.setItem('locale', lang);
    localStorage.setItem('locale_explicit', '1');
    setLocale(lang);
  };

  const t = (key, params) => {
    let text = lookup(translations, key);
    if (params && typeof text === 'string') {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{{${k}}}`, 'g'), v);
      });
    }
    return text;
  };

  return (
    <I18nContext.Provider value={{ t, locale, changeLocale, loading, translations, languages }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
};

export default I18nContext;
