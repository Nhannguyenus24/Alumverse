import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import commonVi from './locales/vi/common.json';
import commonEn from './locales/en/common.json';
import navVi from './locales/vi/nav.json';
import navEn from './locales/en/nav.json';
import authVi from './locales/vi/auth.json';
import authEn from './locales/en/auth.json';
import articleVi from './locales/vi/article.json';
import articleEn from './locales/en/article.json';
import mentorshipVi from './locales/vi/mentorship.json';
import mentorshipEn from './locales/en/mentorship.json';
import eventVi from './locales/vi/event.json';
import eventEn from './locales/en/event.json';
import profileVi from './locales/vi/profile.json';
import profileEn from './locales/en/profile.json';
import adminVi from './locales/vi/admin.json';
import adminEn from './locales/en/admin.json';
import forumVi from './locales/vi/forum.json';
import forumEn from './locales/en/forum.json';
import donationVi from './locales/vi/donation.json';
import donationEn from './locales/en/donation.json';
import networkVi from './locales/vi/network.json';
import networkEn from './locales/en/network.json';
import homeVi from './locales/vi/home.json';
import homeEn from './locales/en/home.json';
import honorsVi from './locales/vi/honors.json';
import honorsEn from './locales/en/honors.json';
import footerVi from './locales/vi/footer.json';
import footerEn from './locales/en/footer.json';
import notificationVi from './locales/vi/notification.json';
import notificationEn from './locales/en/notification.json';
import contactVi from './locales/vi/contact.json';
import contactEn from './locales/en/contact.json';
import devVi from './locales/vi/dev.json';
import devEn from './locales/en/dev.json';
import settingsVi from './locales/vi/settings.json';
import settingsEn from './locales/en/settings.json';

const STORAGE_KEY = 'app_language';
const DEFAULT_LANGUAGE = 'vi';

const savedLanguage = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;

i18n.use(initReactI18next).init({
  lng: savedLanguage,
  fallbackLng: 'vi',
  ns: ['common', 'nav', 'auth', 'article', 'mentorship', 'event', 'profile', 'admin', 'forum', 'donation', 'network', 'home', 'honors', 'footer', 'notification', 'contact', 'dev', 'settings'],
  defaultNS: 'common',
  resources: {
    vi: {
      common: commonVi,
      nav: navVi,
      auth: authVi,
      article: articleVi,
      mentorship: mentorshipVi,
      event: eventVi,
      profile: profileVi,
      admin: adminVi,
      forum: forumVi,
      donation: donationVi,
      network: networkVi,
      home: homeVi,
      honors: honorsVi,
      footer: footerVi,
      notification: notificationVi,
      contact: contactVi,
      dev: devVi,
      settings: settingsVi,
    },
    en: {
      common: commonEn,
      nav: navEn,
      auth: authEn,
      article: articleEn,
      mentorship: mentorshipEn,
      event: eventEn,
      profile: profileEn,
      admin: adminEn,
      forum: forumEn,
      donation: donationEn,
      network: networkEn,
      home: homeEn,
      honors: honorsEn,
      footer: footerEn,
      notification: notificationEn,
      contact: contactEn,
      dev: devEn,
      settings: settingsEn,
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

export const changeLanguage = (lang) => {
  i18n.changeLanguage(lang);
  localStorage.setItem(STORAGE_KEY, lang);
};

export default i18n;
