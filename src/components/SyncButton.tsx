import React, { useState } from 'react';
import { useSync } from '../contexts/SyncContext';
import { useAuth } from '../contexts/AuthContext';
import { storageService } from '../lib/storage';
import { Button } from './ui/button';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { cn } from '../lib/utils';

interface SyncButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onSyncComplete?: () => void;
  onSyncError?: (error: string) => void;
}

export function SyncButton({ 
  className, 
  variant = 'outline',
  size = 'sm',
  onSyncComplete,
  onSyncError 
}: SyncButtonProps) {
  const { state, startSync, syncSuccess, syncError } = useSync();
  const { currentUser } = useAuth();
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const handleManualSync = async () => {
    if (!currentUser || state.status === 'syncing' || isManualSyncing) {
      return;
    }

    setIsManualSyncing(true);
    startSync();

    try {
      // Trigger a sync operation by loading user data
      // This will refresh the data from Firebase
      const uid = currentUser.uid;
      
      // Load all user data to trigger sync
      await Promise.all([
        storageService.loadUserProfile(uid),
        storageService.loadAllInvestmentDecisions(uid),
        storageService.loadAllRiskAssessments(uid),
      ]);

      syncSuccess();
      onSyncComplete?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Manual sync failed';
      syncError(errorMessage);
      onSyncError?.(errorMessage);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const isDisabled = !currentUser || state.status === 'syncing' || isManualSyncing || !state.isOnline;

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Button
        variant={variant}
        size={size}
        onClick={handleManualSync}
        disabled={isDisabled}
        className={cn(
          'relative',
          state.status === 'error' && 'border-red-300 text-red-600 hover:bg-red-50'
        )}
      >
        {isManualSyncing || state.status === 'syncing' ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
            <span className="ml-2">Syncing...</span>
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            <span className="ml-2">Sync Now</span>
          </>
        )}
      </Button>
      
      <SyncStatusIndicator compact showText={false} />
    </div>
  );
}

// Collapsible sync panel with detailed information
export function SyncPanel({ className }: { className?: string }) {
  const { state, retrySync } = useSync();

  return (
    <div className={cn('bg-white border rounded-lg p-4 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Data Sync Status</h3>
        <SyncStatusIndicator />
      </div>

      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Sync Error</p>
              <p className="text-sm text-red-600">{state.error}</p>
            </div>
            <button
              onClick={retrySync}
              className="bg-red-100 text-red-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium text-gray-700">Status:</span>
          <span className="ml-2 text-gray-600 capitalize">{state.status}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Network:</span>
          <span className="ml-2 text-gray-600">{state.isOnline ? 'Online' : 'Offline'}</span>
        </div>
        {state.lastSyncTime && (
          <div>
            <span className="font-medium text-gray-700">Last Sync:</span>
            <span className="ml-2 text-gray-600">
              {state.lastSyncTime.toLocaleString()}
            </span>
          </div>
        )}
        {state.pendingChanges > 0 && (
          <div>
            <span className="font-medium text-gray-700">Pending:</span>
            <span className="ml-2 text-yellow-600 font-medium">
              {state.pendingChanges} changes
            </span>
          </div>
        )}
      </div>

      <div className="pt-2 border-t">
        <SyncButton onSyncComplete={() => {
          // You could add a success message here
        }} />
      </div>
    </div>
  );
}