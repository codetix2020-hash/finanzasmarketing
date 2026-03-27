"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { PageHeader } from "@saas/shared/components/PageHeader";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Skeleton } from "@ui/components/skeleton";
import { Bot, Calendar, Clock, RefreshCw, CheckCircle2, XCircle, Zap, Shield } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

interface CronLog {
	id: string;
	jobName: string;
	status: string;
	results: string | null;
	error: string | null;
	executedAt: string;
	duration: number | null;
}

interface MarketingConfig {
	id: string;
	organizationId: string;
	isPaused: boolean;
}

interface MarketingPost {
	id: string;
	content: string;
	platform: string;
	status: string;
	scheduledAt?: string;
}

interface SocialConnection {
	id: string;
	isActive: boolean;
}

const JOB_LABELS: Record<string, string> = {
	"marketing-engine": "Content Generation",
	"sync-ads-metrics": "Analytics Sync",
};

function getJobLabel(jobName: string): string {
	return JOB_LABELS[jobName] || "Automation Run";
}

function parseResults(results: string | null): {
	organizationsProcessed?: number;
	contentGenerated?: number;
	postsPublished?: number;
	seoAnalyzed?: number;
	commentsReplied?: number;
	errors?: string[];
} | null {
	if (!results) return null;
	try {
		return JSON.parse(results);
	} catch {
		return null;
	}
}

function formatRelativeDate(dateIso: string): string {
	const dt = new Date(dateIso);
	const diffMs = Date.now() - dt.getTime();
	const diffMin = Math.round(diffMs / 60000);
	if (diffMin < 1) return "A few seconds ago";
	if (diffMin < 60) return `${diffMin} min ago`;
	const diffH = Math.round(diffMin / 60);
	if (diffH < 24) return `${diffH} h ago`;
	const diffD = Math.round(diffH / 24);
	return `${diffD} days ago`;
}

function computeNextRun(lastExecutedAtIso: string | null): Date | null {
	if (!lastExecutedAtIso) return null;
	const dt = new Date(lastExecutedAtIso);
	return new Date(dt.getTime() + 3 * 60 * 60 * 1000);
}

export default function MarketingAutomationPage() {
	const { activeOrganization, loaded } = useActiveOrganization();
	const params = useParams<{ organizationSlug: string }>();

	const [isLoading, setIsLoading] = useState(true);
	const [isToggling, setIsToggling] = useState(false);
	const [config, setConfig] = useState<MarketingConfig | null>(null);
	const [cronLogs, setCronLogs] = useState<CronLog[]>([]);
	const [scheduledPosts, setScheduledPosts] = useState<MarketingPost[]>([]);
	const [hasConnectedSocialAccounts, setHasConnectedSocialAccounts] = useState(false);

	const isAutomationEnabled = useMemo(() => !config?.isPaused, [config?.isPaused]);

	const lastLog = cronLogs[0] || null;
	const nextRun = useMemo(
		() => computeNextRun(lastLog?.executedAt || null),
		[lastLog?.executedAt],
	);

	async function loadAll() {
		if (!activeOrganization?.id) return;
		setIsLoading(true);
		try {
			const [settingsRes, logsRes, postsRes, socialConnectionsRes] = await Promise.all([
				fetch(`/api/marketing/automation/settings?organizationId=${activeOrganization.id}`),
				fetch("/api/marketing/automation/cron-logs?take=10"),
				fetch(
					`/api/marketing/posts?organizationId=${activeOrganization.id}&status=scheduled`,
				),
				fetch(`/api/social/connections?organizationId=${activeOrganization.id}`),
			]);

			const settingsJson = await settingsRes.json();
			const logsJson = await logsRes.json();
			const postsJson = await postsRes.json();
			const socialConnectionsJson = socialConnectionsRes.ok
				? await socialConnectionsRes.json()
				: { connections: [] };

			if (!settingsRes.ok) throw new Error(settingsJson?.error || "Error cargando settings");
			if (!logsRes.ok) throw new Error(logsJson?.error || "Error cargando logs");

			setConfig(settingsJson.config);
			setCronLogs((logsJson.logs || []).map((l: any) => ({ ...l, executedAt: String(l.executedAt) })));
			setScheduledPosts(postsJson?.posts || []);
			const activeConnections = (socialConnectionsJson.connections || []).filter(
				(connection: SocialConnection) => connection.isActive,
			);
			setHasConnectedSocialAccounts(activeConnections.length > 0);
		} catch (error: any) {
			console.error(error);
			toast.error("Failed to load automation center");
		} finally {
			setIsLoading(false);
		}
	}

	useEffect(() => {
		if (!loaded || !activeOrganization?.id) return;
		loadAll();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loaded, activeOrganization?.id]);

	async function toggleAutomation() {
		if (!activeOrganization?.id || !config) return;

		setIsToggling(true);
		try {
			const nextIsPaused = !isAutomationEnabled;
			const res = await fetch("/api/marketing/automation/settings", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					organizationId: activeOrganization.id,
					isPaused: nextIsPaused,
				}),
			});

			const json = await res.json();
			if (!res.ok) throw new Error(json?.error || "Could not update");

			setConfig(json.config);
			toast.success(nextIsPaused ? "Automation paused" : "Automation enabled");
		} catch (error: any) {
			console.error(error);
			toast.error("Failed to update automation");
		} finally {
			setIsToggling(false);
		}
	}

	const generatedByAiCount = useMemo(() => {
		const total = cronLogs.reduce((acc, log) => {
			const r = parseResults(log.results);
			return acc + (r?.contentGenerated || 0);
		}, 0);
		return total;
	}, [cronLogs]);

	if (!loaded) {
		return (
			<>
				<PageHeader title="Automation" subtitle="Your marketing runs 24/7" />
				<div className="p-6">
					<Skeleton className="h-24 w-full" />
				</div>
			</>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader title="Automation" subtitle="Your marketing runs automatically 24/7" />

			<Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-white">
				<CardHeader>
					<CardTitle className="text-2xl">Marketing Autopilot</CardTitle>
					<CardDescription className="text-base">
						When enabled, PilotSocials automatically generates content every week and publishes at optimal times. You review and approve — the AI handles the rest.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<HeroFeatureCard
							title="Weekly Content"
							description="5 new posts generated every Monday"
							icon={<Calendar className="h-5 w-5 text-violet-600" />}
						/>
						<HeroFeatureCard
							title="Smart Scheduling"
							description="Published at peak engagement times"
							icon={<Clock className="h-5 w-5 text-violet-600" />}
						/>
						<HeroFeatureCard
							title="Brand Consistent"
							description="Every post matches your brand voice"
							icon={<Shield className="h-5 w-5 text-violet-600" />}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
				<div className="flex items-center gap-2">
					<Bot className="h-5 w-5 text-muted-foreground" />
					<div className="text-sm text-muted-foreground">
						Status:{" "}
						<span className={isAutomationEnabled ? "text-green-600 font-medium" : "text-muted-foreground font-medium"}>
							{isAutomationEnabled ? "Active" : "Paused"}
						</span>
					</div>
				</div>

				<div className="flex gap-2">
					<Button
						variant="outline"
						className="border-gray-300 text-gray-700 hover:bg-gray-50"
						onClick={toggleAutomation}
						disabled={isLoading || isToggling || !config}
					>
						{isAutomationEnabled ? "Pause automation" : "Enable automation"}
					</Button>
					<Button
						variant="outline"
						className="border-violet-200 text-violet-600 hover:bg-violet-50"
						onClick={loadAll}
						disabled={isLoading}
					>
						<RefreshCw className="mr-2 h-4 w-4" />
						Refresh
					</Button>
				</div>
			</div>

			{!isLoading && !hasConnectedSocialAccounts && (
				<Card className="border-amber-200 bg-amber-50">
					<CardContent className="pt-6">
						<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
							<div>
								<p className="font-semibold text-amber-900">
									Connect a social account to enable auto-publishing
								</p>
								<p className="text-sm text-amber-800">
									Content generation still works without social connections. New posts will be saved as drafts for your review.
								</p>
							</div>
							<Button asChild className="w-full md:w-auto">
								<Link href={`/app/${params.organizationSlug}/marketing/settings/integrations`}>
									Go to settings/integrations
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Status Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card className={isAutomationEnabled ? "border-green-200 bg-green-50 dark:bg-green-950/20" : ""}>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-full flex items-center justify-center bg-muted">
								<Zap className={isAutomationEnabled ? "h-5 w-5 text-green-600" : "h-5 w-5 text-muted-foreground"} />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Status</p>
								<p className="font-bold">{isAutomationEnabled ? "Running" : "Paused"}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-full flex items-center justify-center bg-muted">
								<Calendar className="h-5 w-5 text-blue-600" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Scheduled posts</p>
								<p className="font-bold text-xl">{scheduledPosts.length}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-full flex items-center justify-center bg-muted">
								<Bot className="h-5 w-5 text-purple-600" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">AI-generated</p>
								<p className="font-bold text-xl">{generatedByAiCount}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-full flex items-center justify-center bg-muted">
								<Clock className="h-5 w-5 text-orange-600" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Next run</p>
								<p className="font-bold">
									{nextRun ? nextRun.toLocaleString() : "—"}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Qué hace */}
			<Card>
				<CardHeader>
					<CardTitle>What does the system do automatically?</CardTitle>
					<CardDescription>
						It runs every 3 hours and keeps your marketing on autopilot.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<FeatureRow title="Generates content" description="Creates personalized posts based on your company profile." />
						<FeatureRow title="Publishes automatically" description="Publishes scheduled posts when their time arrives." />
						<FeatureRow title="Analyzes SEO" description="Runs PageSpeed Insights and updates the SEO dashboard." />
						<FeatureRow title="Replies to comments" description="Generates AI replies and marks comments as answered." />
					</div>
				</CardContent>
			</Card>

			{/* Últimas ejecuciones */}
			{(isLoading || cronLogs.length > 0) && (
				<Card>
					<CardHeader>
						<CardTitle>Recent runs</CardTitle>
						<CardDescription>Latest automation activity.</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="space-y-3">
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
							</div>
						) : (
							<div className="space-y-3">
								{cronLogs.map((log) => {
									const ok = log.status === "completed";
									const r = parseResults(log.results);
									return (
										<div key={log.id} className="flex items-center justify-between gap-4 p-3 border rounded-lg">
											<div className="flex items-center gap-3">
												{ok ? (
													<CheckCircle2 className="h-5 w-5 text-green-600" />
												) : (
													<XCircle className="h-5 w-5 text-red-600" />
												)}
												<div>
													<p className="font-medium">{getJobLabel(log.jobName)}</p>
													<p className="text-sm text-muted-foreground">
														{formatRelativeDate(log.executedAt)} • {new Date(log.executedAt).toLocaleString()}
													</p>
												</div>
											</div>

											<div className="text-right text-sm">
												<div className="flex justify-end gap-2 flex-wrap">
													<Badge variant="outline">{log.status}</Badge>
													{typeof log.duration === "number" && (
														<Badge variant="secondary">{Math.round(log.duration / 1000)}s</Badge>
													)}
												</div>
												{r && (
													<p className="text-muted-foreground mt-1">
														{r.contentGenerated || 0} generated • {r.postsPublished || 0} published • {r.seoAnalyzed || 0} SEO • {r.commentsReplied || 0} replies
													</p>
												)}
												{log.error && (
													<p className="text-red-600 mt-1 line-clamp-2">{log.error}</p>
												)}
											</div>
										</div>
									);
								})}
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Próximos posts */}
			<Card>
				<CardHeader>
					<CardTitle>Upcoming scheduled posts</CardTitle>
					<CardDescription>Content that will publish automatically.</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-3">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					) : scheduledPosts.length === 0 ? (
						<p className="text-muted-foreground">
							No scheduled posts yet.
						</p>
					) : (
						<div className="space-y-3">
							{scheduledPosts.slice(0, 8).map((post) => (
								<div key={post.id} className="flex items-center justify-between gap-4 p-3 border rounded-lg">
									<div className="min-w-0">
										<p className="font-medium truncate">{post.content}</p>
										<p className="text-sm text-muted-foreground">
											{post.platform} •{" "}
											{post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : "No date"}
										</p>
									</div>
									<Badge variant="secondary">{post.status}</Badge>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function FeatureRow(props: { title: string; description: string }) {
	return (
		<div className="flex items-start gap-3 p-4 bg-muted/40 rounded-lg">
			<CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
			<div>
				<p className="font-medium">{props.title}</p>
				<p className="text-sm text-muted-foreground">{props.description}</p>
			</div>
		</div>
	);
}

function HeroFeatureCard(props: { title: string; description: string; icon: ReactNode }) {
	return (
		<div className="rounded-lg border bg-background p-4">
			<div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
				{props.icon}
			</div>
			<p className="font-semibold">{props.title}</p>
			<p className="text-sm text-muted-foreground">{props.description}</p>
		</div>
	);
}








