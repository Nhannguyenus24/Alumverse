import { useMemo } from 'react';
import { alpha } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import useOrganizationStore from '../stores/organizationStore';
import useThemeModeStore from '../stores/themeModeStore';
import palette, { createBrandPalette } from './palette';
import typography from './typography';
import breakpoints from './breakpoints';
import componentsOverride from './overrides';
import shadows, { customShadows } from './shadows';

const parseConfig = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return {};

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const getOrganizationThemeColors = (organization) => {
  if (!organization) return {};

  const featuresConfig = parseConfig(organization.featuresConfig);
  const brandConfig = parseConfig(organization.brandConfig);
  const brand = featuresConfig.brand_config || featuresConfig.brandConfig || brandConfig.brand_config || brandConfig.brandConfig || brandConfig;
  const themeColors = brand.theme_colors || brand.themeColors || {};

  return {
    primary: themeColors.primary,
    secondary: themeColors.secondary,
    accent: themeColors.accent,
  };
};

const ThemeProvider = ({ children }) => {
  const mode = useThemeModeStore((state) => state.mode);
  const isLight = mode !== 'dark';
  const organization = useOrganizationStore((state) => state.organization);
  const organizationThemeColors = useMemo(() => getOrganizationThemeColors(organization), [organization]);

  const themeOptions = useMemo(
    () => {
      const modePalette = isLight ? palette.light : palette.dark;
      const brandPalette = createBrandPalette(organizationThemeColors, modePalette.mode);

      return {
        palette: {
          ...modePalette,
          ...brandPalette,
          gradients: {
            ...modePalette.gradients,
            ...brandPalette.gradients,
          },
        },
        typography,
        breakpoints,
        shape: { borderRadius: 8 },
        shadows: isLight ? shadows.light : shadows.dark,
        customShadows: isLight ? customShadows.light : customShadows.dark,
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              html: {
                scrollbarColor: `${alpha(modePalette.text.secondary, 0.45)} transparent`,
              },
              '*': {
                scrollbarWidth: 'thin',
                scrollbarColor: `${alpha(modePalette.text.secondary, isLight ? 0.35 : 0.28)} transparent`,
              },
              '*::-webkit-scrollbar': {
                width: 8,
                height: 8,
              },
              '*::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
              '*::-webkit-scrollbar-thumb': {
                borderRadius: 999,
                backgroundColor: alpha(modePalette.text.secondary, isLight ? 0.3 : 0.26),
                border: '2px solid transparent',
                backgroundClip: 'content-box',
              },
              '*::-webkit-scrollbar-thumb:hover': {
                backgroundColor: alpha(modePalette.text.secondary, isLight ? 0.48 : 0.42),
              },
              '*::-webkit-scrollbar-corner': {
                backgroundColor: 'transparent',
              },
              'input[type="date"]::-webkit-calendar-picker-indicator, input[type="datetime-local"]::-webkit-calendar-picker-indicator': {
                filter: isLight ? 'none' : 'invert(1) opacity(0.78)',
              },
            },
          },
        },
      };
    },
    [isLight, mode, organizationThemeColors]
  );

  const theme = createTheme(themeOptions);
  const overrideComponents = componentsOverride(theme);
  theme.components = {
    ...themeOptions.components,
    ...overrideComponents,
    MuiCssBaseline: {
      ...themeOptions.components.MuiCssBaseline,
      ...overrideComponents.MuiCssBaseline,
      styleOverrides: {
        ...themeOptions.components.MuiCssBaseline.styleOverrides,
        ...overrideComponents.MuiCssBaseline?.styleOverrides,
        html: {
          ...themeOptions.components.MuiCssBaseline.styleOverrides.html,
          ...overrideComponents.MuiCssBaseline?.styleOverrides?.html,
        },
        body: {
          ...themeOptions.components.MuiCssBaseline.styleOverrides.body,
          ...overrideComponents.MuiCssBaseline?.styleOverrides?.body,
        },
      },
    },
  };

  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
};

export default ThemeProvider;
