/**
 * AURA Space Medicine System — Appwrite Security & RBAC Matrix
 * Defines declarative permission sets for Collections, Buckets, Teams, and Documents.
 */

export const TEAM_IDS = {
  ASTRONAUT_CREW: 'astronaut_crew',
  FLIGHT_SURGEONS: 'flight_surgeons',
} as const;

export type TeamId = (typeof TEAM_IDS)[keyof typeof TEAM_IDS];

export const FUNCTION_API_SCOPES = [
  'databases.read',
  'databases.write',
  'users.read',
  'storage.read',
  'storage.write',
] as const;

export interface PermissionDefinition {
  read: string[];
  create: string[];
  update: string[];
  delete: string[];
}

export const COLLECTION_PERMISSIONS: Record<string, PermissionDefinition> = {
  vitals_logs: {
    read: [
      'read("any")',
      'read("users")',
      'read("team:flight_surgeons")',
      'read("team:astronaut_crew")',
    ],
    create: [
      'create("any")',
      'create("users")',
      'create("team:astronaut_crew")',
    ],
    update: [
      'update("users")',
      'update("team:flight_surgeons")',
    ],
    delete: [
      'delete("team:flight_surgeons")',
    ],
  },
  triage_alerts: {
    read: [
      'read("any")',
      'read("users")',
      'read("team:flight_surgeons")',
      'read("team:astronaut_crew")',
    ],
    create: [
      'create("any")',
      'create("users")',
      'create("team:flight_surgeons")',
    ],
    update: [
      'update("any")',
      'update("users")',
      'update("team:astronaut_crew")',
      'update("team:flight_surgeons")',
    ],
    delete: [
      'delete("team:flight_surgeons")',
    ],
  },
  daily_missions: {
    read: [
      'read("any")',
      'read("users")',
      'read("team:astronaut_crew")',
      'read("team:flight_surgeons")',
    ],
    create: [
      'create("users")',
      'create("team:flight_surgeons")',
    ],
    update: [
      'update("any")',
      'update("users")',
      'update("team:astronaut_crew")',
      'update("team:flight_surgeons")',
    ],
    delete: [
      'delete("team:flight_surgeons")',
    ],
  },
  earth_transmissions: {
    read: [
      'read("any")',
      'read("users")',
      'read("team:flight_surgeons")',
      'read("team:astronaut_crew")',
    ],
    create: [
      'create("any")',
      'create("users")',
      'create("team:astronaut_crew")',
    ],
    update: [
      'update("any")',
      'update("users")',
      'update("team:flight_surgeons")',
    ],
    delete: [
      'delete("team:flight_surgeons")',
    ],
  },
};

export const BUCKET_PERMISSIONS: Record<string, PermissionDefinition> = {
  medical_guides: {
    read: [
      'read("any")',
      'read("users")',
    ],
    create: [
      'create("team:flight_surgeons")',
    ],
    update: [
      'update("team:flight_surgeons")',
    ],
    delete: [
      'delete("team:flight_surgeons")',
    ],
  },
  earth_reports: {
    read: [
      'read("any")',
      'read("users")',
      'read("team:flight_surgeons")',
    ],
    create: [
      'create("any")',
      'create("users")',
      'create("team:astronaut_crew")',
    ],
    update: [
      'update("team:flight_surgeons")',
    ],
    delete: [
      'delete("team:flight_surgeons")',
    ],
  },
};

/**
 * Builds document-level permission array for a specific astronaut user.
 * Grants read/write to the astronaut, read/write/delete to flight surgeons,
 * and read to crew members.
 */
export function buildAstronautDocumentPermissions(userId: string): string[] {
  return [
    `read("user:${userId}")`,
    `update("user:${userId}")`,
    'read("team:astronaut_crew")',
    'read("team:flight_surgeons")',
    'update("team:flight_surgeons")',
    'delete("team:flight_surgeons")',
  ];
}
