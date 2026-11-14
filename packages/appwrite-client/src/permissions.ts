/**
 * AURA Client SDK — Permissions Matrix & Role-Based Access Controls
 */

import { Permission, Role } from 'appwrite';

export { Permission, Role };

export const TEAM_IDS = {
  ASTRONAUT_CREW: 'astronaut_crew',
  FLIGHT_SURGEONS: 'flight_surgeons',
} as const;

export type TeamId = (typeof TEAM_IDS)[keyof typeof TEAM_IDS];

/**
 * Builds permission array for documents created by or on behalf of an astronaut.
 */
export function buildAstronautDocumentPermissions(userId?: string): string[] {
  const permissions: string[] = [
    Permission.read(Role.any()),
    Permission.read(Role.team(TEAM_IDS.FLIGHT_SURGEONS)),
    Permission.read(Role.team(TEAM_IDS.ASTRONAUT_CREW)),
    Permission.update(Role.team(TEAM_IDS.FLIGHT_SURGEONS)),
    Permission.delete(Role.team(TEAM_IDS.FLIGHT_SURGEONS)),
  ];

  if (userId) {
    permissions.push(Permission.read(Role.user(userId)));
    permissions.push(Permission.update(Role.user(userId)));
  }

  return permissions;
}
