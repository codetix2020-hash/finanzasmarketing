import { prisma } from '@repo/database';

interface ConnectAccountParams {
  organizationId: string;
  platform: 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'twitter';
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  pageId?: string;
  businessId?: string;
  avatarUrl?: string;
}

export const socialAccountsService = {
  // Guardar o actualizar cuenta conectada
  async connectAccount(params: ConnectAccountParams) {
    return await prisma.socialAccount.upsert({
      where: {
        organizationId_platform_accountId: {
          organizationId: params.organizationId,
          platform: params.platform,
          accountId: params.accountId,
        },
      },
      update: {
        accountName: params.accountName,
        accessToken: params.accessToken, // TODO: Encriptar
        refreshToken: params.refreshToken,
        tokenExpiresAt: params.tokenExpiresAt,
        pageId: params.pageId,
        businessId: params.businessId,
        avatarUrl: params.avatarUrl,
        isActive: true,
        lastSyncAt: new Date(),
      },
      create: {
        organizationId: params.organizationId,
        platform: params.platform,
        accountId: params.accountId,
        accountName: params.accountName,
        accessToken: params.accessToken, // TODO: Encriptar
        refreshToken: params.refreshToken,
        tokenExpiresAt: params.tokenExpiresAt,
        pageId: params.pageId,
        businessId: params.businessId,
        avatarUrl: params.avatarUrl,
        isActive: true,
      },
    });
  },

  // Obtener cuenta activa de una org para una plataforma
  async getAccount(organizationId: string, platform: string) {
    return await prisma.socialAccount.findFirst({
      where: {
        organizationId,
        platform,
        isActive: true,
      },
      orderBy: { lastSyncAt: 'desc' },
    });
  },

  // Listar todas las cuentas de una org
  async listAccounts(organizationId: string) {
    return await prisma.socialAccount.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Desconectar cuenta
  async disconnectAccount(id: string, organizationId: string) {
    return await prisma.socialAccount.update({
      where: { id, organizationId },
      data: { isActive: false },
    });
  },

  // Refrescar token (cuando expire)
  async refreshToken(id: string, newAccessToken: string, expiresAt?: Date) {
    return await prisma.socialAccount.update({
      where: { id },
      data: {
        accessToken: newAccessToken,
        tokenExpiresAt: expiresAt,
        lastSyncAt: new Date(),
      },
    });
  },
};





