'use client';

import { useActiveOrganization } from '@saas/organizations/hooks/use-active-organization';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface SocialAccount {
  id: string;
  platform: string;
  accountId: string;
  accountName: string;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export function useSocialAccounts() {
  const { activeOrganization } = useActiveOrganization();
  const queryClient = useQueryClient();

  // Fetch cuentas conectadas
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['social-accounts', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return [];
      
      const res = await fetch(
        `/api/social-accounts?organizationId=${activeOrganization.id}`
      );
      
      if (!res.ok) throw new Error('Failed to fetch accounts');
      
      const data = await res.json();
      return data.accounts as SocialAccount[];
    },
    enabled: !!activeOrganization?.id,
  });

  // Conectar cuenta
  const connectAccount = (platform: string) => {
    if (!activeOrganization?.id) {
      toast.error('No organization found');
      return;
    }

    const url = `/api/oauth/${platform}/connect?organizationId=${activeOrganization.id}`;
    window.location.href = url;
  };

  // Desconectar cuenta
  const disconnectMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      if (!activeOrganization?.id) throw new Error('No organization');

      const res = await fetch('/api/social-accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, organizationId: activeOrganization.id }),
      });

      if (!res.ok) throw new Error('Failed to disconnect');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      toast.success('Account disconnected');
    },
    onError: (error) => {
      toast.error('Failed to disconnect account');
      console.error(error);
    },
  });

  return {
    accounts: accounts || [],
    isLoading,
    connectAccount,
    disconnectAccount: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,
  };
}

