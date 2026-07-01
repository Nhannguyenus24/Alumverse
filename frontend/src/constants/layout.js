/**
 * Real rendered height of the fixed site header (AppBar) in pixels, per breakpoint.
 *
 * The header content (nav items with vertical padding) makes the AppBar taller
 * than the bare MUI Toolbar minHeight (56/64). This is the single source of truth
 * used to:
 *  - set the AppBar's minimum height,
 *  - reserve space below the fixed header (the spacer in MainLayout),
 *  - position elements anchored to the bottom of the header (e.g. banners),
 *  - size full-viewport pages such as chat (`calc(100dvh - HEADER_HEIGHT)`).
 *
 * Keeping these in sync prevents the header from overlapping page content.
 */
export const HEADER_HEIGHT = { xs: 72, md: 72 };
