import { alpha, getContrastRatio } from '@mui/material/styles';

function createGradient(color1, color2) {
  return `linear-gradient(to bottom, ${color1}, ${color2})`;
}

const PRIMARY = {
  lighter: '#F1F8FF',
  light: '#CFE6FF',
  main: '#013F83',
  dark: '#012B59',
  darker: '#00152b',
};

const SECONDARY = {
  lighter: '#cecece',
  light: '#8C8C8C',
  main: '#40454B',
  dark: '#131313',
  darker: '#000000',
};

const ACCENT = {
  lighter: '#FFF8E1',
  light: '#FFE082',
  main: '#FFB300',
  dark: '#C68400',
  darker: '#6D4700',
};

const INFO = {
  lighter: '#E1F5FE',
  light: '#4FC3F7',
  main: '#0277BD',
  dark: '#01579B',
  darker: '#003C70',
};

const SUCCESS = {
  lighter: '#ddffdd',
  light: '#66db66',
  main: '#00A500',
  dark: '#005a00',
  darker: '#004400',
};

const WARNING = {
  lighter: '#fff4bb',
  light: '#f7db51',
  main: '#DFBA00',
  dark: '#998000',
  darker: '#5a4b00',
};

const ERROR = {
  lighter: '#ffcece',
  light: '#ff5e5e',
  main: '#E70000',
  dark: '#910000',
  darker: '#550000',
};

const GREY = {
  0: '#FFFFFF',
  100: '#F9FAFB',
  200: '#F4F6F8',
  300: '#DFE3E8',
  400: '#C4CDD5',
  500: '#919EAB',
  600: '#637381',
  700: '#454F5B',
  800: '#212B36',
  900: '#161C24',
  500_8: alpha('#919EAB', 0.08),
  500_12: alpha('#919EAB', 0.12),
  500_16: alpha('#919EAB', 0.16),
  500_24: alpha('#919EAB', 0.24),
  500_32: alpha('#919EAB', 0.32),
  500_48: alpha('#919EAB', 0.48),
  500_56: alpha('#919EAB', 0.56),
  500_80: alpha('#919EAB', 0.8),
};

const GRADIENTS = {
  primary: createGradient(PRIMARY.light, PRIMARY.main),
  accent: createGradient(ACCENT.light, ACCENT.main),
  info: createGradient(INFO.light, INFO.main),
  success: createGradient(SUCCESS.light, SUCCESS.main),
  warning: createGradient(WARNING.light, WARNING.main),
  error: createGradient(ERROR.light, ERROR.main),
};

const FOOTER = {
  main: '#013F83',
  dark: '#012B59',
  contrastText: '#fff',
};

const TERTIARY = {
  main: '#212B36',
  dark: '#161C24',
  contrastText: '#fff',
};

export const DEFAULT_BRAND_COLORS = {
  primary: PRIMARY.main,
  secondary: SECONDARY.main,
  accent: ACCENT.main,
};

const isValidHexColor = (value) => /^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(String(value || '').trim());

export const normalizeHexColor = (value, fallback) => {
  const color = String(value || '').trim();
  if (!isValidHexColor(color)) return fallback;

  if (color.length === 4) {
    const [, r, g, b] = color;
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  return color;
};

const hexToHsl = (hex) => {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: l * 100 };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;

  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
      break;
  }

  return { h: h * 60, s: s * 100, l: l * 100 };
};

const hslToHex = ({ h, s, l }) => {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.min(100, Math.max(0, s)) / 100;
  const light = Math.min(100, Math.max(0, l)) / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (value) => Math.round((value + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const createHslTone = (base, saturationRatio, lightness) => hslToHex({
  h: base.h,
  s: base.s * saturationRatio,
  l: lightness,
});

export const createBrandColor = (mainColor, fallback = PRIMARY.main, mode = 'light') => {
  const sourceMain = normalizeHexColor(mainColor, fallback);
  const base = hexToHsl(sourceMain);
  const main = mode === 'dark'
    ? createHslTone(base, 0.68, Math.max(base.l + 28, 54))
    : sourceMain;
  const contrastTarget = mode === 'dark' ? '#101418' : '#fff';
  const fallbackContrast = mode === 'dark' ? '#fff' : '#000';
  const mainBase = hexToHsl(main);

  return {
    lighter: mode === 'dark'
      ? createHslTone(mainBase, 0.42, Math.min(mainBase.l + 34, 90))
      : createHslTone(base, 0.4, 95),
    light: mode === 'dark'
      ? createHslTone(mainBase, 0.6, Math.min(mainBase.l + 18, 78))
      : createHslTone(base, 0.6, 86),
    main,
    dark: mode === 'dark'
      ? createHslTone(mainBase, 0.9, Math.max(mainBase.l - 12, 24))
      : createHslTone(base, 1, Math.max(base.l - 9, 16)),
    darker: mode === 'dark'
      ? createHslTone(mainBase, 1, Math.max(mainBase.l - 24, 16))
      : createHslTone(base, 1, Math.max(base.l - 18, 10)),
    contrastText: getContrastRatio(main, contrastTarget) >= 4.5 ? contrastTarget : fallbackContrast,
  };
};

export const createBrandPalette = (themeColors = {}, mode = 'light') => {
  const primary = createBrandColor(themeColors.primary, DEFAULT_BRAND_COLORS.primary, mode);
  const secondary = createBrandColor(themeColors.secondary, DEFAULT_BRAND_COLORS.secondary, mode);
  const accent = createBrandColor(themeColors.accent, DEFAULT_BRAND_COLORS.accent, mode);

  return {
    primary,
    secondary,
    accent,
    footer: {
      main: primary.main,
      dark: primary.dark,
      contrastText: primary.contrastText,
    },
    gradients: {
      primary: createGradient(primary.light, primary.main),
      accent: createGradient(accent.light, accent.main),
      info: GRADIENTS.info,
      success: GRADIENTS.success,
      warning: GRADIENTS.warning,
      error: GRADIENTS.error,
    },
  };
};

const COMMON = {
  common: { black: '#000', white: '#fff' },
  primary: { ...PRIMARY, contrastText: '#fff' },
  secondary: { ...SECONDARY, contrastText: '#fff' },
  accent: { ...ACCENT, contrastText: '#000' },
  tertiary: { ...TERTIARY },
  footer: { ...FOOTER },
  info: { ...INFO, contrastText: '#fff' },
  success: { ...SUCCESS, contrastText: '#fff' },
  warning: { ...WARNING, contrastText: '#fff' },
  error: { ...ERROR, contrastText: '#fff' },
  grey: GREY,
  gradients: GRADIENTS,
  divider: GREY[500_24],
  action: {
    hover: GREY[500_8],
    selected: GREY[500_16],
    disabled: GREY[500_80],
    disabledBackground: GREY[500_24],
    focus: GREY[500_24],
    hoverOpacity: 0.08,
    disabledOpacity: 0.48,
  },
};

const palette = {
  light: {
    ...COMMON,
    mode: 'light',
    text: { primary: GREY[800], secondary: GREY[600], disabled: GREY[500] },
    background: { paper: '#fff', default: '#fff', neutral: GREY[200] },
    action: { active: GREY[600], ...COMMON.action },
  },
  dark: {
    ...COMMON,
    mode: 'dark',
    text: { primary: '#F4F7FA', secondary: '#B6C2CF', disabled: GREY[600] },
    background: { paper: '#171C22', default: '#101418', neutral: alpha('#C8D2E0', 0.08) },
    divider: alpha('#C8D2E0', 0.14),
    action: {
      active: '#B6C2CF',
      hover: alpha('#C8D2E0', 0.08),
      selected: alpha('#C8D2E0', 0.14),
      disabled: alpha('#C8D2E0', 0.42),
      disabledBackground: alpha('#C8D2E0', 0.12),
      focus: alpha('#C8D2E0', 0.18),
      hoverOpacity: 0.08,
      disabledOpacity: 0.48,
    },
  },
};

export default palette;
