"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Label } from "@ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import { Textarea } from "@ui/components/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@ui/components/tooltip";
import { cn } from "@ui/lib";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Calendar,
  Check,
  Heart,
  Info,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";

interface GeneratedVariation {
  text: string;
  hashtags: string[];
  contentType?: string;
  imageDescription?: string;
  imageUrl?: string;
  hook?: string;
  style?: string;
}

const HERO_STORAGE_PREFIX = "fm-marketing-content-hero-dismissed:";

const TOPIC_SUGGESTIONS_BY_TYPE = {
  promotional: [
    "New product launch",
    "Special offer",
    "Customer success story",
    "Behind the brand",
  ],
  educational: ["Industry tip", "How-to guide", "Myth vs fact", "Did you know?"],
  entertaining: ["Meme-worthy moment", "Team fun", "Caption this", "Throwback"],
  "behind-scenes": ["Day in the life", "Making of", "Meet the team", "Our workspace"],
  tips: ["Quick win", "Pro tip", "Common mistakes", "Best practices"],
  auto: ["Trending now", "Seasonal", "Engagement bait", "Storytelling"],
} as const;

function getTopicSuggestionsForType(contentType: string): string[] {
  if (contentType in TOPIC_SUGGESTIONS_BY_TYPE) {
    return [
      ...TOPIC_SUGGESTIONS_BY_TYPE[
        contentType as keyof typeof TOPIC_SUGGESTIONS_BY_TYPE
      ],
    ];
  }
  return [...TOPIC_SUGGESTIONS_BY_TYPE.auto];
}

const PLATFORM_DISPLAY: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
};

const TYPEWRITER_BASE = "AI is crafting your content";

function getWhyThisWorksText(variation: GeneratedVariation): string {
  const style = variation.style?.toLowerCase().trim();
  if (style === "direct") {
    return "Direct CTA approach — clear, action-oriented copy.";
  }
  if (style === "storytelling") {
    return "Uses storytelling hook — narrative-driven engagement.";
  }
  if (style === "educational") {
    return "Educational value-first — teaches before selling.";
  }
  if (variation.hook?.trim()) {
    return `Opening angle: “${variation.hook.trim()}”.`;
  }
  return "Balanced approach — tuned for your brand voice.";
}

const CONTENT_TYPES = [
  { id: "promotional", label: "🛍️ Promote", icon: "🛍️" },
  { id: "educational", label: "📚 Educate", icon: "📚" },
  { id: "entertaining", label: "🎉 Entertain", icon: "🎉" },
  { id: "behind-scenes", label: "🎬 Behind the scenes", icon: "🎬" },
  { id: "tips", label: "💡 Tips", icon: "💡" },
  { id: "auto", label: "🎲 Surprise me", icon: "🎲" },
];

const PLATFORMS = [
  { id: "instagram", label: "📷 Instagram" },
  { id: "facebook", label: "📘 Facebook" },
  { id: "tiktok", label: "🎵 TikTok" },
];

export default function CreateContentPage() {
  const params = useParams();
  const router = useRouter();
  const organizationSlug = params.organizationSlug as string;
  const { activeOrganization, loaded } = useActiveOrganization();

  const [step, setStep] = useState(1);
  const [contentType, setContentType] = useState<string>("");
  const [platform, setPlatform] = useState<string>("instagram");
  const [topic, setTopic] = useState<string>("");
  const [variations, setVariations] = useState<GeneratedVariation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedCount, setPublishedCount] = useState<number | null>(null);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [heroDismissed, setHeroDismissed] = useState(false);
  const [typewriterShown, setTypewriterShown] = useState("");
  const [genPhase, setGenPhase] = useState(0);

  const canProceedStep1 = contentType !== "";

  const fetchDashboardStats = useCallback(async () => {
    if (!activeOrganization?.id) return;
    try {
      const res = await fetch(
        `/api/marketing/dashboard/stats?organizationSlug=${encodeURIComponent(organizationSlug)}&organizationId=${activeOrganization.id}`,
      );
      if (res.ok) {
        const data = await res.json();
        setPublishedCount(
          typeof data.publishedCount === "number" ? data.publishedCount : 0,
        );
      }
    } catch {
      setPublishedCount(null);
    } finally {
      setStatsLoaded(true);
    }
  }, [activeOrganization?.id, organizationSlug]);

  useEffect(() => {
    if (!loaded || !activeOrganization?.id) return;
    setPublishedCount(null);
    setStatsLoaded(false);
    const key = `${HERO_STORAGE_PREFIX}${activeOrganization.id}`;
    if (typeof window !== "undefined") {
      setHeroDismissed(localStorage.getItem(key) === "1");
    }
    void fetchDashboardStats();
  }, [loaded, activeOrganization?.id, fetchDashboardStats]);

  const dismissHeroBanner = useCallback(() => {
    if (!activeOrganization?.id) return;
    const key = `${HERO_STORAGE_PREFIX}${activeOrganization.id}`;
    localStorage.setItem(key, "1");
    setHeroDismissed(true);
  }, [activeOrganization?.id]);

  const showFirstTimeHero =
    statsLoaded &&
    publishedCount === 0 &&
    !heroDismissed;

  const topicSuggestions = useMemo(
    () => getTopicSuggestionsForType(contentType || "auto"),
    [contentType],
  );

  useEffect(() => {
    if (!isGenerating) {
      setTypewriterShown("");
      setGenPhase(0);
      return;
    }
    const full = `${TYPEWRITER_BASE}...`;
    let i = 0;
    setTypewriterShown("");
    const id = window.setInterval(() => {
      i += 1;
      setTypewriterShown(full.slice(0, Math.min(i, full.length)));
      if (i >= full.length) window.clearInterval(id);
    }, 38);
    const phaseId = window.setInterval(() => {
      setGenPhase((p) => (p + 1) % 3);
    }, 2200);
    return () => {
      window.clearInterval(id);
      window.clearInterval(phaseId);
    };
  }, [isGenerating]);

  const platformDisplayName = PLATFORM_DISPLAY[platform] ?? platform;

  async function handleGenerate() {
    if (!activeOrganization?.id) return;

    setIsGenerating(true);
    setVariations([]);
    setSelectedVariation(null);

    try {
      const res = await fetch("/api/marketing/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationSlug,
          contentType: contentType === "auto" ? undefined : contentType,
          topic: topic.trim() || undefined,
          platform,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Failed to generate content");
      }

      if (data.variations && Array.isArray(data.variations)) {
        setVariations(data.variations);
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  }

  const createGeneratedPost = async (
    variation: GeneratedVariation,
    status: "draft" | "scheduled",
    scheduledAt?: string,
  ) => {
    if (!activeOrganization?.id) {
      throw new Error("Organization unavailable");
    }

    const createRes = await fetch("/api/marketing/generated-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: activeOrganization.id,
        mainText: variation.text,
        hashtags: variation.hashtags || [],
        contentType: contentType === "auto" ? "producto" : contentType,
        platform,
        selectedImageUrl: variation.imageUrl,
        imagePrompt: variation.imageDescription,
        status,
        scheduledAt,
      }),
    });

    const createData = await createRes.json();
    if (!createRes.ok || !createData?.post?.id) {
      throw new Error(createData?.error || "Could not save post");
    }

    return createData.post.id as string;
  };

  const handlePublishNow = async (variation: GeneratedVariation) => {
    if (!variation.imageUrl) {
      toast.error('An image is required to publish.');
      return;
    }

    if (platform !== "instagram") {
      toast.error("Publish now is only available for Instagram.");
      return;
    }

    const confirmed = window.confirm(
      "Publish to Instagram now? This cannot be undone.",
    );
    if (!confirmed) {
      return;
    }

    setIsPublishing(true);

    try {
      const postId = await createGeneratedPost(variation, "draft");
      const publishRes = await fetch("/api/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const publishData = await publishRes.json();

      if (!publishRes.ok || !publishData?.success) {
        throw new Error(publishData?.error || "Failed to publish");
      }

      toast.success("Published to Instagram!");
      void fetchDashboardStats();
      router.push(`/app/${organizationSlug}/marketing/content?tab=published`);
    } catch (error: any) {
      toast.error(`Failed to publish: ${error.message || "Unknown error"}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSchedule = async (variation: GeneratedVariation) => {
    if (!variation.imageUrl && platform === 'instagram') {
      toast.error('Instagram requires an image.');
      return;
    }

    try {
      await createGeneratedPost(
        variation,
        "scheduled",
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      );

      toast.success('Post scheduled for tomorrow');
      router.push(`/app/${organizationSlug}/marketing/content?tab=scheduled`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule');
    }
  };

  const handleSaveDraft = async (variation: GeneratedVariation) => {
    try {
      await createGeneratedPost(variation, "draft");
      toast.success("Draft saved");
      router.push(`/app/${organizationSlug}/marketing/content?tab=draft`);
    } catch (error: any) {
      toast.error(error.message || "Failed to save draft");
    }
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create content</h1>
          <p className="text-muted-foreground mt-2">
            Generate tailored content from your company profile
          </p>
        </div>

        {showFirstTimeHero && (
          <div className="relative overflow-hidden rounded-xl border border-violet-500/35 bg-gradient-to-br from-violet-950/90 via-slate-950/95 to-purple-950/90 p-6 shadow-lg">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-8 left-1/4 h-32 w-32 rounded-full bg-violet-600/15 blur-2xl" />
            <button
              type="button"
              onClick={dismissHeroBanner}
              className="absolute right-3 top-3 rounded-md p-1.5 text-violet-200/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
            <Badge
              className="mb-3 border border-violet-400/40 bg-violet-500/25 text-[10px] font-semibold uppercase tracking-wide text-violet-100"
            >
              Powered by your brand profile
            </Badge>
            <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Create your first AI post ✨
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-violet-100/90 sm:text-base">
              Choose a content type below and our AI will generate 3 branded variations for you.
              Pick your favorite and publish — it takes less than 60 seconds.
            </p>
          </div>
        )}

        {/* Progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                s < step
                  ? "bg-primary text-primary-foreground"
                  : s === step
                    ? "bg-primary/20 text-primary border-2 border-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 3 && (
              <div className={`h-1 w-12 ${s < step ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && "What kind of content do you want?"}
            {step === 2 && "What topic? (optional)"}
            {step === 3 && "Pick your favorite"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Choose a type or let AI decide"}
            {step === 2 && "Add a specific topic or leave it blank"}
            {step === 3 && "Select a variation and publish"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setContentType(type.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    contentType === type.id
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  }`}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className="font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Specific topic (optional)</Label>
                <Textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. New mobile app launch... (leave blank for AI to decide from your profile)"
                  className="min-h-[100px]"
                />
              </div>
              {topic.trim() === "" && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Quick ideas</p>
                  <div className="flex flex-wrap gap-2">
                    {topicSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setTopic(suggestion)}
                        className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-900 transition hover:bg-violet-200/90 dark:bg-violet-500/20 dark:text-violet-100 dark:hover:bg-violet-500/30"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center gap-8 py-8">
                  <div className="w-full max-w-sm animate-pulse rounded-xl border-2 border-violet-500/40 bg-gradient-to-b from-muted/80 to-muted/40 p-4 shadow-[0_0_40px_-8px_rgba(139,92,246,0.35)]">
                    <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                      <div className="h-9 w-9 rounded-full bg-muted-foreground/20" />
                      <div className="flex-1 space-y-2">
                        <div className="h-2.5 w-24 rounded bg-muted-foreground/25" />
                        <div className="h-2 w-16 rounded bg-muted-foreground/15" />
                      </div>
                    </div>
                    <div className="mt-3 aspect-square w-full rounded-lg bg-muted-foreground/15" />
                    <div className="mt-3 flex gap-3">
                      <div className="h-5 w-5 rounded bg-muted-foreground/15" />
                      <div className="h-5 w-5 rounded bg-muted-foreground/15" />
                      <div className="h-5 w-5 rounded bg-muted-foreground/15" />
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-2 w-full rounded bg-muted-foreground/20" />
                      <div className="h-2 w-[92%] rounded bg-muted-foreground/15" />
                      <div className="h-2 w-[70%] rounded bg-muted-foreground/10" />
                    </div>
                  </div>
                  <div className="space-y-3 text-center">
                    <p className="min-h-[1.5rem] font-medium text-foreground">
                      {typewriterShown}
                      <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
                      <span
                        className={cn(
                          "transition-colors",
                          genPhase === 0 ? "font-medium text-violet-600 dark:text-violet-400" : "",
                        )}
                      >
                        Analyzing your brand voice
                      </span>
                      <span aria-hidden className="text-muted-foreground/60">•</span>
                      <span
                        className={cn(
                          "transition-colors",
                          genPhase === 1 ? "font-medium text-violet-600 dark:text-violet-400" : "",
                        )}
                      >
                        Matching your industry
                      </span>
                      <span aria-hidden className="text-muted-foreground/60">•</span>
                      <span
                        className={cn(
                          "transition-colors",
                          genPhase === 2 ? "font-medium text-violet-600 dark:text-violet-400" : "",
                        )}
                      >
                        Optimizing for {platformDisplayName}
                      </span>
                    </div>
                  </div>
                </div>
              ) : variations.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {variations.map((variation, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-xl overflow-hidden transition-all ${
                        selectedVariation === idx ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setSelectedVariation(idx)}
                    >
                      {/* Instagram Preview */}
                      <div className="bg-white dark:bg-gray-800">
                        <div className="flex items-center gap-2 p-3 border-b">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                          <span className="font-semibold text-sm">
                            @{activeOrganization?.name?.toLowerCase().replace(/\s+/g, '') || 'tuempresa'}
                          </span>
                        </div>
                        
                        <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative">
                          {variation.imageUrl ? (
                            <img 
                              src={variation.imageUrl} 
                              alt="" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 p-3">
                          <Heart className="w-6 h-6" />
                          <MessageCircle className="w-6 h-6" />
                          <Send className="w-6 h-6" />
                          <div className="flex-1" />
                          <Bookmark className="w-6 h-6" />
                        </div>

                        <div className="px-3 pb-3">
                          <p className="text-sm line-clamp-3">{variation.text}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {variation.hashtags?.slice(0, 3).map((h, i) => (
                              <span key={i} className="text-xs text-blue-500">#{h}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 border-t border-border/60 bg-muted/40 px-3 py-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex shrink-0 cursor-help pt-0.5">
                              <Info className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            Each variation uses a different creative strategy so you can compare angles.
                          </TooltipContent>
                        </Tooltip>
                        <p className="text-xs leading-snug text-muted-foreground">
                          <span className="font-medium text-foreground">Why this works:</span>{" "}
                          {getWhyThisWorksText(variation)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="p-3 border-t space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            size="sm"
                            className="bg-violet-500 text-white hover:bg-violet-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePublishNow(variation);
                            }}
                            disabled={isPublishing || !variation.imageUrl}
                          >
                            {isPublishing ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Send className="w-4 h-4 mr-2" />
                            )}
                            Publish now
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-violet-300 text-violet-700 hover:bg-violet-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSchedule(variation);
                            }}
                            disabled={!variation.imageUrl}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Schedule post
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveDraft(variation);
                            }}
                          >
                            <Bookmark className="w-4 h-4 mr-2" />
                            Save draft
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Click Generate to create content
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {step === 1 && (
              <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {step === 2 && (
              <Button onClick={() => { setStep(3); handleGenerate(); }} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate content
                  </>
                )}
              </Button>
            )}

            {step === 3 && variations.length === 0 && !isGenerating && (
              <Button onClick={handleGenerate}>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </TooltipProvider>
  );
}
