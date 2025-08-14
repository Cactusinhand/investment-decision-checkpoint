import React, { useState, useEffect } from 'react';
import { storageService } from '../lib/storage';
import { auth } from '../lib/firebase';

interface DebugInfo {
  firebaseConfig: {
    hasApiKey: boolean;
    hasProjectId: boolean;
    hasStorageBucket: boolean;
    storageBucket?: string;
  };
  authStatus: {
    isAuthenticated: boolean;
    user?: {
      uid: string;
      email: string;
      displayName: string;
    };
  };
  storageTest: {
    canAccess: boolean;
    error?: string;
    filesFound?: number;
  };
  dataLoad: {
    decisionsLoaded: number;
    riskAssessmentsLoaded: number;
    error?: string;
  };
}

export const FirebaseDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const runDiagnostic = async () => {
    setIsTesting(true);
    const info: DebugInfo = {
      firebaseConfig: {
        hasApiKey: !!process.env.REACT_APP_FIREBASE_API_KEY,
        hasProjectId: !!process.env.REACT_APP_FIREBASE_PROJECT_ID,
        hasStorageBucket: !!process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      },
      authStatus: {
        isAuthenticated: false,
      },
      storageTest: {
        canAccess: false,
      },
      dataLoad: {
        decisionsLoaded: 0,
        riskAssessmentsLoaded: 0,
      },
    };

    // Check auth status
    const currentUser = auth?.currentUser;
    if (currentUser) {
      info.authStatus = {
        isAuthenticated: true,
        user: {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || '',
        },
      };

      // Test storage access
      try {
        if (currentUser.uid) {
          // Try to load user profile
          const profile = await storageService.loadUserProfile(currentUser.uid);
          info.storageTest.canAccess = profile !== null;

          // Load decisions
          const decisions = await storageService.loadAllInvestmentDecisions(currentUser.uid);
          info.dataLoad.decisionsLoaded = decisions.length;

          // Load risk assessments
          const assessments = await storageService.loadAllRiskAssessments(currentUser.uid);
          info.dataLoad.riskAssessmentsLoaded = assessments.length;

          info.storageTest.filesFound = decisions.length + assessments.length;
        }
      } catch (error) {
        info.storageTest.error = error instanceof Error ? error.message : 'Unknown error';
        info.dataLoad.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    setDebugInfo(info);
    setIsTesting(false);
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Firebase诊断工具</h3>
      
      <button
        onClick={runDiagnostic}
        disabled={isTesting}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isTesting ? '正在诊断...' : '重新诊断'}
      </button>

      {debugInfo && (
        <div className="space-y-4">
          {/* Firebase配置 */}
          <div>
            <h4 className="font-semibold mb-2">Firebase配置</h4>
            <div className="text-sm space-y-1">
              <p>API Key: <span className={getStatusColor(debugInfo.firebaseConfig.hasApiKey)}>
                {debugInfo.firebaseConfig.hasApiKey ? '✓ 已配置' : '✗ 未配置'}
              </span></p>
              <p>Project ID: <span className={getStatusColor(debugInfo.firebaseConfig.hasProjectId)}>
                {debugInfo.firebaseConfig.hasProjectId ? '✓ 已配置' : '✗ 未配置'}
              </span></p>
              <p>Storage Bucket: <span className={getStatusColor(debugInfo.firebaseConfig.hasStorageBucket)}>
                {debugInfo.firebaseConfig.hasStorageBucket ? '✓ 已配置' : '✗ 未配置'}
              </span></p>
              {debugInfo.firebaseConfig.storageBucket && (
                <p className="text-gray-600">Bucket: {debugInfo.firebaseConfig.storageBucket}</p>
              )}
            </div>
          </div>

          {/* 认证状态 */}
          <div>
            <h4 className="font-semibold mb-2">认证状态</h4>
            <div className="text-sm space-y-1">
              <p>已登录: <span className={getStatusColor(debugInfo.authStatus.isAuthenticated)}>
                {debugInfo.authStatus.isAuthenticated ? '✓ 是' : '✗ 否'}
              </span></p>
              {debugInfo.authStatus.user && (
                <>
                  <p>UID: {debugInfo.authStatus.user.uid}</p>
                  <p>邮箱: {debugInfo.authStatus.user.email}</p>
                  <p>显示名: {debugInfo.authStatus.user.displayName}</p>
                </>
              )}
            </div>
          </div>

          {/* 存储访问测试 */}
          <div>
            <h4 className="font-semibold mb-2">存储访问测试</h4>
            <div className="text-sm space-y-1">
              <p>可访问: <span className={getStatusColor(debugInfo.storageTest.canAccess)}>
                {debugInfo.storageTest.canAccess ? '✓ 是' : '✗ 否'}
              </span></p>
              {debugInfo.storageTest.error && (
                <p className="text-red-600">错误: {debugInfo.storageTest.error}</p>
              )}
              {debugInfo.storageTest.filesFound !== undefined && (
                <p>找到文件: {debugInfo.storageTest.filesFound}</p>
              )}
            </div>
          </div>

          {/* 数据加载测试 */}
          <div>
            <h4 className="font-semibold mb-2">数据加载测试</h4>
            <div className="text-sm space-y-1">
              <p>投资决策: {debugInfo.dataLoad.decisionsLoaded} 个</p>
              <p>风险评估: {debugInfo.dataLoad.riskAssessmentsLoaded} 个</p>
              {debugInfo.dataLoad.error && (
                <p className="text-red-600">错误: {debugInfo.dataLoad.error}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirebaseDebugger;