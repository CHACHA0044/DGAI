export interface CalculatedRiskMetrics {
  riskScore: number;
  riskLevel: 'Safe' | 'Warning' | 'Critical';
  completionProb: number;
  missProbability: number;
  timeDeficit: number;
}

/** Compute task risk predictions deterministically using weighted offline rules */
export function calculateTaskRiskOffline(task: {
  deadline?: Date | string | null;
  estimatedHours?: number | null;
  difficulty?: string | null;
  riskLevel?: string | null;
  dependencies?: string[] | null;
}): CalculatedRiskMetrics {
  const est = task.estimatedHours ?? 2;
  let timeDeficit = 48.0; // Default safe buffer
  let missProbability = 0.0;

  // 1. Time Deficit & Miss Probability calculation
  if (task.deadline) {
    const hoursToDeadline = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
    timeDeficit = hoursToDeadline - est;

    if (timeDeficit < 0) {
      // Deficit present: calculate relative risk of missing
      missProbability = Math.min(0.98, Math.abs(timeDeficit) / est);
    } else if (hoursToDeadline < 24) {
      // Due very soon: high risk even without direct deficit
      missProbability = 0.4;
    } else if (hoursToDeadline < 72) {
      missProbability = 0.15;
    }
  }

  // 2. Risk Score calculation (weighted rules)
  let score = 0;

  // Deadline component (Max 50 points)
  if (timeDeficit < 0) {
    score += 50;
  } else if (timeDeficit < 24) {
    score += 35;
  } else if (timeDeficit < 72) {
    score += 20;
  } else {
    score += 5;
  }

  // Difficulty multiplier (Max 20 points)
  const diff = task.difficulty ?? 'EASY';
  if (diff === 'EXPERT') score += 20;
  else if (diff === 'HARD') score += 15;
  else if (diff === 'MEDIUM') score += 10;
  else score += 5;

  // Baseline risk multiplier (Max 20 points)
  const baseRisk = task.riskLevel ?? 'LOW';
  if (baseRisk === 'CRITICAL') score += 20;
  else if (baseRisk === 'HIGH') score += 15;
  else if (baseRisk === 'MEDIUM') score += 10;
  else score += 5;

  // Dependencies component (Max 10 points)
  const hasDeps = task.dependencies && task.dependencies.length > 0;
  if (hasDeps) {
    score += 10;
  }

  const riskScore = Math.min(100, Math.max(0, score));

  // 3. Label mapping
  let riskLevel: 'Safe' | 'Warning' | 'Critical' = 'Safe';
  if (riskScore >= 75) {
    riskLevel = 'Critical';
  } else if (riskScore >= 40) {
    riskLevel = 'Warning';
  }

  const completionProb = Math.round((1.0 - missProbability) * 100) / 100;

  return {
    riskScore,
    riskLevel,
    completionProb,
    missProbability: Math.round(missProbability * 100) / 100,
    timeDeficit: Math.round(timeDeficit * 10) / 10,
  };
}
