import { FORCE_DEMO, isFirebaseConfigured } from '../config/firebase.config';
import { firebaseBackend } from './firebaseBackend';
import { mockBackend } from './mockBackend';
import { Backend } from './types';

// The single place that decides which backend the app uses.
export const backend: Backend = isFirebaseConfigured && !FORCE_DEMO ? firebaseBackend : mockBackend;
