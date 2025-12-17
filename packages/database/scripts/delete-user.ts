import { db } from "../prisma/client";

async function deleteUser() {
	const email = "codetix2020@gmail.com";

	console.log("🗑️  Deleting user:", email);

	// Buscar usuario
	const users = await db.user.findMany({
		where: { email },
	});

	if (users.length === 0) {
		console.log("ℹ️  User not found, nothing to delete");
		return;
	}

	const userIds = users.map((u) => u.id);
	console.log("Found", userIds.length, "user(s)");

	// Eliminar accounts primero
	const deletedAccounts = await db.account.deleteMany({
		where: { userId: { in: userIds } },
	});
	console.log("✅ Deleted", deletedAccounts.count, "account(s)");

	// Eliminar usuario
	const deletedUsers = await db.user.deleteMany({
		where: { email },
	});
	console.log("✅ Deleted", deletedUsers.count, "user(s)");

	console.log("\n✅ Usuario eliminado completamente");
}

deleteUser()
	.then(() => {
		console.log("Done!");
		process.exit(0);
	})
	.catch((error) => {
		console.error("Error:", error);
		process.exit(1);
	});



