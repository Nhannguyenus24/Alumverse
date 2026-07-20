import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Vietnamese is the default + fallback language, so it is bundled into the entry
// chunk. English is loaded on demand (see ensureLanguageLoaded) to keep the
// initial download light.
import commonVi from './locales/vi/common.json';
import navVi from './locales/vi/nav.json';
import authVi from './locales/vi/auth.json';
import articleVi from './locales/vi/article.json';
import mentorshipVi from './locales/vi/mentorship.json';
import eventVi from './locales/vi/event.json';
import profileVi from './locales/vi/profile.json';
import adminVi from './locales/vi/admin.json';
import forumVi from './locales/vi/forum.json';
import donationVi from './locales/vi/donation.json';
import networkVi from './locales/vi/network.json';
import homeVi from './locales/vi/home.json';
import honorsVi from './locales/vi/honors.json';
import footerVi from './locales/vi/footer.json';
import notificationVi from './locales/vi/notification.json';
import contactVi from './locales/vi/contact.json';
import devVi from './locales/vi/dev.json';
import settingsVi from './locales/vi/settings.json';
import surveyVi from './locales/vi/survey.json';
import commentVi from './locales/vi/comment.json';
import errorsVi from './locales/vi/errors.json';

const STORAGE_KEY = 'app_language';
const DEFAULT_LANGUAGE = 'vi';

const NAMESPACES = ['common', 'nav', 'auth', 'article', 'mentorship', 'event', 'profile', 'admin', 'forum', 'donation', 'network', 'home', 'honors', 'footer', 'notification', 'contact', 'dev', 'settings', 'survey', 'comment', 'errors'];

const savedLanguage = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;

i18n.use(initReactI18next).init({
  lng: savedLanguage,
  fallbackLng: 'vi',
  ns: NAMESPACES,
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
      survey: surveyVi,
      comment: commentVi,
      errors: errorsVi,
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

// Track which on-demand languages have already been registered.
const loadedLanguages = new Set(['vi']);

/**
 * Lazily fetch and register a language bundle (currently only English is split
 * out). Resolves once i18next has the resources available so the caller can
 * safely switch to it without missing translations.
 */
const ensureLanguageLoaded = async (lang) => {
  if (loadedLanguages.has(lang)) return;
  if (lang === 'en') {
    const { default: enResources } = await import('./locales/en/resources');
    NAMESPACES.forEach((ns) => {
      i18n.addResourceBundle('en', ns, enResources[ns], true, true);
    });
    loadedLanguages.add('en');
  }
};

// If the user's saved preference is a deferred language, load it right away.
if (savedLanguage !== DEFAULT_LANGUAGE) {
  ensureLanguageLoaded(savedLanguage).then(() => {
    if (i18n.language !== savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  });
}

export const changeLanguage = async (lang) => {
  await ensureLanguageLoaded(lang);
  i18n.changeLanguage(lang);
  localStorage.setItem(STORAGE_KEY, lang);
};
