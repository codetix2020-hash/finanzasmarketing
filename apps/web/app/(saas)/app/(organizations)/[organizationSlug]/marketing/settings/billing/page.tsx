"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { Progress } from "@ui/components/progress";
import {
  CheckCircle,
  CreditCard,
  Zap,
  Crown,
  Building2,
  Loader2,
  AlertCircle,
  Sparkles,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

// Planes
const plans = [
  {
    id: "pro",
    name: "Pro",
    price: 29,
    description: "For your brand",
    icon: Zap,
    color: "from-purple-500 to-pink-500",
    popular: true,
    features: [
      "60 posts/month",
      "1 brand",
      "Instagram + Facebook",
      "Post scheduling",
      "Automatic publishing",
      "Visual calendar",
      "Photo library",
      "Email support",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    price: 79,
    description: "For managing clients",
    icon: Building2,
    color: "from-orange-500 to-red-500",
    features: [
      "Unlimited posts",
      "5 brands",
      "Everything in Pro",
      "Priority support",
      "Reports (coming soon)",
    ],
  },
];

export default function BillingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const organizationSlug = params.organizationSlug as string;
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id;

  const [subscription, setSubscription] = useState<Record<string, unknown> | null>(null);
  const [usage, setUsage] = useState<{
    postsUsed: number;
    postsLimit: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  // Mensajes de URL
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (success === "true") {
      toast.success("Subscription activated. Welcome to PilotSocials Pro");
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (canceled === "true") {
      toast.info("Checkout canceled");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  // Cargar suscripción
  useEffect(() => {
    if (organizationId) {
      loadSubscription();
    }
  }, [organizationId]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/billing/subscription?organizationId=${organizationId}`
      );
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
        setUsage(data.usage);
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (planId: string) => {
    if (!organizationId) return;

    setCheckingOut(planId);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, planId }),
      });

      if (!response.ok) throw new Error("Failed to create checkout");

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast.error("Could not start checkout");
      setCheckingOut(null);
    }
  };

  const handleManageBilling = async () => {
    if (!organizationId) return;

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });

      if (!response.ok) throw new Error("Failed to create portal");

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast.error("Could not open billing portal");
    }
  };

  const currentPlan = (subscription?.plan as string) || "free";
  const isTrialing = subscription?.status === "trialing";
  const isPastDue = subscription?.status === "past_due";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 py-8 px-4">
      <div className="container max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Billing
          </h1>
          <p className="text-gray-500">
            Manage your subscription and billing
          </p>
        </div>

        {/* Alerta de pago pendiente */}
        {isPastDue && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-center gap-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div className="flex-1">
                <p className="font-medium text-red-900">Payment past due</p>
                <p className="text-sm text-red-700">
                  Your last payment failed. Update your payment method to keep
                  your subscription active.
                </p>
              </div>
              <Button variant="destructive" onClick={handleManageBilling}>
                Update payment
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Plan actual y uso */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Plan actual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Your plan</span>
                {isTrialing && (
                  <Badge className="bg-purple-100 text-purple-700">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Trial
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`p-3 rounded-xl bg-gradient-to-br ${
                    currentPlan === "agency"
                      ? "from-orange-500 to-red-500"
                      : currentPlan === "pro"
                        ? "from-purple-500 to-pink-500"
                        : "from-gray-400 to-gray-500"
                  }`}
                >
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold capitalize">
                    {currentPlan}
                  </p>
                  <p className="text-gray-500">
                    {currentPlan === "free"
                      ? "Free trial — 14 days"
                      : `${plans.find((p) => p.id === currentPlan)?.price || 0}€/month`}
                  </p>
                </div>
              </div>

              {subscription?.currentPeriodEnd && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {subscription.cancelAtPeriodEnd
                      ? "Cancels on"
                      : "Next invoice:"}{" "}
                    {format(
                      new Date(subscription.currentPeriodEnd as string),
                      "MMMM d, yyyy",
                      { locale: enUS }
                    )}
                  </span>
                </div>
              )}

              {currentPlan !== "free" && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={handleManageBilling}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Manage subscription
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Uso */}
          <Card>
            <CardHeader>
              <CardTitle>Usage this month</CardTitle>
              <CardDescription>Posts generated</CardDescription>
            </CardHeader>
            <CardContent>
              {usage && (
                <>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-3xl font-bold">
                      {usage.postsUsed}
                    </span>
                    <span className="text-gray-500">
                      /{" "}
                      {usage.postsLimit === Infinity
                        ? "unlimited"
                        : usage.postsLimit}{" "}
                      posts
                    </span>
                  </div>
                  <Progress
                    value={
                      usage.postsLimit === Infinity
                        ? 0
                        : (usage.postsUsed / usage.postsLimit) * 100
                    }
                    className="h-2"
                  />
                  {usage.postsLimit !== Infinity &&
                    usage.postsUsed >= usage.postsLimit * 0.8 && (
                      <p className="text-sm text-amber-600 mt-2">
                        You are close to your limit. Consider upgrading your plan.
                      </p>
                    )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Planes */}
        <h2 className="text-2xl font-bold mb-6">
          {currentPlan === "free" ? "Choose your plan" : "Change plan"}
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = currentPlan === plan.id;

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden ${
                  plan.popular
                    ? "border-2 border-purple-500 shadow-lg"
                    : ""
                } ${isCurrent ? "ring-2 ring-green-500" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-purple-600">
                      Most popular
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}€</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button disabled className="w-full">
                      Current plan
                    </Button>
                  ) : (
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? "bg-gradient-to-r from-purple-600 to-pink-600"
                          : ""
                      }`}
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handleCheckout(plan.id)}
                      disabled={!!checkingOut}
                    >
                      {checkingOut === plan.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          {currentPlan !== "free" &&
                          plan.price >
                            (plans.find((p) => p.id === currentPlan)?.price ||
                              0)
                            ? "Upgrade"
                            : "Get started"}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Questions? Email billing@pilotsocials.com</p>
          <p className="mt-1">
            14-day free trial — cancel anytime — no long-term commitment
          </p>
        </div>
      </div>
    </div>
  );
}

