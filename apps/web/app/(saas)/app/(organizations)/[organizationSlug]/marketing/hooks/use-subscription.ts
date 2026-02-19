"use client";

import { useState, useEffect, useCallback } from "react";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";

interface SubscriptionData {
  plan: string;
  status: string;
  postsLimit: number;
  postsUsed: number;
  canCreatePost: boolean;
  isLoading: boolean;
  features: {
    scheduledPosts: boolean;
    autoPublish: boolean;
    analytics: boolean;
  };
  refresh: () => Promise<void>;
}

export function useSubscription(): SubscriptionData {
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id;

  const [data, setData] = useState({
    plan: "free",
    status: "active",
    postsLimit: 5,
    postsUsed: 0,
    features: {
      scheduledPosts: false,
      autoPublish: false,
      analytics: false,
    },
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!organizationId) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/billing/subscription?organizationId=${organizationId}`
      );

      if (response.ok) {
        const result = await response.json();
        setData({
          plan: result.subscription?.plan || "free",
          status: result.subscription?.status || "active",
          postsLimit: result.usage?.postsLimit || 5,
          postsUsed: result.usage?.postsUsed || 0,
          features: {
            scheduledPosts:
              result.planInfo?.limits?.scheduledPosts || false,
            autoPublish:
              result.planInfo?.limits?.autoPublish || false,
            analytics: result.planInfo?.limits?.analytics || false,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const canCreatePost =
    data.postsLimit === -1 || data.postsUsed < data.postsLimit;

  return {
    ...data,
    canCreatePost,
    isLoading,
    refresh: fetchSubscription,
  };
}

