export type BiologicalSex = 0 | 1;

export interface BodyCompositionProfile {
  birthDate: string | null;
  biologicalSex: BiologicalSex | null;
}

export interface UpdateBodyCompositionProfile {
  birthDate: string;
  biologicalSex: BiologicalSex;
}

export interface BodyCompositionResult {
  assessmentId: number;
  assessmentDate: string;
  ageYears: number | null;
  weightKg: number;
  heightCm: number | null;
  bmi: number | null;
  sevenSkinfoldSumMm: number | null;
  bodyDensity: number | null;
  bodyFatPercentage: number | null;
  fatMassKg: number | null;
  leanMassKg: number | null;
  hasCompleteSkinfoldProtocol: boolean;
  isWithinProtocolAgeRange: boolean;
  protocol: string | null;
}

export interface BodyCompositionComparison {
  first: BodyCompositionResult;
  second: BodyCompositionResult;
  weightChangeKg: number;
  bodyFatChangePercentagePoints: number | null;
  fatMassChangeKg: number | null;
  leanMassChangeKg: number | null;
  sevenSkinfoldSumChangeMm: number | null;
}

export interface PhysicalAssessmentEvolutionPoint {
  assessmentId: number;
  assessmentDate: string;
  weightKg: number;
  waistCm: number | null;
  abdomenCm: number | null;
  chestCm: number | null;
  hipCm: number | null;
  sevenSkinfoldSumMm: number | null;
  bodyFatPercentage: number | null;
  fatMassKg: number | null;
  leanMassKg: number | null;
}

export interface PhysicalAssessmentEvolution {
  profile: BodyCompositionProfile;
  points: PhysicalAssessmentEvolutionPoint[];
}