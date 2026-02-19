import { prisma } from "@repo/database";

// Configuración de límites
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILES_PER_ORG = 500;

interface UploadResult {
	success: boolean;
	file?: {
		id: string;
		url: string;
		thumbnailUrl?: string;
		filename: string;
	};
	error?: string;
}

interface SaveFileParams {
	organizationId: string;
	filename: string;
	originalName: string;
	mimeType: string;
	size: number;
	url: string;
	thumbnailUrl?: string;
	folder?: string;
	tags?: string[];
	altText?: string;
}

export class MediaService {
	/**
	 * Validar archivo antes de subir
	 */
	static validateFile(file: File): { valid: boolean; error?: string } {
		if (!ALLOWED_TYPES.includes(file.type)) {
			return {
				valid: false,
				error: `Tipo no permitido. Usa: ${ALLOWED_TYPES.join(", ")}`,
			};
		}

		if (file.size > MAX_FILE_SIZE) {
			return {
				valid: false,
				error: `Archivo muy grande. Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
			};
		}

		return { valid: true };
	}

	/**
	 * Verificar límite de archivos por organización
	 */
	static async checkFileLimit(
		organizationId: string,
	): Promise<{ allowed: boolean; error?: string }> {
		const currentCount = await prisma.mediaFile.count({
			where: { organizationId, isActive: true },
		});

		if (currentCount >= MAX_FILES_PER_ORG) {
			return {
				allowed: false,
				error: `Límite alcanzado (${MAX_FILES_PER_ORG} archivos). Elimina algunos para subir más.`,
			};
		}

		return { allowed: true };
	}

	/**
	 * Guardar archivo en DB después de subir al storage
	 */
	static async saveFile(params: SaveFileParams): Promise<UploadResult> {
		try {
			const mediaFile = await prisma.mediaFile.create({
				data: {
					organizationId: params.organizationId,
					filename: params.filename,
					originalName: params.originalName,
					mimeType: params.mimeType,
					size: params.size,
					url: params.url,
					thumbnailUrl: params.thumbnailUrl || params.url,
					folder: params.folder || null,
					tags: params.tags || [],
					altText: params.altText || null,
				},
			});

			return {
				success: true,
				file: {
					id: mediaFile.id,
					url: mediaFile.url,
					thumbnailUrl: mediaFile.thumbnailUrl || mediaFile.url,
					filename: mediaFile.originalName,
				},
			};
		} catch (error) {
			console.error("Save file error:", error);
			return {
				success: false,
				error: "Error al guardar el archivo",
			};
		}
	}

	/**
	 * Marcar archivo como eliminado (soft delete)
	 */
	static async deleteFile(
		fileId: string,
		organizationId: string,
	): Promise<{ success: boolean; fileUrl?: string }> {
		try {
			const file = await prisma.mediaFile.findFirst({
				where: { id: fileId, organizationId },
			});

			if (!file) return { success: false };

			await prisma.mediaFile.update({
				where: { id: fileId },
				data: { isActive: false },
			});

			return { success: true, fileUrl: file.url };
		} catch (error) {
			console.error("Delete error:", error);
			return { success: false };
		}
	}

	/**
	 * Obtener archivos de una organización
	 */
	static async getFiles(
		organizationId: string,
		options?: {
			folder?: string;
			tags?: string[];
			limit?: number;
			cursor?: string;
		},
	) {
		const where: Record<string, unknown> = {
			organizationId,
			isActive: true,
		};

		if (options?.folder) {
			where.folder = options.folder;
		}

		if (options?.tags && options.tags.length > 0) {
			where.tags = { hasSome: options.tags };
		}

		return prisma.mediaFile.findMany({
			where,
			orderBy: { createdAt: "desc" },
			take: options?.limit || 50,
			...(options?.cursor && {
				cursor: { id: options.cursor },
				skip: 1,
			}),
		});
	}

	/**
	 * Obtener carpetas de una organización
	 */
	static async getFolders(organizationId: string): Promise<string[]> {
		const results = await prisma.mediaFile.findMany({
			where: {
				organizationId,
				isActive: true,
				folder: { not: null },
			},
			distinct: ["folder"],
			select: { folder: true },
		});

		return results
			.map((r) => r.folder)
			.filter((f): f is string => f !== null);
	}

	/**
	 * Actualizar metadata de archivo
	 */
	static async updateFile(
		fileId: string,
		organizationId: string,
		data: {
			folder?: string;
			tags?: string[];
			altText?: string;
		},
	) {
		return prisma.mediaFile.updateMany({
			where: { id: fileId, organizationId },
			data: {
				...data,
				updatedAt: new Date(),
			},
		});
	}
}

