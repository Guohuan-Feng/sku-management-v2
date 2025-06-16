// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en.json';
import zhTranslation from './locales/zh.json';

i18n
  .use(LanguageDetector) // 检测用户语言
  .use(initReactI18next) // 将 i18next 实例传递给 react-i18next
  .init({
    resources: {
      en: {
        translation: enTranslation.translation
      },
      zh: {
        translation: zhTranslation.translation
      }
    },
    fallbackLng: 'en', // 如果检测不到语言，则使用英文
    debug: false, // 生产环境请设为 false
    interpolation: {
      escapeValue: false // React 默认会转义，所以不需要 i18next 再次转义
    },
    detection: {
      order: ['localStorage', 'navigator'], // 优先从 localStorage 获取语言设置
      caches: ['localStorage'], // 缓存语言设置到 localStorage
    }
  });

export default i18n;