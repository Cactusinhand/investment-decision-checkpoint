import { getApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { RiskAssessmentResult, RiskProfileType } from '../types';

const getDb = () => {
  if (!getApps().length) {
    return null;
  }
  return getFirestore(getApp());
};

/**
 * Save a risk assessment result for a user under
 * `riskAssessments/{uid}/assessments/{assessmentId}`.
 */
export const saveRiskAssessment = async (
  uid: string,
  assessmentId: string,
  result: RiskAssessmentResult
): Promise<void> => {
  const db = getDb();
  if (!db) return;
  const ref = doc(db, 'riskAssessments', uid, 'assessments', assessmentId);
  await setDoc(ref, { ...result, createdAt: serverTimestamp() });
};

/**
 * Load a specific risk assessment result for a user.
 */
export const loadRiskAssessment = async (
  uid: string,
  assessmentId: string
): Promise<RiskAssessmentResult | null> => {
  const db = getDb();
  if (!db) return null;
  const ref = doc(db, 'riskAssessments', uid, 'assessments', assessmentId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as RiskAssessmentResult) : null;
};

/**
 * Fetch the most recent risk assessment result for a user.
 */
export const loadLatestRiskAssessment = async (
  uid: string
): Promise<RiskAssessmentResult | null> => {
  const db = getDb();
  if (!db) return null;
  const colRef = collection(db, 'riskAssessments', uid, 'assessments');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as RiskAssessmentResult;
};

/**
 * Update a user's risk tolerance in their profile document.
 */
export const updateUserRiskTolerance = async (
  uid: string,
  riskTolerance: RiskProfileType
): Promise<void> => {
  const db = getDb();
  if (!db) return;
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { riskTolerance }, { merge: true });
};

