import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db, adminConfig } from "@workspace/db";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

const CONFIG_KEY = "admin_password_hash";

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const [salt, storedHex] = hash.split(":");
  if (!salt || !storedHex) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const stored = Buffer.from(storedHex, "hex");
  if (derived.length !== stored.length) return false;
  return timingSafeEqual(derived, stored);
}

export async function getStoredPasswordHash(): Promise<string | null> {
  const row = await db
    .select()
    .from(adminConfig)
    .where(eq(adminConfig.key, CONFIG_KEY))
    .limit(1);
  return row[0]?.value ?? null;
}

export async function setPasswordHash(hash: string): Promise<void> {
  await db
    .insert(adminConfig)
    .values({ key: CONFIG_KEY, value: hash, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: adminConfig.key,
      set: { value: hash, updatedAt: new Date() },
    });
}

export async function checkAdminPassword(password: string): Promise<boolean> {
  const storedHash = await getStoredPasswordHash();

  if (storedHash) {
    return verifyPassword(password, storedHash);
  }

  const envPassword = process.env["ADMIN_PASSWORD"];
  if (!envPassword) return false;

  if (password === envPassword) {
    const hash = await hashPassword(password);
    await setPasswordHash(hash);
    return true;
  }

  return false;
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  const valid = await checkAdminPassword(currentPassword);
  if (!valid) {
    return { ok: false, error: "Mot de passe actuel incorrect." };
  }
  if (newPassword.length < 6) {
    return {
      ok: false,
      error: "Le nouveau mot de passe doit contenir au moins 6 caractères.",
    };
  }
  const hash = await hashPassword(newPassword);
  await setPasswordHash(hash);
  return { ok: true };
}
