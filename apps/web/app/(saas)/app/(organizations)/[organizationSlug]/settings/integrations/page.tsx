'use client';

import { useSocialAccounts } from '@/hooks/use-social-accounts';
import { PlatformCard } from '@/components/integrations/platform-card';
import { 
  Instagram, 
  Facebook, 
  Video,
  Loader2,
} from 'lucide-react';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

const PLATFORMS = [
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Connect your Instagram Business account',
    icon: <Instagram className="h-5 w-5" />,
    color: 'bg-gradient-to-br from-purple-500 to-pink-500 text-white',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Connect your Facebook Page',
    icon: <Facebook className="h-5 w-5" />,
    color: 'bg-blue-600 text-white',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Connect your TikTok Business account',
    icon: <Video className="h-5 w-5" />,
    color: 'bg-black text-white',
  },
];

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const {
    accounts,
    isLoading,
    connectAccount,
    disconnectAccount,
    isDisconnecting,
  } = useSocialAccounts();

  // Manejar mensajes de éxito/error de OAuth
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'instagram_connected') {
      toast.success('Instagram connected successfully!');
    } else if (success === 'facebook_connected') {
      toast.success('Facebook connected successfully!');
    } else if (success === 'tiktok_connected') {
      toast.success('TikTok connected successfully!');
    }

    if (error === 'instagram_auth_failed') {
      toast.error('Failed to connect Instagram');
    } else if (error === 'connection_failed') {
      toast.error('Connection failed. Please try again.');
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Connect your social media accounts to start automating your marketing.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PLATFORMS.map((platform) => {
          const account = accounts.find(
            (acc) => acc.platform === platform.id && acc.isActive
          );

          return (
            <PlatformCard
              key={platform.id}
              platform={platform}
              account={account}
              onConnect={() => connectAccount(platform.id)}
              onDisconnect={disconnectAccount}
              isDisconnecting={isDisconnecting}
            />
          );
        })}
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-2">Need help?</h3>
        <p className="text-sm text-muted-foreground">
          If you're having trouble connecting an account, make sure you have the necessary
          permissions and that your account is set up as a Business account.
        </p>
      </div>
    </div>
  );
}

