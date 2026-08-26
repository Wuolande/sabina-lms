/**
 * Student Service — Student Learning Business Logic
 * -----------------------------------------------------------------------
 * Manages student learning progress, milestones, target goals, favorites,
 * and cross-portal tutor enrollments.
 * -----------------------------------------------------------------------
 */

import { studentRepository } from '../repositories/studentRepository';
import { Student360Aggregate, LearningGoalItem, StudentProfileUpdatePayload } from '../domain/types';
import { NotFoundError, ValidationError } from '@/src/shared/errors';
import { auditRepository } from '@/src/shared/audit/auditRepository';

export class StudentService {
  /**
   * Get full student 360 aggregate.
   */
  async getStudent360(studentUserId: string): Promise<Student360Aggregate> {
    const student = await studentRepository.getStudent360(studentUserId);
    if (!student) {
      throw new NotFoundError('Student', studentUserId);
    }
    return student;
  }

  /**
   * Update student profile.
   */
  async updateProfile(studentUserId: string, payload: StudentProfileUpdatePayload): Promise<void> {
    await studentRepository.upsertProfile(studentUserId, payload);
  }

  /**
   * Add a new learning goal.
   */
  async addGoal(studentUserId: string, goal: {
    title: string;
    description?: string;
    subjectId?: string;
    subjectName?: string;
    targetDate?: string;
  }): Promise<LearningGoalItem> {
    if (!goal.title || goal.title.trim().length < 3) {
      throw new ValidationError('Goal title must be at least 3 characters.');
    }
    return studentRepository.addLearningGoal(studentUserId, goal);
  }

  /**
   * Increment or set progress percentage on a learning goal.
   */
  async updateGoalProgress(goalId: string, progressPercent: number, studentUserId?: string): Promise<void> {
    await studentRepository.updateGoalProgress(goalId, progressPercent, studentUserId);
  }

  /**
   * Delete a learning goal.
   */
  async deleteGoal(goalId: string, studentUserId?: string): Promise<void> {
    await studentRepository.deleteGoal(goalId, studentUserId);
  }

  /**
   * Toggle a tutor favorite for a student.
   */
  async toggleFavoriteTutor(studentUserId: string, tutorProfileId: string): Promise<boolean> {
    return studentRepository.toggleFavoriteTutor(studentUserId, tutorProfileId);
  }

  /**
   * Get students roster for a tutor.
   */
  async getStudentsForTutor(tutorProfileId: string) {
    return studentRepository.getStudentsForTutor(tutorProfileId);
  }

  /**
   * Update tutor's private notes on a student.
   */
  async updateTutorPrivateNotes(studentUserId: string, tutorProfileId: string, notes: string): Promise<void> {
    await studentRepository.updateTutorPrivateNotes(studentUserId, tutorProfileId, notes);
  }

  /**
   * Get full Student 360 aggregate for tutor workspace.
   */
  async getTutorStudent360(tutorProfileId: string, studentId: string) {
    const data = await studentRepository.getTutorStudent360(tutorProfileId, studentId);
    if (!data) {
      throw new NotFoundError('Student Enrollment Profile', studentId);
    }
    return data;
  }

  /**
   * Update enrollment notes, roadmap, and status.
   */
  async updateStudentEnrollmentFull(
    tutorProfileId: string,
    studentId: string,
    payload: {
      privateTutorNotes?: string;
      tutorRoadmap?: string;
      targetLevel?: string;
      status?: string;
    }
  ) {
    return studentRepository.updateStudentEnrollmentFull(tutorProfileId, studentId, payload);
  }

  async getStudentBilling360(studentUserId: string) {
    const data = await studentRepository.getStudentBilling360(studentUserId);
    if (!data) {
      throw new NotFoundError('Student Billing 360', studentUserId);
    }
    return data;
  }

  async addPaymentMethod(
    studentUserId: string,
    payload: {
      cardBrand: string;
      last4: string;
      expMonth: number;
      expYear: number;
      isDefault?: boolean;
    }
  ) {
    return studentRepository.addPaymentMethod(studentUserId, payload);
  }

  async deletePaymentMethod(studentUserId: string, methodId: string) {
    return studentRepository.deletePaymentMethod(studentUserId, methodId);
  }

  async setDefaultPaymentMethod(studentUserId: string, methodId: string) {
    return studentRepository.setDefaultPaymentMethod(studentUserId, methodId);
  }

  async updateBillingProfile(
    studentUserId: string,
    payload: {
      billingName: string;
      billingEmail: string;
      taxId?: string;
      addressLine1: string;
      city: string;
      postalCode: string;
      country: string;
    }
  ) {
    return studentRepository.updateBillingProfile(studentUserId, payload);
  }

  async getStudentSettings360(studentUserId: string) {
    const data = await studentRepository.getStudentSettings360(studentUserId);
    if (!data) {
      throw new NotFoundError('Student Settings 360', studentUserId);
    }
    return data;
  }

  async updateStudentSettingsAtomic(studentUserId: string, payload: any) {
    return studentRepository.updateStudentSettingsAtomic(studentUserId, payload);
  }

  async deactivateStudentAccount(studentUserId: string, reason: string) {
    return studentRepository.deactivateStudentAccount(studentUserId, reason);
  }

  async deleteStudentAccountGdpr(studentUserId: string) {
    return studentRepository.deleteStudentAccountGdpr(studentUserId);
  }

  async exportStudentGdprData(studentUserId: string) {
    return studentRepository.exportStudentGdprData(studentUserId);
  }

  async getStudentDashboard360(studentUserId: string) {
    const data = await studentRepository.getStudentDashboard360(studentUserId);
    if (!data) {
      throw new NotFoundError('Student Dashboard 360', studentUserId);
    }
    return data;
  }
}

export const domainStudentService = new StudentService();

