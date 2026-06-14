import { useCallback, useMemo, useRef } from 'react';

const MESSAGES_PREVIEW_MENU_PAPER_SX = {
  width: 360,
  height: 480,
  maxHeight: 'min(480px, calc(100vh - 32px))',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
};

const MESSAGES_PREVIEW_MENU_LIST_SX = {
  p: 0,
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
};

export function useMessagesPreviewMenu(paperSxExtra = {}) {
  const menuActionsRef = useRef(null);

  const updateMenuPosition = useCallback(() => {
    menuActionsRef.current?.updatePosition?.();
  }, []);

  const slotProps = useMemo(
    () => ({
      paper: {
        sx: {
          ...MESSAGES_PREVIEW_MENU_PAPER_SX,
          ...paperSxExtra,
        },
      },
      list: {
        sx: MESSAGES_PREVIEW_MENU_LIST_SX,
      },
      transition: {
        onEntered: updateMenuPosition,
      },
    }),
    [paperSxExtra, updateMenuPosition],
  );

  return {
    menuActionsRef,
    slotProps,
    updateMenuPosition,
  };
}
