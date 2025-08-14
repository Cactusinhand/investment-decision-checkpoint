import React from 'react';
import { useSync } from '../contexts/SyncContext';
import { cn } from '../lib/utils';

interface SyncStatusIndicatorProps {
  className?: string;
  showText?: boolean;
  compact?: boolean;
}

export function SyncStatusIndicator({ 
  className, 
  showText = true, 
  compact = false 
}: SyncStatusIndicatorProps) {
  const { state, retrySync } = useSync();

  const getStatusConfig = () => {
    switch (state.status) {
      case 'syncing':
        return {
          icon: (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
          ),
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          text: 'Syncing...',
        };
      case 'error':
        return {
          icon: (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ),
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          text: state.error || 'Sync failed',
        };
      case 'offline':
        return {
          icon: (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 3.636a1 1 0 010 1.414 7 7 0 000 9.9 1 1 0 11-1.414 1.414 9 9 0 010-12.728 1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414zM7.879 6.464a1 1 0 010 1.414 3 3 0 000 4.243 1 1 0 11-1.415 1.414 5 5 0 010-7.07 1 1 0 011.415 0zm4.242 0a1 1 0 011.415 0 5 5 0 010 7.072 1 1 0 01-1.415-1.415 3 3 0 000-4.242 1 1 0 010-1.415zM10 9a1 1 0 011 1v.01a1 1 0 11-2 0V10a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          ),
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          text: 'Offline',
        };
      case 'synced':
      default:
        return {
          icon: (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ),
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          text: 'Synced',
        };
    }
  };

  const config = getStatusConfig();

  if (compact) {
    return (
      <div 
        className={cn(
          'flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-colors',
          config.bgColor,
          config.color,
          className
        )}
        title={config.text}
      >
        {config.icon}
        {state.pendingChanges > 0 && (
          <span className="bg-yellow-500 text-white rounded-full px-1 py-0.5 text-xs">
            {state.pendingChanges}
          </span>
        )}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        config.bgColor,
        config.color,
        className
      )}
    >
      {config.icon}
      {showText && (
        <div className="flex items-center space-x-2">
          <span>{config.text}</span>
          {state.pendingChanges > 0 && (
            <span className="bg-yellow-500 text-white rounded-full px-2 py-1 text-xs">
              {state.pendingChanges} pending
            </span>
          )}
        </div>
      )}
      {state.status === 'error' && (
        <button
          onClick={retrySync}
          className="ml-2 text-xs bg-white border border-red-300 text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
        >
          Retry
        </button>
      )}
      {state.lastSyncTime && showText && (
        <span className="text-xs opacity-70 ml-2">
          {state.lastSyncTime.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

// Sync status badge for inline use
export function SyncStatusBadge({ className }: { className?: string }) {
  const { state } = useSync();

  const getStatusColor = () => {
    switch (state.status) {
      case 'syncing': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      case 'synced': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = () => {
    switch (state.status) {
      case 'syncing': return 'Syncing';
      case 'error': return 'Error';
      case 'offline': return 'Offline';
      case 'synced': return 'Synced';
      default: return 'Unknown';
    }
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      getStatusColor(),
      className
    )}>
      {getStatusText()}
      {state.pendingChanges > 0 && (
        <span className="ml-1 bg-yellow-500 text-white rounded-full px-1 py-0.5 text-xs">
          {state.pendingChanges}
        </span>
      )}
    </span>
  );
}