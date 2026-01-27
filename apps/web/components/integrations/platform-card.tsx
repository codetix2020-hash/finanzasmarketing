'use client';

import { Button } from '@ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card';
import { Badge } from '@ui/components/badge';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@ui/components/avatar';

interface PlatformCardProps {
  platform: {
    id: string;
    name: string;
    icon: React.ReactNode;
    description: string;
    color: string;
  };
  account?: {
    id: string;
    accountName: string;
    avatarUrl: string | null;
  } | null;
  onConnect: () => void;
  onDisconnect: (id: string) => void;
  isDisconnecting?: boolean;
}

export function PlatformCard({
  platform,
  account,
  onConnect,
  onDisconnect,
  isDisconnecting,
}: PlatformCardProps) {
  const isConnected = !!account;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${platform.color}`}>
              {platform.icon}
            </div>
            <div>
              <CardTitle className="text-lg">{platform.name}</CardTitle>
              <CardDescription>{platform.description}</CardDescription>
            </div>
          </div>
          {isConnected ? (
            <Badge status="success" className="bg-green-500 text-white">
              Connected
            </Badge>
          ) : (
            <Badge status="info">Not connected</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isConnected && account ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={account.avatarUrl || undefined} />
                <AvatarFallback>
                  {account.accountName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">@{account.accountName}</p>
                <p className="text-sm text-muted-foreground">
                  Connected account
                </p>
              </div>
            </div>

            <Button
              variant="error"
              onClick={() => onDisconnect(account.id)}
              disabled={isDisconnecting}
              className="w-full"
            >
              {isDisconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                'Disconnect'
              )}
            </Button>
          </div>
        ) : (
          <Button onClick={onConnect} className="w-full" variant="primary">
            Connect {platform.name}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}





