import { setupWorker } from 'msw/browser';
import { handlers, hybridHandlers } from './handlers';

const activeHandlers =
  import.meta.env.VITE_USE_MOCK === 'hybrid' ? hybridHandlers : handlers;

export const worker = setupWorker(...activeHandlers);
