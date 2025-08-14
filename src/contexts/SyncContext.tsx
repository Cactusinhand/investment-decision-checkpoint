import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { storageService } from '../lib/storage';
import { auth } from '../lib/firebase';

// Sync status types
export type SyncStatus = 'synced' | 'syncing' | 'error' | 'offline';

interface SyncState {
  status: SyncStatus;
  lastSyncTime: Date | null;
  error: string | null;
  isOnline: boolean;
  pendingChanges: number;
}

type SyncAction =
  | { type: 'SET_STATUS'; payload: SyncStatus }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'SET_PENDING_CHANGES'; payload: number }
  | { type: 'SYNC_SUCCESS' }
  | { type: 'SYNC_START' }
  | { type: 'RESET' };

const initialState: SyncState = {
  status: 'synced',
  lastSyncTime: null,
  error: null,
  isOnline: navigator.onLine,
  pendingChanges: 0,
};

function syncReducer(state: SyncState, action: SyncAction): SyncState {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, status: action.payload ? 'error' : state.status };
    case 'SET_ONLINE':
      return { 
        ...state, 
        isOnline: action.payload,
        status: action.payload ? state.status : 'offline'
      };
    case 'SET_PENDING_CHANGES':
      return { ...state, pendingChanges: action.payload };
    case 'SYNC_START':
      return { ...state, status: 'syncing', error: null };
    case 'SYNC_SUCCESS':
      return { 
        ...state, 
        status: 'synced', 
        lastSyncTime: new Date(),
        error: null,
        pendingChanges: Math.max(0, state.pendingChanges - 1)
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface SyncContextType {
  state: SyncState;
  startSync: () => void;
  syncSuccess: () => void;
  syncError: (error: string) => void;
  setPendingChanges: (count: number) => void;
  retrySync: () => void;
  isSyncing: () => boolean;
  hasError: () => boolean;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

interface SyncProviderProps {
  children: ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  const [state, dispatch] = useReducer(syncReducer, initialState);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE', payload: true });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE', payload: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (state.isOnline && state.status === 'offline' && state.pendingChanges > 0) {
      // Small delay to ensure network is ready
      const timer = setTimeout(() => {
        retrySync();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.isOnline, state.pendingChanges]);

  const startSync = () => {
    dispatch({ type: 'SYNC_START' });
  };

  const syncSuccess = () => {
    dispatch({ type: 'SYNC_SUCCESS' });
  };

  const syncError = (error: string) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const setPendingChanges = (count: number) => {
    dispatch({ type: 'SET_PENDING_CHANGES', payload: count });
  };

  const retrySync = () => {
    if (state.isOnline) {
      startSync();
      // Trigger a data refresh by calling a simple storage operation
      // This will be handled by the components that use this context
    }
  };

  const isSyncing = () => state.status === 'syncing';
  const hasError = () => state.status === 'error';

  const value: SyncContextType = {
    state,
    startSync,
    syncSuccess,
    syncError,
    setPendingChanges,
    retrySync,
    isSyncing,
    hasError,
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}

// Hook for components to wrap sync operations
export function useSyncOperation() {
  const { startSync, syncSuccess, syncError, setPendingChanges } = useSync();

  const wrapSyncOperation = async <T,>(
    operation: () => Promise<T>,
    errorMessage: string = 'Sync operation failed'
  ): Promise<T> => {
    try {
      startSync();
      setPendingChanges(prev => prev + 1);
      const result = await operation();
      syncSuccess();
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : errorMessage;
      syncError(errorMsg);
      throw error;
    }
  };

  return { wrapSyncOperation };
}