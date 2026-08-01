const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidContactEmail = (value) => EMAIL_RE.test(String(value ?? '').trim());

export const PROFILE_CONTACT_FIELDS = [
  {
    key: 'contactEmail',
    labelKey: 'contact_email',
    defaultLabel: 'Email liên hệ',
    placeholder: 'contact@example.com',
    type: 'email',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    placeholder: 'https://facebook.com/username',
    domains: ['facebook.com', 'fb.com'],
  },
  {
    key: 'instagram',
    label: 'Instagram',
    placeholder: 'https://instagram.com/username',
    domains: ['instagram.com'],
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    placeholder: 'https://linkedin.com/in/username',
    domains: ['linkedin.com'],
  },
  {
    key: 'github',
    label: 'GitHub',
    placeholder: 'https://github.com/username',
    domains: ['github.com'],
  },
  {
    key: 'discord',
    label: 'Discord',
    placeholder: 'https://discord.gg/invite-code',
    domains: ['discord.gg', 'discord.com'],
  },
  {
    key: 'website',
    labelKey: 'contact_website',
    defaultLabel: 'Website',
    placeholder: 'https://example.com',
    type: 'url',
  },
];

const emptyContactLinks = () => Object.fromEntries(
  PROFILE_CONTACT_FIELDS.map((field) => [field.key, '']),
);

const parseRawLinks = (raw) => {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
};

const normalizeLinkList = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => String(item ?? '').trim()).filter(Boolean);
};

const normalizeContactValue = (field, raw) => {
  const value = String(raw ?? '').trim();
  if (!value) return '';

  if (field.key === 'contactEmail') {
    return EMAIL_RE.test(value) ? `mailto:${value}` : '';
  }

  if (field.key === 'website' || field.domains) {
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  }

  return value;
};

export const buildProfileContactLinksPayload = (
  values,
  { showContactEmail = true, extras = [] } = {},
) => {
  const contactEmail = String(values?.contactEmail ?? '').trim();
  const social = {};

  PROFILE_CONTACT_FIELDS
    .filter((field) => field.key !== 'contactEmail')
    .forEach((field) => {
      social[field.key] = normalizeContactValue(field, values?.[field.key]);
    });

  return {
    contactEmail,
    showContactEmail: Boolean(showContactEmail && contactEmail && isValidContactEmail(contactEmail)),
    social,
    extras: normalizeLinkList(extras),
  };
};

const buildProfileContactLinks = (values, { showContactEmail = true, extras = [] } = {}) =>
  normalizeProfileLinks(buildProfileContactLinksPayload(values, { showContactEmail, extras }));

export const normalizeProfileLinks = (raw) => {
  const parsed = parseRawLinks(raw);

  if (Array.isArray(parsed)) return normalizeLinkList(parsed);
  if (!parsed || typeof parsed !== 'object') return [];

  const links = [];
  const contactEmail = String(parsed.contactEmail ?? parsed.email ?? '').trim();

  if (parsed.showContactEmail && contactEmail && isValidContactEmail(contactEmail)) {
    links.push(`mailto:${contactEmail}`);
  }

  const social = parsed.social && typeof parsed.social === 'object' ? parsed.social : parsed;
  PROFILE_CONTACT_FIELDS
    .filter((field) => field.key !== 'contactEmail')
    .forEach((field) => {
      const value = normalizeContactValue(field, social[field.key]);
      if (value) links.push(value);
    });

  return [...links, ...normalizeLinkList(parsed.extras)];
};

export const parseProfileContactLinks = (raw) => {
  const parsed = parseRawLinks(raw);
  const values = emptyContactLinks();

  if (parsed && !Array.isArray(parsed) && typeof parsed === 'object') {
    const social = parsed.social && typeof parsed.social === 'object' ? parsed.social : parsed;
    values.contactEmail = String(parsed.contactEmail ?? parsed.email ?? '').trim();

    PROFILE_CONTACT_FIELDS
      .filter((field) => field.key !== 'contactEmail')
      .forEach((field) => {
        values[field.key] = String(social[field.key] ?? '').trim();
      });

    return {
      values,
      extras: normalizeLinkList(parsed.extras),
      showContactEmail: Boolean(parsed.showContactEmail),
    };
  }

  const extras = [];

  normalizeLinkList(parsed).forEach((link) => {
    const clean = link.trim();
    const lower = clean.toLowerCase();
    const bareEmail = lower.startsWith('mailto:') ? clean.slice(7).trim() : clean;

    if (!values.contactEmail && EMAIL_RE.test(bareEmail)) {
      values.contactEmail = bareEmail;
      return;
    }

    const field = PROFILE_CONTACT_FIELDS.find((item) =>
      item.domains?.some((domain) => lower.includes(domain)),
    );

    if (field && !values[field.key]) {
      values[field.key] = clean;
      return;
    }

    if (!values.website && /^https?:\/\//i.test(clean)) {
      values.website = clean;
      return;
    }

    extras.push(clean);
  });

  return { values, extras, showContactEmail: Boolean(values.contactEmail) };
};

export const normalizeProfileContactLinksPayload = (raw) => {
  const parsed = parseProfileContactLinks(raw);
  return buildProfileContactLinksPayload(parsed.values, {
    showContactEmail: parsed.showContactEmail,
    extras: parsed.extras,
  });
};

export const getPublicContactEmail = (raw) => {
  const parsed = parseRawLinks(raw);

  if (parsed && !Array.isArray(parsed) && typeof parsed === 'object') {
    const contactEmail = String(parsed.contactEmail ?? parsed.email ?? '').trim();
    return parsed.showContactEmail && isValidContactEmail(contactEmail) ? contactEmail : '';
  }

  const { values } = parseProfileContactLinks(raw);
  return values.contactEmail || '';
};
