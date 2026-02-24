// Load environment variables
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../../.env") });

import { db } from "../prisma/client";
import { createId } from "@paralleldrive/cuid2";
import { hash } from "bcryptjs";

async function createUser() {
	const email = "codetix2020@gmail.com";
	const password = "FinanzOS2025!";
	const name = "Bruno Finance";

	console.log("🔐 Creating user...");
	console.log("Email:", email);
	console.log("Password:", password);

	// Hash password
	const hashedPassword = await hash(password, 10);
	console.log("✅ Password hashed");

	// Crear o actualizar usuario
	const user = await db.user.upsert({
		where: { email },
		update: {
			name,
			emailVerified: true,
		},
		create: {
			id: createId(),
			email,
			name,
			emailVerified: true,
			onboardingComplete: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	});

	console.log("✅ User created/updated:", user.id);

	// Buscar si ya existe una cuenta
	const existingAccount = await db.account.findFirst({
		where: {
			userId: user.id,
			providerId: "credential",
		},
	});

	if (existingAccount) {
		// Actualizar password existente
		await db.account.update({
			where: { id: existingAccount.id },
			data: {
				password: hashedPassword,
				updatedAt: new Date(),
			},
		});
		console.log("✅ Account password updated");
	} else {
		// Crear nueva cuenta
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
		console.log("✅ Account with password created");
	}

	console.log("✅ Account with password created");

	console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("✅ USUARIO CREADO EXITOSAMENTE!");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("📧 Email:    ", email);
	console.log("🔑 Password: ", password);
	console.log("👤 Name:     ", name);
	console.log("🆔 User ID:  ", user.id);
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("\n🚀 Ahora puedes hacer login en:");
	console.log("   https://app.pilotsocials.com/auth/login");
	console.log("\n💡 Después del login, ve a:");
	console.log("   https://app.pilotsocials.com/app/finance");
}

createUser()
	.then(() => {
		console.log("\n✅ Done!");
		process.exit(0);
	})
	.catch((error) => {
		console.error("\n❌ Error:", error);
		process.exit(1);
	});

