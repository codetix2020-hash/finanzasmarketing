import { config } from "dotenv";
import { resolve } from "path";

// Load .env from root
config({ path: resolve(__dirname, "../../../.env") });

import { db } from "../prisma/client";
import { createId } from "@paralleldrive/cuid2";
import { hashSync } from "bcrypt";

async function createUser() {
	const email = "codetix2020@gmail.com";
	const password = "FinanzOS2025!Secure#";
	const name = "Bruno Finance";

	// Check if user already exists
	const existingUser = await db.user.findUnique({
		where: { email },
	});

	if (existingUser) {
		console.log("❌ User already exists with email:", email);
		console.log("   Use the password you created before or reset it");
		return;
	}

	// Hash password with bcrypt (salt rounds: 10)
	const hashedPassword = hashSync(password, 10);

	// Create user
	const userId = createId();
	const user = await db.user.create({
		data: {
			id: userId,
			email,
			name,
			emailVerified: true, // Marcamos como verificado
			createdAt: new Date(),
			updatedAt: new Date(),
			onboardingComplete: false,
		},
	});

	// Create account (credential provider)
	await db.account.create({
		data: {
			id: createId(),
			userId: user.id,
			accountId: user.id,
			providerId: "credential",
			password: hashedPassword,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	});

	console.log("✅ User created successfully!");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("📧 Email:    ", email);
	console.log("🔑 Password: ", password);
	console.log("👤 Name:     ", name);
	console.log("🆔 User ID:  ", userId);
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("\n🚀 Now you can login at:");
	console.log("   https://app.pilotsocials.com/auth/login");
	console.log("\n💡 After login, go to:");
	console.log("   https://app.pilotsocials.com/app/finance");
}

createUser()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Error creating user:", error);
		process.exit(1);
	});

