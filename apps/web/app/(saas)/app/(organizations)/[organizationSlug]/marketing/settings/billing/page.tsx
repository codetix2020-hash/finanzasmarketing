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
import { es } from "date-fns/locale";

// Planes
const plans = [
  {
    id: "pro",
    name: "Pro",
    price: 29,
    description: "Para tu marca",
    icon: Zap,
    color: "from-purple-500 to-pink-500",
    popular: true,
    features: [
      "60 posts/mes",
      "1 marca",
      "Instagram + Facebook",
      "Programacion de posts",
      "Publicacion automatica",
      "Calendario visual",
      "Banco de fotos",
      "Soporte por email",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    price: 79,
    description: "Para gestionar clientes",
    icon: Building2,
    color: "from-orange-500 to-red-500",
    features: [
      "Posts ilimitados",
      "5 marcas",
      "Todo de Pro",
      "Soporte prioritario",
      "Reportes (proximamente)",
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
      toast.success("Suscripcion activada! Bienvenido a MarketingOS Pro");
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (canceled === "true") {
      toast.info("Checkout cancelado");
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
      toast.error("Error al iniciar el checkout");
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
      toast.error("Error al abrir el portal de facturacion");
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
            Facturacion
          </h1>
          <p className="text-gray-500">
            Gestiona tu suscripcion y facturacion
          </p>
        </div>

        {/* Alerta de pago pendiente */}
        {isPastDue && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-center gap-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div className="flex-1">
                <p className="font-medium text-red-900">Pago pendiente</p>
                <p className="text-sm text-red-700">
                  Tu ultimo pago fallo. Actualiza tu metodo de pago para
                  mantener tu suscripcion.
                </p>
              </div>
              <Button variant="destructive" onClick={handleManageBilling}>
                Actualizar pago
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
                <span>Tu plan</span>
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
                      ? "Trial gratuito - 14 dias"
                      : `${plans.find((p) => p.id === currentPlan)?.price || 0}€/mes`}
                  </p>
                </div>
              </div>

              {subscription?.currentPeriodEnd && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {subscription.cancelAtPeriodEnd
                      ? "Cancela el"
                      : "Proxima factura:"}{" "}
                    {format(
                      new Date(subscription.currentPeriodEnd as string),
                      "d 'de' MMMM, yyyy",
                      { locale: es }
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
                  Gestionar suscripcion
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Uso */}
          <Card>
            <CardHeader>
              <CardTitle>Uso este mes</CardTitle>
              <CardDescription>Posts generados</CardDescription>
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
                        ? "ilimitados"
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
                        Estas cerca del limite. Considera actualizar tu plan.
                      </p>
                    )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Planes */}
        <h2 className="text-2xl font-bold mb-6">
          {currentPlan === "free" ? "Elige tu plan" : "Cambiar plan"}
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
                      Mas popular
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
                    <span className="text-gray-500">/mes</span>
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
                      Plan actual
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
                          Cargando...
                        </>
                      ) : (
                        <>
                          {currentPlan !== "free" &&
                          plan.price >
                            (plans.find((p) => p.id === currentPlan)?.price ||
                              0)
                            ? "Upgrade"
                            : "Empezar"}
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
          <p>Preguntas? Escribenos a billing@marketingos.com</p>
          <p className="mt-1">
            14 dias de prueba gratis - Cancela cuando quieras - Sin permanencia
          </p>
        </div>
      </div>
    </div>
  );
}

