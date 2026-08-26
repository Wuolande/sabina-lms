import { ApplicationStatus } from './types';
import { InvalidStateTransitionError } from '@/src/shared/errors';

export const AllowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['REQUESTED_CHANGES', 'REJECTED', 'APPROVED'],
  REQUESTED_CHANGES: ['RESUBMITTED', 'REJECTED'],
  RESUBMITTED: ['UNDER_REVIEW', 'APPROVED', 'REJECTED'],
  APPROVED: ['ONBOARDING', 'ACTIVE'],
  ONBOARDING: ['ACTIVE'],
  ACTIVE: [],
  REJECTED: ['UNDER_REVIEW'], // Admin re-open capability
};

export class TutorApplicationStateMachine {
  static validateTransition(from: ApplicationStatus, to: ApplicationStatus): void {
    const validTargets = AllowedTransitions[from] || [];
    if (!validTargets.includes(to)) {
      throw new InvalidStateTransitionError(
        from,
        to,
        `Valid target states from '${from}' are: [${validTargets.join(', ')}]`
      );
    }
  }

  static canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
    const validTargets = AllowedTransitions[from] || [];
    return validTargets.includes(to);
  }
}
