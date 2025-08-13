import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from './firebase';
import {
  UserProfile,
  InvestmentDecision,
  RiskAssessmentResult,
  EvaluationResult
} from '../types';

/**
 * Firebase Storage Service
 * 
 * Provides CRUD operations for storing user data in Firebase Storage.
 * Uses JSON format for all data storage with user-based path isolation.
 * Includes error handling and retry logic for reliability.
 */

class StorageService {
  private storage = storage;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  /**
   * Get a storage reference for a user-specific file
   */
  private getUserRef(collection: string, uid: string, filename: string) {
    return ref(this.storage, `${collection}/${uid}/${filename}`);
  }

  /**
   * Get a storage reference for a user-specific collection
   */
  private getUserCollectionRef(collection: string, uid: string) {
    return ref(this.storage, `${collection}/${uid}/`);
  }

  /**
   * Upload JSON data to Firebase Storage with retry logic
   */
  private async uploadJSON(ref: any, data: any): Promise<void> {
    const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await uploadBytes(ref, jsonBlob);
        return;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Upload attempt ${attempt} failed:`, error);

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    throw lastError || new Error('Upload failed after maximum retries');
  }

  /**
   * Download and parse JSON data from Firebase Storage with retry logic
   */
  private async downloadJSON<T>(ref: any): Promise<T | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const url = await getDownloadURL(ref);
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.json();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Download attempt ${attempt} failed:`, error);

        // Check if error is "file not found" - don't retry for this
        if (error && typeof error === 'object' && 'code' in error) {
          const errorCode = (error as any).code;
          if (errorCode === 'storage/object-not-found') {
            return null;
          }
        }

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    // If all retries failed and it's not a "not found" error, return null
    return null;
  }

  /**
   * Delay helper function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===== USER PROFILE OPERATIONS =====

  /**
   * Save user profile to Firebase Storage
   */
  async saveUserProfile(uid: string, profile: UserProfile): Promise<void> {
    const profileRef = this.getUserRef('userProfiles', uid, 'profile.json');
    await this.uploadJSON(profileRef, profile);
  }

  /**
   * Load user profile from Firebase Storage
   */
  async loadUserProfile(uid: string): Promise<UserProfile | null> {
    const profileRef = this.getUserRef('userProfiles', uid, 'profile.json');
    return await this.downloadJSON<UserProfile>(profileRef);
  }

  /**
   * Delete user profile from Firebase Storage
   */
  async deleteUserProfile(uid: string): Promise<void> {
    const profileRef = this.getUserRef('userProfiles', uid, 'profile.json');
    await deleteObject(profileRef);
  }

  // ===== INVESTMENT DECISION OPERATIONS =====

  /**
   * Save investment decision to Firebase Storage
   */
  async saveInvestmentDecision(uid: string, decision: InvestmentDecision): Promise<void> {
    const decisionRef = this.getUserRef('investmentDecisions', uid, `${decision.id}.json`);
    await this.uploadJSON(decisionRef, decision);
  }

  /**
   * Load investment decision from Firebase Storage
   */
  async loadInvestmentDecision(uid: string, decisionId: string): Promise<InvestmentDecision | null> {
    const decisionRef = this.getUserRef('investmentDecisions', uid, `${decisionId}.json`);
    return await this.downloadJSON<InvestmentDecision>(decisionRef);
  }

  /**
   * Load all investment decisions for a user
   */
  async loadAllInvestmentDecisions(uid: string): Promise<InvestmentDecision[]> {
    const collectionRef = this.getUserCollectionRef('investmentDecisions', uid);
    const decisions: InvestmentDecision[] = [];

    try {
      const result = await listAll(collectionRef);
      for (const itemRef of result.items) {
        const decision = await this.downloadJSON<InvestmentDecision>(itemRef);
        if (decision) {
          decisions.push(decision);
        }
      }
    } catch (error) {
      console.error('Error loading investment decisions:', error);
    }

    return decisions;
  }

  /**
   * Delete investment decision from Firebase Storage
   */
  async deleteInvestmentDecision(uid: string, decisionId: string): Promise<void> {
    const decisionRef = this.getUserRef('investmentDecisions', uid, `${decisionId}.json`);
    await deleteObject(decisionRef);
  }

  // ===== RISK ASSESSMENT OPERATIONS =====

  /**
   * Save risk assessment result to Firebase Storage
   */
  async saveRiskAssessment(uid: string, assessment: RiskAssessmentResult): Promise<string> {
    const assessmentId = `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const assessmentRef = this.getUserRef('riskAssessments', uid, `${assessmentId}.json`);
    await this.uploadJSON(assessmentRef, assessment);
    return assessmentId;
  }

  /**
   * Load risk assessment result from Firebase Storage
   */
  async loadRiskAssessment(uid: string, assessmentId: string): Promise<RiskAssessmentResult | null> {
    const assessmentRef = this.getUserRef('riskAssessments', uid, `${assessmentId}.json`);
    return await this.downloadJSON<RiskAssessmentResult>(assessmentRef);
  }

  /**
   * Load all risk assessments for a user
   */
  async loadAllRiskAssessments(uid: string): Promise<RiskAssessmentResult[]> {
    const collectionRef = this.getUserCollectionRef('riskAssessments', uid);
    const assessments: RiskAssessmentResult[] = [];

    try {
      const result = await listAll(collectionRef);
      for (const itemRef of result.items) {
        const assessment = await this.downloadJSON<RiskAssessmentResult>(itemRef);
        if (assessment) {
          assessments.push(assessment);
        }
      }
    } catch (error) {
      console.error('Error loading risk assessments:', error);
    }

    return assessments;
  }

  /**
   * Delete risk assessment from Firebase Storage
   */
  async deleteRiskAssessment(uid: string, assessmentId: string): Promise<void> {
    const assessmentRef = this.getUserRef('riskAssessments', uid, `${assessmentId}.json`);
    await deleteObject(assessmentRef);
  }

  // ===== DECISION EVALUATION OPERATIONS =====

  /**
   * Save decision evaluation result to Firebase Storage
   */
  async saveDecisionEvaluation(uid: string, decisionId: string, evaluation: EvaluationResult): Promise<void> {
    const evaluationRef = this.getUserRef('decisionEvaluations', uid, `${decisionId}.json`);
    await this.uploadJSON(evaluationRef, evaluation);
  }

  /**
   * Load decision evaluation result from Firebase Storage
   */
  async loadDecisionEvaluation(uid: string, decisionId: string): Promise<EvaluationResult | null> {
    const evaluationRef = this.getUserRef('decisionEvaluations', uid, `${decisionId}.json`);
    return await this.downloadJSON<EvaluationResult>(evaluationRef);
  }

  /**
   * Delete decision evaluation from Firebase Storage
   */
  async deleteDecisionEvaluation(uid: string, decisionId: string): Promise<void> {
    const evaluationRef = this.getUserRef('decisionEvaluations', uid, `${decisionId}.json`);
    await deleteObject(evaluationRef);
  }

  // ===== BULK OPERATIONS =====

  /**
   * Get storage usage statistics for a user
   */
  async getUserStorageStats(uid: string): Promise<{
    totalFiles: number;
    totalSize: number;
    breakdown: {
      profiles: number;
      decisions: number;
      riskAssessments: number;
      evaluations: number;
    };
  }> {
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      breakdown: {
        profiles: 0,
        decisions: 0,
        riskAssessments: 0,
        evaluations: 0,
      },
    };

    try {
      // Count files in each collection
      const collections = [
        { name: 'userProfiles', key: 'profiles' },
        { name: 'investmentDecisions', key: 'decisions' },
        { name: 'riskAssessments', key: 'riskAssessments' },
        { name: 'decisionEvaluations', key: 'evaluations' },
      ];

      for (const collection of collections) {
        const collectionRef = this.getUserCollectionRef(collection.name, uid);
        const result = await listAll(collectionRef);
        stats.breakdown[collection.key as keyof typeof stats.breakdown] = result.items.length;
        stats.totalFiles += result.items.length;

        // Estimate size (Firebase Storage doesn't provide file size in listAll)
        // This is a rough estimate based on typical JSON file sizes
        stats.totalSize += result.items.length * 2048; // ~2KB per file average
      }
    } catch (error) {
      console.error('Error getting storage stats:', error);
    }

    return stats;
  }

  /**
   * Delete all user data from Firebase Storage
   */
  async deleteAllUserData(uid: string): Promise<void> {
    try {
      const collections = [
        'userProfiles',
        'investmentDecisions',
        'riskAssessments',
        'decisionEvaluations',
      ];

      for (const collection of collections) {
        const collectionRef = this.getUserCollectionRef(collection, uid);
        const result = await listAll(collectionRef);

        for (const itemRef of result.items) {
          await deleteObject(itemRef);
        }
      }
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();

// Export individual functions for easier import
export const {
  saveUserProfile,
  loadUserProfile,
  deleteUserProfile,
  saveInvestmentDecision,
  loadInvestmentDecision,
  loadAllInvestmentDecisions,
  deleteInvestmentDecision,
  saveRiskAssessment,
  loadRiskAssessment,
  loadAllRiskAssessments,
  deleteRiskAssessment,
  saveDecisionEvaluation,
  loadDecisionEvaluation,
  deleteDecisionEvaluation,
  getUserStorageStats,
  deleteAllUserData,
} = storageService;