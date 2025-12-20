import { createContext, useContext } from 'react';

// Core context + hook exported from a file that does NOT export components
// This keeps files that export React components free of non-component exports
export const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);
