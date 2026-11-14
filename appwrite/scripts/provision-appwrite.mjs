#!/usr/bin/env node
/**
 * AURA Space Medicine Decision Support System
 * Idempotent Appwrite Backend Provisioning Script
 *
 * Provisioning:
 * - Teams: astronaut_crew, flight_surgeons
 * - Database: AURA_Medical_DB
 * - Collections: vitals_logs, triage_alerts, daily_missions, earth_transmissions
 * - Attributes & Indexes for all collections
 * - Storage Buckets: medical_guides, earth_reports
 * - Initial Seed Documents for Cmdr. Tariq Al-Mansoor (AST-CDR-01)
 */

import { Client, Databases, Storage, Teams, Permission, Role, ID } from 'node-appwrite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load schema and seed data
const schemaPath = path.resolve(__dirname, '../appwrite.json');
const seedDataPath = path.resolve(__dirname, '../seed-data.json');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const seedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));

const endpoint = process.env.VITE_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT || schema.endpoint || 'https://cloud.appwrite.io/v1';
const projectId = process.env.VITE_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || schema.projectId || 'aura_nasa_2026';
const apiKey = process.env.APPWRITE_API_KEY || process.env.APPWRITE_KEY;

console.log('====================================================');
console.log('  AURA Space Medicine - Appwrite Provisioning Script');
console.log('====================================================');
console.log(`Endpoint:   ${endpoint}`);
console.log(`Project ID: ${projectId}`);

if (!apiKey) {
  console.warn('\n[WARNING] APPWRITE_API_KEY is not defined in the environment.');
  console.warn('Set APPWRITE_API_KEY in your .env or shell to execute live cloud provisioning.');
  console.warn('Declarative appwrite.json and seed-data.json remain intact.\n');
  process.exit(0);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);
const storage = new Storage(client);
const teams = new Teams(client);

function convertPermissionString(permStr) {
  const match = permStr.match(/^(\w+)\("([^"]+)"\)$/);
  if (!match) return permStr;
  const [, action, target] = match;

  let role;
  if (target === 'any') role = Role.any();
  else if (target === 'users') role = Role.users();
  else if (target.startsWith('team:')) role = Role.team(target.replace('team:', ''));
  else if (target.startsWith('user:')) role = Role.user(target.replace('user:', ''));
  else role = Role.any();

  switch (action) {
    case 'read': return Permission.read(role);
    case 'create': return Permission.create(role);
    case 'update': return Permission.update(role);
    case 'delete': return Permission.delete(role);
    default: return permStr;
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function provisionTeams() {
  console.log('\n[1/5] Provisioning Teams...');
  for (const teamDef of schema.teams || []) {
    try {
      await teams.get(teamDef.$id);
      console.log(`  ✓ Team '${teamDef.$id}' already exists.`);
    } catch (err) {
      if (err.code === 404) {
        await teams.create(teamDef.$id, teamDef.name);
        console.log(`  + Created Team '${teamDef.$id}' (${teamDef.name}).`);
      } else {
        console.warn(`  ! Warning checking team '${teamDef.$id}':`, err.message);
      }
    }
  }
}

async function provisionDatabase() {
  console.log('\n[2/5] Provisioning Database...');
  const dbDef = schema.databases[0];
  const dbId = dbDef.$id;

  try {
    await databases.get(dbId);
    console.log(`  ✓ Database '${dbId}' already exists.`);
  } catch (err) {
    if (err.code === 404) {
      await databases.create(dbId, dbDef.name);
      console.log(`  + Created Database '${dbId}'.`);
    } else {
      console.error(`  x Failed to inspect database '${dbId}':`, err.message);
      throw err;
    }
  }
  return dbId;
}

async function provisionCollections(dbId) {
  console.log('\n[3/5] Provisioning Collections, Attributes, and Indexes...');
  const dbDef = schema.databases[0];

  for (const colDef of dbDef.collections || []) {
    let collection;
    const permissions = (colDef.permissions || []).map(convertPermissionString);

    try {
      collection = await databases.getCollection(dbId, colDef.$id);
      console.log(`  ✓ Collection '${colDef.$id}' exists.`);
    } catch (err) {
      if (err.code === 404) {
        collection = await databases.createCollection(
          dbId,
          colDef.$id,
          colDef.name,
          permissions,
          colDef.documentSecurity ?? true
        );
        console.log(`  + Created Collection '${colDef.$id}'.`);
      } else {
        throw err;
      }
    }

    // Refresh collection to inspect attributes
    collection = await databases.getCollection(dbId, colDef.$id);
    const existingAttrKeys = new Set(collection.attributes.map((a) => a.key));

    for (const attr of colDef.attributes || []) {
      if (existingAttrKeys.has(attr.key)) {
        continue;
      }

      console.log(`    + Adding attribute '${attr.key}' (${attr.type}) to '${colDef.$id}'...`);
      try {
        if (attr.format === 'enum') {
          await databases.createEnumAttribute(
            dbId,
            colDef.$id,
            attr.key,
            attr.elements,
            attr.required,
            attr.default ?? undefined,
            attr.array ?? false
          );
        } else if (attr.type === 'string') {
          await databases.createStringAttribute(
            dbId,
            colDef.$id,
            attr.key,
            attr.size || 255,
            attr.required,
            attr.default ?? undefined,
            attr.array ?? false
          );
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(
            dbId,
            colDef.$id,
            attr.key,
            attr.required,
            attr.min ?? undefined,
            attr.max ?? undefined,
            attr.default ?? undefined,
            attr.array ?? false
          );
        } else if (attr.type === 'double') {
          await databases.createFloatAttribute(
            dbId,
            colDef.$id,
            attr.key,
            attr.required,
            attr.min ?? undefined,
            attr.max ?? undefined,
            attr.default ?? undefined,
            attr.array ?? false
          );
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(
            dbId,
            colDef.$id,
            attr.key,
            attr.required,
            attr.default ?? undefined,
            attr.array ?? false
          );
        }
      } catch (attrErr) {
        console.warn(`    ! Attribute warning (${attr.key}):`, attrErr.message);
      }
    }

    // Wait a brief period for attributes to become available before creating indexes
    await sleep(1500);

    const existingIndexKeys = new Set((collection.indexes || []).map((idx) => idx.key));
    for (const idx of colDef.indexes || []) {
      if (existingIndexKeys.has(idx.key)) {
        continue;
      }
      try {
        console.log(`    + Creating index '${idx.key}' on '${colDef.$id}'...`);
        await databases.createIndex(
          dbId,
          colDef.$id,
          idx.key,
          idx.type,
          idx.attributes,
          idx.orders || []
        );
      } catch (idxErr) {
        console.warn(`    ! Index warning (${idx.key}):`, idxErr.message);
      }
    }
  }
}

async function provisionBuckets() {
  console.log('\n[4/5] Provisioning Storage Buckets...');
  for (const bucketDef of schema.buckets || []) {
    const permissions = (bucketDef.permissions || []).map(convertPermissionString);
    try {
      await storage.getBucket(bucketDef.$id);
      console.log(`  ✓ Bucket '${bucketDef.$id}' exists.`);
    } catch (err) {
      if (err.code === 404) {
        await storage.createBucket(
          bucketDef.$id,
          bucketDef.name,
          permissions,
          bucketDef.fileSecurity ?? true,
          bucketDef.enabled ?? true,
          bucketDef.maximumFileSize,
          bucketDef.allowedFileExtensions,
          bucketDef.compression,
          bucketDef.encryption,
          bucketDef.antivirus
        );
        console.log(`  + Created Bucket '${bucketDef.$id}' (${bucketDef.name}).`);
      } else {
        console.warn(`  ! Bucket warning (${bucketDef.$id}):`, err.message);
      }
    }
  }
}

async function provisionSeedData(dbId) {
  console.log('\n[5/5] Provisioning Default Daily Missions Seed Data...');
  for (const mission of seedData.dailyMissions || []) {
    try {
      await databases.getDocument(dbId, 'daily_missions', mission.$id);
      console.log(`  ✓ Seed document '${mission.$id}' exists.`);
    } catch (err) {
      if (err.code === 404) {
        const { $id, ...data } = mission;
        await databases.createDocument(
          dbId,
          'daily_missions',
          $id,
          data
        );
        console.log(`  + Seeded daily mission: ${mission.task_title} (${$id})`);
      } else {
        console.warn(`  ! Seed document warning (${mission.$id}):`, err.message);
      }
    }
  }
}

async function main() {
  try {
    await provisionTeams();
    const dbId = await provisionDatabase();
    await provisionCollections(dbId);
    await provisionBuckets();
    await provisionSeedData(dbId);

    console.log('\n====================================================');
    console.log('  Appwrite Backend Provisioning Completed Successfully!');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n[FATAL ERROR during provisioning]:', error);
    process.exit(1);
  }
}

main();
