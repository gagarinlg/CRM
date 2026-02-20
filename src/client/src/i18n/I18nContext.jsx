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
  const [loading, setLoading] = useState(true);

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
    <I18nContext.Provider value={{ t, locale, changeLocale, loading, translations }}>
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
