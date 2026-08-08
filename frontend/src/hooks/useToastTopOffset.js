import { useContext, useLayoutEffect } from 'react';
import ToastPositionContext from '../contexts/toastPositionContext';

export const useToastTopOffset = (offset) => {
  const registerToastTopOffset = useContext(ToastPositionContext);

  useLayoutEffect(
    () => registerToastTopOffset(offset),
    [offset, registerToastTopOffset]
  );
};
