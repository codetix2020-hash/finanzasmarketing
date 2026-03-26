"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@repo/auth/client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Textarea } from "@ui/components/textarea";
import { Badge } from "@ui/components/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/select";
import { toast } from "sonner";

type OnboardingStep = 1 | 2 | 3 | 4;

interface CreatedOrganization {
	id: string;
	slug: string;
}

const industryOptions = [
	"Restaurant",
	"E-commerce",
	"Fitness",
	"Beauty/Salon",
	"Real Estate",
	"Tech/SaaS",
	"Education",
	"Healthcare",
	"Retail",
	"Other",
] as const;

const toneOptions = [
	"Professional",
	"Friendly",
	"Funny",
	"Bold",
	"Elegant",
	"Casual",
	"Inspirational",
	"Educational",
] as const;

function buildUniqueSlug(input: string) {
	const base = input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.substring(0, 32);

	const uniqueSuffix = Date.now().toString(36);
	return base ? `${base}-${uniqueSuffix}` : `org-${uniqueSuffix}`;
}

function parseLocations(input: string) {
	return input
		.split(",")
		.map((v) => v.trim())
		.filter(Boolean)
		.slice(0, 20);
}

function clampAgeRange(min: number | null, max: number | null) {
	if (min == null || max == null) return { min, max };
	if (min <= max) return { min, max };
	return { min: max, max: min };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Step 1: Your brand
  const [userName, setUserName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [industry, setIndustry] = useState<(typeof industryOptions)[number] | "">("");
  const [industryOther, setIndustryOther] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");

  const [createdOrg, setCreatedOrg] = useState<CreatedOrganization | null>(null);

  // Step 2: Brand voice
  const [selectedTones, setSelectedTones] = useState<string[]>([]);
  const [useEmojis, setUseEmojis] = useState(true);
  const [voiceExample, setVoiceExample] = useState("");

  // Step 3: Target audience
  const [idealCustomer, setIdealCustomer] = useState("");
  const [ageMin, setAgeMin] = useState<number | null>(18);
  const [ageMax, setAgeMax] = useState<number | null>(65);
  const [locationFocus, setLocationFocus] = useState("");

  const steps = useMemo(
    () => [
      { step: 1 as const, title: "Your Brand", description: "Tell us about your business so we can build your brand profile." },
      { step: 2 as const, title: "Brand Voice", description: "Choose how you want to sound across your content." },
      { step: 3 as const, title: "Target Audience", description: "Help the AI tailor content for the people you want to reach." },
      { step: 4 as const, title: "Connect Social Media", description: "Connect your accounts to start publishing automatically." },
    ],
    [],
  );

  const ageOptions = useMemo(() => Array.from({ length: 73 }, (_, i) => i + 13), []);

  const currentStepMeta = steps[step - 1];
  const industryFinal = industry === "Other" ? industryOther.trim() : industry;

  const toneOfVoice = useMemo(() => {
    const tones = selectedTones.length > 0 ? `Tones: ${selectedTones.join(", ")}.` : "";
    const emojis = useEmojis ? "Uses emojis: yes." : "Uses emojis: no.";
    const example = voiceExample.trim() ? `Example: ${voiceExample.trim()}` : "";
    return [tones, emojis, example].filter(Boolean).join(" ");
  }, [selectedTones, useEmojis, voiceExample]);

  const emojiPreview = useMemo(() => {
    if (!useEmojis) return "Example: “New drops are live. Check them out.”";
    const tone = selectedTones[0] ?? "Friendly";
    const vibe = tone === "Professional" ? "✨" : "🔥";
    return `Example: “New drops are live. Check them out.” ${vibe}`;
  }, [selectedTones, useEmojis]);

  const canGoNextFromStep1 =
    userName.trim().length > 0 &&
    orgName.trim().length >= 3 &&
    industryFinal.length > 0 &&
    businessDescription.trim().length >= 20;

  const canGoNextFromStep2 = selectedTones.length >= 2 && selectedTones.length <= 3;

  const { min: normalizedAgeMin, max: normalizedAgeMax } = clampAgeRange(ageMin, ageMax);

  const canGoNextFromStep3 = idealCustomer.trim().length >= 20;

  const handleStep1Submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (!orgName.trim() || orgName.trim().length < 3) {
      toast.error("Your business name must be at least 3 characters.");
      return;
    }
    if (!industryFinal) {
      toast.error("Please select your industry.");
      return;
    }
    if (industry === "Other" && !industryOther.trim()) {
      toast.error("Please type your industry.");
      return;
    }
    if (businessDescription.trim().length < 20) {
      toast.error("Please add a short description (at least 2 sentences).");
      return;
    }
    
    setIsLoading(true);
    try {
      await authClient.updateUser({ name: userName.trim() });

      const uniqueSlug = buildUniqueSlug(orgName);
      const { data: newOrg, error } = await authClient.organization.create({
        name: orgName.trim(),
        slug: uniqueSlug,
      });

      if (error) {
        throw new Error(error.message || "Error creating organization");
      }
      if (!newOrg) {
        throw new Error("Organization could not be created.");
      }

      await authClient.organization.setActive({ organizationId: newOrg.id });
      setCreatedOrg({ id: newOrg.id, slug: newOrg.slug });

      const res = await fetch("/api/onboarding/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: newOrg.id,
          businessName: orgName.trim(),
          industry: industryFinal,
          description: businessDescription.trim(),
          targetAudience: "",
          ageRangeMin: normalizedAgeMin,
          ageRangeMax: normalizedAgeMax,
          targetLocations: parseLocations(locationFocus),
          toneOfVoice: toneOfVoice,
          brandPersonality: selectedTones,
          useEmojis,
          emojiStyle: useEmojis ? "moderate" : "none",
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error creating business profile.");
      }

      toast.success("Brand profile created. Let’s personalize your content.");
      setStep(2);
    } catch (error) {
      console.error("Error during onboarding step 1:", error);
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!createdOrg) {
      toast.error("Your organization was not created. Please go back to step 1.");
      return;
    }
    if (selectedTones.length < 2 || selectedTones.length > 3) {
      toast.error("Pick 2–3 tones.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/onboarding/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: createdOrg.id,
          businessName: orgName.trim(),
          industry: industryFinal,
          description: businessDescription.trim(),
          targetAudience: idealCustomer.trim(),
          ageRangeMin: normalizedAgeMin,
          ageRangeMax: normalizedAgeMax,
          targetLocations: parseLocations(locationFocus),
          toneOfVoice: toneOfVoice,
          brandPersonality: selectedTones,
          useEmojis,
          emojiStyle: useEmojis ? "moderate" : "none",
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error saving brand voice.");
      }

      toast.success("Brand voice saved.");
      setStep(3);
    } catch (error) {
      console.error("Error saving brand voice:", error);
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3Submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!createdOrg) {
      toast.error("Your organization was not created. Please go back to step 1.");
      return;
    }
    if (!canGoNextFromStep3) {
      toast.error("Please describe your ideal customer (at least a couple sentences).");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/onboarding/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: createdOrg.id,
          businessName: orgName.trim(),
          industry: industryFinal,
          description: businessDescription.trim(),
          targetAudience: idealCustomer.trim(),
          ageRangeMin: normalizedAgeMin,
          ageRangeMax: normalizedAgeMax,
          targetLocations: parseLocations(locationFocus),
          toneOfVoice: toneOfVoice,
          brandPersonality: selectedTones,
          useEmojis,
          emojiStyle: useEmojis ? "moderate" : "none",
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error saving target audience.");
      }

      toast.success("Audience saved.");
      setStep(4);
    } catch (error) {
      console.error("Error saving audience:", error);
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboardingAndGoToDashboard = async () => {
    if (!createdOrg) {
      toast.error("Your organization was not created. Please go back to step 1.");
      return;
    }

    setIsLoading(true);
    try {
      await authClient.updateUser({ onboardingComplete: true });
      router.push(`/app/${createdOrg.slug}/marketing/dashboard`);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Could not complete onboarding. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTone = (tone: string) => {
    setSelectedTones((prev) => {
      if (prev.includes(tone)) return prev.filter((t) => t !== tone);
      if (prev.length >= 3) return prev;
      return [...prev, tone];
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950 to-purple-950/30" />
      <Card className="relative w-full max-w-2xl border-zinc-800 bg-zinc-950/70 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            PilotSocials Onboarding
          </CardTitle>
          <CardDescription className="text-zinc-300">
            {currentStepMeta.description}
          </CardDescription>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {steps.map((s) => (
                <div
                  key={s.step}
                  className={`h-2 w-16 rounded-full transition-colors ${
                    step >= s.step ? "bg-gradient-to-r from-purple-500 to-fuchsia-500" : "bg-zinc-800"
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-zinc-400">
              Step {step} of 4
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div
            key={step}
            className="transition-all duration-300 ease-out animate-in fade-in-0 slide-in-from-right-2"
          >
            {step === 1 && (
              <form onSubmit={handleStep1Submit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-zinc-200">
                      Your name
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Jane Doe"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="orgName" className="block text-sm font-medium text-zinc-200">
                      Business / organization name
                    </label>
                    <Input
                      id="orgName"
                      type="text"
                      placeholder="Acme Coffee"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      disabled={isLoading}
                    />
                    <p className="text-xs text-zinc-400">Minimum 3 characters</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-200">
                      Industry
                    </label>
                    <Select
                      value={industry}
                      onValueChange={(v) => setIndustry(v as (typeof industryOptions)[number])}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industryOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {industry === "Other" ? (
                    <div className="space-y-2">
                      <label htmlFor="industryOther" className="block text-sm font-medium text-zinc-200">
                        Your industry
                      </label>
                      <Input
                        id="industryOther"
                        type="text"
                        placeholder="e.g. Local services"
                        value={industryOther}
                        onChange={(e) => setIndustryOther(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-zinc-200">
                        What you do (2–3 sentences)
                      </label>
                      <div className="text-xs text-zinc-400">
                        Example: “We help busy professionals stay fit with 30-minute strength sessions and personalized coaching.”
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="businessDescription" className="block text-sm font-medium text-zinc-200">
                    Business description
                  </label>
                  <Textarea
                    id="businessDescription"
                    placeholder="Write 2–3 sentences about what you do and what makes you different."
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    disabled={isLoading}
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || !canGoNextFromStep1}>
                  {isLoading ? "Creating your workspace..." : "Create workspace & continue"}
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleStep2Submit} className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-sm font-medium text-zinc-200">
                      Tone of voice (pick 2–3)
                    </label>
                    <div className="text-xs text-zinc-400">
                      Selected: {selectedTones.length}/3
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {toneOptions.map((tone) => {
                      const isSelected = selectedTones.includes(tone);
                      return (
                        <button
                          key={tone}
                          type="button"
                          onClick={() => toggleTone(tone)}
                          disabled={isLoading}
                          className="transition-transform active:scale-[0.98]"
                        >
                          <Badge
                            variant={isSelected ? "default" : "secondary"}
                            className={
                              isSelected
                                ? "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:from-purple-500 hover:to-fuchsia-500"
                                : "bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                            }
                          >
                            {tone}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-zinc-200">
                    Use emojis?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setUseEmojis(true)}
                    >
                      <Badge
                        variant={useEmojis ? "default" : "secondary"}
                        className={
                          useEmojis
                            ? "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white"
                            : "bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                        }
                      >
                        Yes
                      </Badge>
                    </button>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setUseEmojis(false)}
                    >
                      <Badge
                        variant={!useEmojis ? "default" : "secondary"}
                        className={
                          !useEmojis
                            ? "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white"
                            : "bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                        }
                      >
                        No
                      </Badge>
                    </button>
                  </div>
                  <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3 text-sm text-zinc-200">
                    {emojiPreview}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="voiceExample" className="block text-sm font-medium text-zinc-200">
                    Example of how you want to sound (optional)
                  </label>
                  <Textarea
                    id="voiceExample"
                    placeholder="Paste or write a short example post in your ideal style."
                    value={voiceExample}
                    onChange={(e) => setVoiceExample(e.target.value)}
                    disabled={isLoading}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading || !canGoNextFromStep2}>
                    {isLoading ? "Saving..." : "Continue"}
                  </Button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleStep3Submit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="idealCustomer" className="block text-sm font-medium text-zinc-200">
                    Who is your ideal customer?
                  </label>
                  <Textarea
                    id="idealCustomer"
                    placeholder="Describe who you’re trying to reach, what they care about, and what motivates them."
                    value={idealCustomer}
                    onChange={(e) => setIdealCustomer(e.target.value)}
                    disabled={isLoading}
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-200">
                      Age range (min)
                    </label>
                    <Select
                      value={normalizedAgeMin?.toString() ?? ""}
                      onValueChange={(v) => setAgeMin(Number(v))}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        {ageOptions.map((age) => (
                          <SelectItem key={age} value={age.toString()}>
                            {age}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-200">
                      Age range (max)
                    </label>
                    <Select
                      value={normalizedAgeMax?.toString() ?? ""}
                      onValueChange={(v) => setAgeMax(Number(v))}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Max" />
                      </SelectTrigger>
                      <SelectContent>
                        {ageOptions.map((age) => (
                          <SelectItem key={age} value={age.toString()}>
                            {age}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="locationFocus" className="block text-sm font-medium text-zinc-200">
                    Location focus
                  </label>
                  <Input
                    id="locationFocus"
                    type="text"
                    placeholder="e.g. Austin, TX; Bay Area; London (comma-separated)"
                    value={locationFocus}
                    onChange={(e) => setLocationFocus(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-zinc-400">Separate multiple locations with commas.</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading || !canGoNextFromStep3}>
                    {isLoading ? "Saving..." : "Continue"}
                  </Button>
                </div>
              </form>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="text-sm font-medium text-zinc-200">
                    Connect accounts
                  </div>
                  <div className="mt-1 text-sm text-zinc-400">
                    You can connect now or skip and do it later from Settings.
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading || !createdOrg}
                    onClick={() => {
                      if (!createdOrg) return;
                      router.push(`/app/${createdOrg.slug}/settings/social-accounts`);
                    }}
                  >
                    Connect Instagram
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading || !createdOrg}
                    onClick={() => {
                      if (!createdOrg) return;
                      router.push(`/app/${createdOrg.slug}/settings/social-accounts`);
                    }}
                  >
                    Connect Facebook
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading || !createdOrg}
                    onClick={() => {
                      if (!createdOrg) return;
                      router.push(`/app/${createdOrg.slug}/settings/social-accounts`);
                    }}
                  >
                    Connect TikTok
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(3)}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={completeOnboardingAndGoToDashboard}
                    disabled={isLoading || !createdOrg}
                  >
                    {isLoading ? "Finishing..." : "Skip for now"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
