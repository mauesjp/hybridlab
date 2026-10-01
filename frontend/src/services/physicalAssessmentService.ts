import { api } from "./api";

import type {
  PhysicalAssessment,
  PhysicalAssessmentInput,
  PhysicalAssessmentPhoto,
  PhysicalAssessmentPhotoType,
  PhysicalAssessmentSummary,
} from "../types/physicalAssessment";

const baseUrl = "/PhysicalAssessments";

export const physicalAssessmentService = {
  async getAll(): Promise<PhysicalAssessmentSummary[]> {
    return api<PhysicalAssessmentSummary[]>(
      baseUrl,
      "GET"
    );
  },

  async getById(
    id: number
  ): Promise<PhysicalAssessment> {
    return api<PhysicalAssessment>(
      `${baseUrl}/${id}`,
      "GET"
    );
  },

  async create(
    data: PhysicalAssessmentInput
  ): Promise<PhysicalAssessment> {
    return api<PhysicalAssessment>(
      baseUrl,
      "POST",
      data
    );
  },

  async update(
    id: number,
    data: PhysicalAssessmentInput
  ): Promise<PhysicalAssessment> {
    return api<PhysicalAssessment>(
      `${baseUrl}/${id}`,
      "PUT",
      data
    );
  },

  async remove(
    id: number
  ): Promise<void> {
    await api<void>(
      `${baseUrl}/${id}`,
      "DELETE"
    );
  },

  async getPhotos(
    assessmentId: number
  ): Promise<PhysicalAssessmentPhoto[]> {
    return api<PhysicalAssessmentPhoto[]>(
      `${baseUrl}/${assessmentId}/photos`,
      "GET"
    );
  },

  async uploadPhoto(
    assessmentId: number,
    type: PhysicalAssessmentPhotoType,
    file: File
  ): Promise<PhysicalAssessmentPhoto> {
    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    return api<PhysicalAssessmentPhoto>(
      `${baseUrl}/${assessmentId}/photos/${type}`,
      "POST",
      formData
    );
  },

  async deletePhoto(
    assessmentId: number,
    type: PhysicalAssessmentPhotoType
  ): Promise<void> {
    await api<void>(
      `${baseUrl}/${assessmentId}/photos/${type}`,
      "DELETE"
    );
  },
};