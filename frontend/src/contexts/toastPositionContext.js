import { createContext } from 'react';

const registerNoop = () => () => {};

const ToastPositionContext = createContext(registerNoop);

export default ToastPositionContext;
