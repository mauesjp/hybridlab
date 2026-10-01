import { api } from "./api";

import type {
  BodyCompositionComparison,
  BodyCompositionProfile,
  BodyCompositionResult,
  PhysicalAssessmentEvolution,
  UpdateBodyCompositionProfile,
} from "../types/bodyComposition";

const baseUrl = "/BodyComposition";

export const bodyCompositionService = {
  getProfile(): Promise<BodyCompositionProfile> {
    return api<BodyCompositionProfile>(
      `${baseUrl}/profile`
    );
  },

  updateProfile(
    data: UpdateBodyCompositionProfile
  ): Promise<BodyCompositionProfile> {
    return api<BodyCompositionProfile>(
      `${baseUrl}/profile`,
      "PUT",
      data
    );
  },

  getAssessmentComposition(
    id: number
  ): Promise<BodyCompositionResult> {
    return api<BodyCompositionResult>(
      `${baseUrl}/assessments/${id}`
    );
  },

  getEvolution(): Promise<PhysicalAssessmentEvolution> {
    return api<PhysicalAssessmentEvolution>(
      `${baseUrl}/evolution`
    );
  },

  compare(
    firstAssessmentId: number,
    secondAssessmentId: number
  ): Promise<BodyCompositionComparison> {
    const query =
      new URLSearchParams({
        firstAssessmentId:
          String(firstAssessmentId),

        secondAssessmentId:
          String(secondAssessmentId),
      });

    return api<BodyCompositionComparison>(
      `${baseUrl}/compare?${query.toString()}`
    );
  },
};