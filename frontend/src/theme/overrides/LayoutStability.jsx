/**
 * Prevents layout shift when MUI overlays lock body scroll (scrollbar disappears → content jumps).
 * - scrollbar-gutter on html + body: reserve gutter for the element that actually scrolls.
 * - disableScrollLock on Popover/Menu/Select: Modal behind Menu must not set overflow:hidden on body.
 * TextField `select` passes MenuProps via MuiTextField slotProps (see overrides/TextField.jsx).
 */
const LayoutStability = () => ({
  MuiCssBaseline: {
    styleOverrides: {
      html: {
        scrollbarGutter: 'stable',
      },
      body: {
        scrollbarGutter: 'stable',
      },
    },
  },
  MuiPopover: {
    defaultProps: {
      disableScrollLock: true,
    },
  },
  MuiMenu: {
    defaultProps: {
      disableScrollLock: true,
    },
  },
  MuiSelect: {
    defaultProps: {
      MenuProps: {
        disableScrollLock: true,
      },
    },
  },
});

export default LayoutStability;
