import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 16;

function getEncryptionKey(): Buffer {
	const secret = process.env.TOKEN_ENCRYPTION_SECRET || process.env.BETTER_AUTH_SECRET;
	if (!secret) {
		throw new Error("TOKEN_ENCRYPTION_SECRET or BETTER_AUTH_SECRET is required for token encryption");
	}
	return scryptSync(secret, "social-tokens-salt", 32);
}

export function encryptToken(plaintext: string): string {
	const key = getEncryptionKey();
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ALGORITHM, key, iv);

	let encrypted = cipher.update(plaintext, "utf8", "hex");
	encrypted += cipher.final("hex");
	const tag = cipher.getAuthTag();

	// Format: iv:tag:encrypted (all hex)
	return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

export function decryptToken(ciphertext: string): string {
	const parts = ciphertext.split(":");
	if (parts.length !== 3) {
		// Not encrypted (legacy plaintext token), return as-is
		return ciphertext;
	}

	try {
		const key = getEncryptionKey();
		const iv = Buffer.from(parts[0], "hex");
		const tag = Buffer.from(parts[1], "hex");
		const encrypted = parts[2];

		const decipher = createDecipheriv(ALGORITHM, key, iv);
		decipher.setAuthTag(tag);

		let decrypted = decipher.update(encrypted, "hex", "utf8");
		decrypted += decipher.final("utf8");
		return decrypted;
	} catch {
		// If decryption fails, assume it's a legacy plaintext token
		return ciphertext;
	}
}

export function isEncrypted(token: string): boolean {
	const parts = token.split(":");
	if (parts.length !== 3) return false;
	return parts[0].length === IV_LENGTH * 2 && parts[1].length === TAG_LENGTH * 2;
}
