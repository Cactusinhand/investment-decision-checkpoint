import React, { useEffect, useState } from 'react';
import { useNotifications, Notification } from '../contexts/NotificationContext';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export function NotificationContainer() {
  const { notifications, dismissNotification } = useNotifications();
  const [visibleNotifications, setVisibleNotifications] = useState<string[]>([]);

  useEffect(() => {
    // Add new notifications to visible list with animation
    const newNotifications = notifications.filter(n => !visibleNotifications.includes(n.id));
    if (newNotifications.length > 0) {
      setVisibleNotifications(prev => [...prev, ...newNotifications.map(n => n.id)]);
    }

    // Remove dismissed notifications from visible list
    const allIds = notifications.map(n => n.id);
    setVisibleNotifications(prev => prev.filter(id => allIds.includes(id)));
  }, [notifications, visibleNotifications]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getColors = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={() => dismissNotification(notification.id)}
          isVisible={visibleNotifications.includes(notification.id)}
          getIcon={getIcon}
          getColors={getColors}
        />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onDismiss: () => void;
  isVisible: boolean;
  getIcon: (type: Notification['type']) => React.ReactNode;
  getColors: (type: Notification['type']) => string;
  key?: string;
}

function NotificationItem({ 
  notification, 
  onDismiss, 
  isVisible, 
  getIcon, 
  getColors 
}: NotificationItemProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 300); // Match the exit animation duration
  };

  return (
    <div
      className={cn(
        'transform transition-all duration-300 ease-in-out',
        'border rounded-lg shadow-lg p-4 min-w-[300px] max-w-md',
        getColors(notification.type),
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      )}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium truncate">
              {notification.title}
            </h4>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {notification.message && (
            <p className="mt-1 text-sm opacity-90">
              {notification.message}
            </p>
          )}
          
          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-3 flex space-x-2">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.onClick();
                    handleDismiss();
                  }}
                  className={cn(
                    'text-xs px-2 py-1 rounded font-medium transition-colors',
                    action.variant === 'outline'
                      ? 'bg-white border border-current opacity-70 hover:opacity-100'
                      : action.variant === 'ghost'
                      ? 'hover:bg-black hover:bg-opacity-10'
                      : 'bg-black bg-opacity-10 hover:bg-opacity-20'
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
          
          <div className="mt-2 text-xs opacity-60">
            {notification.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for easy sync notifications
export function useSyncNotifications() {
  const { showSuccess, showError, showWarning, showInfo } = useNotifications();

  const showSyncSuccess = (message?: string) => {
    showSuccess('Data Synced', message || 'Your data has been successfully synced to the cloud.');
  };

  const showSyncError = (error: string, onRetry?: () => void) => {
    showError(
      'Sync Failed',
      error,
      onRetry ? [{ label: 'Retry', onClick: onRetry }] : undefined
    );
  };

  const showSyncWarning = (message: string) => {
    showWarning('Sync Warning', message);
  };

  const showSyncInfo = (message: string) => {
    showInfo('Sync Info', message);
  };

  return {
    showSyncSuccess,
    showSyncError,
    showSyncWarning,
    showSyncInfo,
  };
}