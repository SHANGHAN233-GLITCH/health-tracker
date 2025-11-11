import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en';
import zh from './zh';

// Create translation context
const TranslationContext = createContext();

// Translation provider component
export const TranslationProvider = ({ children }) => {
  const [language, setLanguage] = useState('en'); // Default English
  const [rawTranslations, setRawTranslations] = useState(en);

  // Load language preference from storage
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('appLanguage');
        if (savedLanguage) {
          setAppLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Failed to load language settings:', error);
      }
    };

    loadLanguage();
  }, []);

  // Set application language
  const setAppLanguage = (lang) => {
    setLanguage(lang);
    const langFile = lang === 'en' ? en : zh;
    setRawTranslations(langFile);
    // Save to AsyncStorage
    AsyncStorage.setItem('appLanguage', lang);
  };

  // Toggle language
  const toggleLanguage = () => {
    const newLang = language === 'zh' ? 'en' : 'zh';
    setAppLanguage(newLang);
  };

  // Create enhanced proxy object to ensure safe translations
  const translations = new Proxy(rawTranslations, {
    get: (target, prop) => {
      // Handle symbols and other special properties
      if (typeof prop !== 'string') {
        return target[prop];
      }
      // Get the value from target
      const value = target[prop];
      // Ensure we always return a string, never undefined/null/dot or other problematic values
      if (value === undefined || value === null || value === '.') {
        return '';
      }
      // Ensure it's a string type
      return String(value);
    }
  });

  return (
    <TranslationContext.Provider value={{ language, translations, toggleLanguage, setAppLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
};

// Custom hook for easy use in components
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  
  // Translation function - supports parameterized translations
  const t = (key, params = {}) => {
    const { translations } = context;
    // 确保只有当键存在于translations对象中且值不为undefined/null时才使用它，否则返回空字符串
    let text = translations[key] !== undefined && translations[key] !== null ? translations[key] : '';
    
    // Replace parameters
    Object.keys(params).forEach(param => {
      text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
    });
    
    return text;
  };
  
  return { ...context, t };
};