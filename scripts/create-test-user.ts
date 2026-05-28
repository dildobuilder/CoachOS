import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const defaultEmail = "testuser@coachos.test";

loadLocalEnvFile(".env.local");
loadLocalEnvFile(".env");

const supabaseUrl = getRequiredEnv("SUPABASE_URL");
const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const testUserEmail = (process.env.TEST_USER_EMAIL || defaultEmail).trim().toLowerCase();
const testUserPassword = getRequiredEnv("TEST_USER_PASSWORD");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const existingUser = await findUserByEmail(testUserEmail);

if (existingUser) {
  console.log("Test user already exists.");
  printResult(existingUser.id, testUserEmail);
  process.exit(0);
}

const { data, error } = await supabase.auth.admin.createUser({
  email: testUserEmail,
  password: testUserPassword,
  email_confirm: true
});

if (error) {
  if (isAlreadyExistsError(error.message)) {
    const user = await findUserByEmail(testUserEmail);

    if (user) {
      console.log("Test user already exists.");
      printResult(user.id, testUserEmail);
      process.exit(0);
    }
  }

  throw new Error(error.message);
}

if (!data.user) {
  throw new Error("Supabase did not return a created user.");
}

console.log("Test user created.");
printResult(data.user.id, testUserEmail);

async function findUserByEmail(email: string) {
  let page = 1;
  const perPage = 100;

  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage
    });

    if (error) {
      throw new Error(error.message);
    }

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);

    if (user) {
      return user;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }

  return null;
}

function printResult(userId: string, email: string) {
  console.log(`Email: ${email}`);
  console.log(`User id: ${userId}`);
  console.log("Add this email to ALLOWED_EMAILS locally and in Vercel:");
  console.log(`ALLOWED_EMAILS=mkomarenko30@gmail.com,${email}`);
  console.log("Redeploy Vercel after changing production environment variables.");
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required env variable: ${name}`);
  }

  return value;
}

function loadLocalEnvFile(fileName: string) {
  const filePath = resolve(process.cwd(), fileName);

  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = stripQuotes(rawValue);
  }
}

function stripQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function isAlreadyExistsError(message: string) {
  const normalized = message.toLowerCase();

  return normalized.includes("already") || normalized.includes("registered");
}
