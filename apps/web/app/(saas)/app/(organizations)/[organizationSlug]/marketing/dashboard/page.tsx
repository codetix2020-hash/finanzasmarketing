"use client";

import type { ComponentType } from "react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  Sparkles, Users, Heart, FileText, Clock, 
  CheckCircle, Circle, ArrowRight, Instagram, Facebook,
  Calendar, MessageCircle, BarChart3, Target,
  Bot, RefreshCw, ChevronRight, Play, Pause, Eye,
  DollarSign, Timer, Award, Rocket, Building2, Link2
} from "lucide-react";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useSession } from "@saas/auth/hooks/use-session";

interface RecentActivity {
  type: "post" | "scheduled" | "comment" | "seo";
  message: string;
  time: string;
  platform: string;
}

interface DashboardStats {
  publishedCount: number;
  scheduledCount: number;
  accountsCount: number;
  mediaCount: number;
  totalReach: number;
  engagementRate: string;
  totalFollowers: number;
  recentActivity: RecentActivity[];
}

interface ProfilePayload {
  isComplete?: boolean;
}

interface ProfileResponse {
  profile: ProfilePayload | null;
  isComplete: boolean;
}

interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  username: string;
  isActive: boolean;
}

interface ScheduledPost {
  id: string;
  content: string;
  platform: string;
  scheduledAt: string;
}

interface DashboardDataResponse {
  scheduledPosts: ScheduledPost[];
}

interface SetupStep {
  id: "account" | "social" | "profile" | "photos";
  label: string;
  done: boolean;
}

export default function MarketingDashboard() {
  const params = useParams();
  const orgSlug = params.organizationSlug as string;
  const { activeOrganization, loaded } = useActiveOrganization();
  const { user } = useSession();
  
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [isAutomationActive, setIsAutomationActive] = useState(true);

  useEffect(() => {
    document.title = "Dashboard | PilotSocials";
    
    if (loaded && activeOrganization?.id) {
      void fetchDashboardData();
    }
  }, [loaded, activeOrganization?.id, orgSlug]);

  const fetchDashboardData = async () => {
    if (!activeOrganization?.id) return;
    
    try {
      const [statsRes, profileRes, accountsRes] = await Promise.all([
        fetch(`/api/marketing/dashboard/stats?organizationSlug=${orgSlug}&organizationId=${activeOrganization.id}`),
        fetch(`/api/marketing/profile?organizationSlug=${orgSlug}&organizationId=${activeOrganization.id}`),
        fetch(`/api/integrations/social-accounts?organizationSlug=${orgSlug}&organizationId=${activeOrganization.id}`),
      ]);
      const dashboardDataPromise = fetch(
        `/api/marketing/dashboard-data?organizationId=${activeOrganization.id}`,
      );
      
      if (statsRes.ok) {
        const statsData: DashboardStats = await statsRes.json();
        setStats(statsData);
      }
      if (profileRes.ok) {
        const profileData: ProfileResponse = await profileRes.json();
        setProfile(profileData);
      }
      if (accountsRes.ok) {
        const accountsData: SocialAccount[] = await accountsRes.json();
        setAccounts(Array.isArray(accountsData) ? accountsData : []);
      }
      const dashboardDataRes = await dashboardDataPromise;
      if (dashboardDataRes.ok) {
        const dashboardData: DashboardDataResponse = await dashboardDataRes.json();
        setScheduledPosts(
          Array.isArray(dashboardData.scheduledPosts) ? dashboardData.scheduledPosts : [],
        );
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupSteps: SetupStep[] = [
    { id: "account", label: "Account created", done: true },
    { id: "social", label: "Social account connected", done: accounts.length > 0 },
    { id: "profile", label: "Business profile", done: Boolean(profile?.isComplete) },
    { id: "photos", label: "Photos uploaded", done: (stats?.mediaCount || 0) > 0 },
  ];
  const completedSteps = setupSteps.filter((s) => s.done).length;
  const setupProgress = Math.round((completedSteps / setupSteps.length) * 100);
  const isFullySetup = setupProgress === 100;

  const hoursPerPost = 2;
  const hourlyRate = 50;
  const postsThisMonth = stats?.publishedCount || 0;
  const hoursSaved = postsThisMonth * hoursPerPost;
  const moneySaved = hoursSaved * hourlyRate;
  const roi = moneySaved > 0 ? (moneySaved / 500).toFixed(1) : "0";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 19 ? "Good afternoon" : "Good evening";
  const userName = user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  const hasNoStats =
    !stats ||
    ((stats.publishedCount || 0) === 0 &&
      (stats.scheduledCount || 0) === 0 &&
      (stats.totalReach || 0) === 0 &&
      Number(stats.engagementRate || "0") === 0 &&
      (stats.totalFollowers || 0) === 0);

  const shouldShowWelcome = !isFullySetup && hasNoStats;
  const shouldShowValueCard = postsThisMonth > 0;
  const shouldShowAutomationActions = isFullySetup;

  const nextScheduledPost = scheduledPosts[0] ?? null;
  const nextPostLabel = nextScheduledPost
    ? new Date(nextScheduledPost.scheduledAt).toLocaleString("en-US", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "No scheduled posts yet";

  if (!loaded || isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                {greeting}, {userName} 👋
              </h1>
              <div className="flex items-center gap-2 text-white/90">
                {isAutomationActive ? (
                  <>
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span>Your marketing is running automatically</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                    <span>System paused — Complete setup</span>
                  </>
                )}
              </div>
            </div>
            <button 
              onClick={() => setIsAutomationActive(!isAutomationActive)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isAutomationActive 
                  ? 'bg-white/20 hover:bg-white/30' 
                  : 'bg-yellow-500 hover:bg-yellow-400 text-yellow-900'
              }`}
            >
              {isAutomationActive ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Activate
                </>
              )}
            </button>
          </div>

          {isAutomationActive && (
            <div className="mt-4 flex items-center gap-2 text-sm bg-white/10 rounded-lg px-4 py-2 w-fit">
              <Clock className="w-4 h-4" />
              <span>Next post: <strong>{nextPostLabel}</strong></span>
            </div>
          )}
        </div>
      </div>

      {!isFullySetup && (
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-violet-600" />
              <span className="font-semibold text-violet-900">Complete your setup</span>
            </div>
            <span className="text-2xl font-bold text-violet-600">{setupProgress}%</span>
          </div>
          
          <div className="w-full bg-violet-200 rounded-full h-2 mb-4">
            <div 
              className="bg-violet-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${setupProgress}%` }}
            />
          </div>

          <div className="flex items-center gap-6">
            {setupSteps.map((step, i) => (
              <div key={step.id} className="flex items-center gap-2">
                {step.done ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5 text-violet-300" />
                )}
                <span className={`text-sm ${step.done ? 'text-green-700' : 'text-violet-600'}`}>
                  {step.label}
                </span>
                {i < setupSteps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-violet-300 ml-2" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-4">
            {!setupSteps[1].done && (
              <Link href={`/app/${orgSlug}/settings/integrations`}>
                <button className="bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                  Connect Instagram
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            )}
            {setupSteps[1].done && !setupSteps[2].done && (
              <Link href={`/app/${orgSlug}/marketing/profile`}>
                <button className="bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                  Complete business profile
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            )}
            {setupSteps[2].done && !setupSteps[3].done && (
              <Link href={`/app/${orgSlug}/marketing/media`}>
                <button className="bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                  Upload brand photos
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            )}
          </div>
        </div>
      )}

      {shouldShowWelcome && (
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-6">
          <h3 className="text-2xl font-bold text-violet-900 mb-2">Welcome to PilotSocials! 🚀</h3>
          <p className="text-violet-700 mb-5">Complete these 3 steps to launch your automated marketing system.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href={`/app/${orgSlug}/marketing/profile`} className="bg-white rounded-xl border border-violet-100 p-4 hover:border-violet-300 transition-colors">
              <Building2 className="w-6 h-6 text-violet-600 mb-2" />
              <p className="font-semibold text-violet-900">Complete your business profile</p>
              <p className="text-sm text-violet-600 mt-1">Add brand details for better AI content.</p>
            </Link>
            <Link href={`/app/${orgSlug}/settings/integrations`} className="bg-white rounded-xl border border-violet-100 p-4 hover:border-violet-300 transition-colors">
              <Link2 className="w-6 h-6 text-violet-600 mb-2" />
              <p className="font-semibold text-violet-900">Connect your first social account</p>
              <p className="text-sm text-violet-600 mt-1">Link Instagram, Facebook, or TikTok.</p>
            </Link>
            <Link href={`/app/${orgSlug}/marketing/content/create`} className="bg-white rounded-xl border border-violet-100 p-4 hover:border-violet-300 transition-colors">
              <Sparkles className="w-6 h-6 text-violet-600 mb-2" />
              <p className="font-semibold text-violet-900">Create your first AI post</p>
              <p className="text-sm text-violet-600 mt-1">Publish your first automated campaign.</p>
            </Link>
          </div>
        </div>
      )}

      {shouldShowValueCard && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">Value generated this month</h3>
              <p className="text-sm text-green-600">What you'd be paying an agency</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <Timer className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700">{hoursSaved}h</div>
              <div className="text-xs text-green-600">Hours saved</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <DollarSign className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700">€{moneySaved.toLocaleString()}</div>
              <div className="text-xs text-green-600">Agency equivalent</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <Award className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700">{roi}x</div>
              <div className="text-xs text-green-600">Return on investment</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard 
          icon={Eye}
          label="Total reach"
          value={stats?.totalReach ? stats.totalReach.toLocaleString() : "—"}
          change={stats?.totalReach ? undefined : "Connect accounts to see"}
          positive={!!stats?.totalReach}
          color="blue"
        />
        <KPICard 
          icon={Heart}
          label="Engagement"
          value={stats?.engagementRate ? `${stats.engagementRate}%` : "—"}
          change={undefined}
          positive={!!stats?.engagementRate}
          color="pink"
        />
        <KPICard 
          icon={Users}
          label="Followers"
          value={stats?.totalFollowers ? stats.totalFollowers.toLocaleString() : "—"}
          change={stats?.totalFollowers ? undefined : "Connect accounts to see"}
          positive={!!stats?.totalFollowers}
          color="purple"
        />
        <KPICard 
          icon={FileText}
          label="Posts this month"
          value={String(stats?.publishedCount || 0)}
          change={`${stats?.scheduledCount || 0} scheduled`}
          color="green"
        />
      </div>

      <div className={`grid grid-cols-1 ${shouldShowAutomationActions ? "lg:grid-cols-2" : ""} gap-6`}>
        {shouldShowAutomationActions && (
          <div className="bg-white border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold">Upcoming automated actions</h3>
              </div>
              <Link href={`/app/${orgSlug}/marketing/automation`}>
                <span className="text-sm text-purple-500 hover:underline">View all</span>
              </Link>
            </div>

            {scheduledPosts.length > 0 ? (
              <div className="space-y-3">
                {scheduledPosts.map((item) => (
                  <ActionItem
                    key={item.id}
                    time={new Date(item.scheduledAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    action={item.content}
                    platform={item.platform}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-gray-600">
                No scheduled posts yet. Create AI content and schedule your next campaign.
              </div>
            )}
          </div>
        )}

        <div className="bg-white border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">Recent activity</h3>
            </div>
          </div>

          <div className="space-y-3">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity, i) => (
                <ActivityItem key={`${activity.message}-${i}`} {...activity} />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">No activity yet</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Activity will appear here once you start publishing
                </p>
                <Link href={`/app/${orgSlug}/marketing/content/create`}>
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg text-sm font-medium hover:bg-violet-600 transition-colors">
                    <Sparkles className="w-4 h-4" />
                    Create first post
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Connected accounts</h3>
          <Link href={`/app/${orgSlug}/settings/integrations`}>
            <span className="text-sm text-blue-500 hover:underline">Manage</span>
          </Link>
        </div>

        <div className="flex flex-wrap gap-3">
          {accounts.length > 0 ? (
            accounts.map((account) => (
              <div 
                key={account.id}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full"
              >
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                {account.platform === "instagram" && <Instagram className="w-4 h-4 text-pink-500" />}
                {account.platform === "facebook" && <Facebook className="w-4 h-4 text-blue-500" />}
                <span className="text-sm font-medium">@{account.accountName || account.username || "Unknown"}</span>
              </div>
            ))
          ) : (
            <Link href={`/app/${orgSlug}/settings/integrations`}>
              <button className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-full text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
                <span className="text-lg">+</span>
                <span className="text-sm">Connect social account</span>
              </button>
            </Link>
          )}
          
          {accounts.length > 0 && accounts.length < 3 && (
            <Link href={`/app/${orgSlug}/settings/integrations`}>
              <button className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-full text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
                <span className="text-lg">+</span>
                <span className="text-sm">Add another</span>
              </button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction 
          href={`/app/${orgSlug}/marketing/content/create`}
          icon={Sparkles}
          label="Create AI post"
          color="purple"
        />
        <QuickAction 
          href={`/app/${orgSlug}/marketing/assistant`}
          icon={Bot}
          label="Chat with assistant"
          color="blue"
        />
        <QuickAction 
          href={`/app/${orgSlug}/marketing/content/calendar`}
          icon={Calendar}
          label="View calendar"
          color="green"
        />
        <QuickAction 
          href={`/app/${orgSlug}/marketing/seo`}
          icon={Target}
          label="Analyze SEO"
          color="orange"
        />
      </div>
    </div>
  );
}

interface KPICardProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  color: "blue" | "pink" | "purple" | "green";
}

function KPICard({ icon: Icon, label, value, change, positive, color }: KPICardProps) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    pink: "bg-pink-50 text-pink-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
  };

  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {change && (
          <span className={`text-xs font-medium ${positive ? "text-green-500" : "text-gray-400"}`}>
            {change}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

interface ActionItemProps {
  time: string;
  action: string;
  platform: string;
}

function ActionItem({ time, action, platform }: ActionItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="text-sm font-mono text-gray-400 w-12">{time}</div>
      <div className="w-px h-8 bg-gray-200" />
      <div className="flex-1">
        <div className="text-sm font-medium">{action}</div>
        <div className="text-xs text-gray-400 capitalize">{platform}</div>
      </div>
      {platform === "instagram" && <Instagram className="w-4 h-4 text-pink-500" />}
      {platform !== "instagram" && <Bot className="w-4 h-4 text-purple-500" />}
    </div>
  );
}

function ActivityItem({ type, message, time }: RecentActivity) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        type === "post" ? "bg-green-100" : 
        type === "comment" ? "bg-blue-100" : "bg-gray-100"
      }`}>
        {type === "post" && <FileText className="w-4 h-4 text-green-600" />}
        {type === "comment" && <MessageCircle className="w-4 h-4 text-blue-600" />}
        {type === "seo" && <BarChart3 className="w-4 h-4 text-gray-600" />}
        {type === "scheduled" && <Calendar className="w-4 h-4 text-violet-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">{message}</p>
        <p className="text-xs text-gray-400">{time}</p>
      </div>
    </div>
  );
}

interface QuickActionProps {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  color: "purple" | "blue" | "green" | "orange";
}

function QuickAction({ href, icon: Icon, label, color }: QuickActionProps) {
  const colors: Record<string, string> = {
    purple: "bg-violet-50 border-violet-100 text-violet-700 hover:bg-violet-100",
    blue: "bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100",
    green: "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100",
    orange: "bg-violet-50 border-violet-100 text-violet-700 hover:bg-violet-100",
  };

  return (
    <Link href={href}>
      <div className={`${colors[color]} border rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02]`}>
        <Icon className="w-6 h-6 mb-2" />
        <div className="text-sm font-medium">{label}</div>
      </div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-40 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl" />
      <div className="h-24 bg-gray-100 rounded-xl" />
      <div className="h-32 bg-gray-100 rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map((i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-gray-100 rounded-xl" />
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}
