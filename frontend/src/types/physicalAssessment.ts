export type PhysicalAssessmentPhotoType = 0 | 1 | 2 | 3;

export interface PhysicalAssessmentTape {
  neckCm: number | null;
  shouldersCm: number | null;
  chestCm: number | null;
  waistCm: number | null;
  waistAtNavelCm: number | null;
  abdomenCm: number | null;
  hipCm: number | null;

  rightArmRelaxedCm: number | null;
  leftArmRelaxedCm: number | null;

  rightArmFlexedCm: number | null;
  leftArmFlexedCm: number | null;

  rightThighCm: number | null;
  leftThighCm: number | null;

  rightCalfCm: number | null;
  leftCalfCm: number | null;
}

export interface PhysicalAssessmentSkinfold {
  chestMm: number | null;
  abdomenMm: number | null;
  thighMm: number | null;
  tricepsMm: number | null;
  subscapularMm: number | null;
  suprailiacMm: number | null;
  midaxillaryMm: number | null;
}

export interface PhysicalAssessmentSummary {
  id: number;
  assessmentDate: string;
  weightKg: number;
  heightCm: number | null;
  waistCm: number | null;
  abdomenCm: number | null;
  hasSkinfoldMeasurements: boolean;
  photoCount: number;
  createdAt: string;
}

export interface PhysicalAssessment {
  id: number;
  assessmentDate: string;
  weightKg: number;
  heightCm: number | null;
  notes: string | null;
  createdAt: string;

  tapeMeasurements: PhysicalAssessmentTape;

  skinfoldMeasurements: PhysicalAssessmentSkinfold | null;

  photoCount: number;
}

export interface PhysicalAssessmentTapeInput {
  neckCm?: number | null;
  shouldersCm?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  waistAtNavelCm?: number | null;
  abdomenCm?: number | null;
  hipCm?: number | null;

  rightArmRelaxedCm?: number | null;
  leftArmRelaxedCm?: number | null;

  rightArmFlexedCm?: number | null;
  leftArmFlexedCm?: number | null;

  rightThighCm?: number | null;
  leftThighCm?: number | null;

  rightCalfCm?: number | null;
  leftCalfCm?: number | null;
}

export interface PhysicalAssessmentSkinfoldInput {
  chestMm?: number | null;
  abdomenMm?: number | null;
  thighMm?: number | null;
  tricepsMm?: number | null;
  subscapularMm?: number | null;
  suprailiacMm?: number | null;
  midaxillaryMm?: number | null;
}

export interface PhysicalAssessmentInput {
  assessmentDate: string;
  weightKg: number;
  heightCm?: number | null;
  notes?: string | null;

  tapeMeasurements: PhysicalAssessmentTapeInput;

  skinfoldMeasurements?: PhysicalAssessmentSkinfoldInput | null;
}

export interface PhysicalAssessmentPhoto {
  id: number;
  type: PhysicalAssessmentPhotoType;
  originalFileName: string | null;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  url: string;
}