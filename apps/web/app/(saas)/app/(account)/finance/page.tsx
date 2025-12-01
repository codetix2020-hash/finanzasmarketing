import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Skeleton } from "@ui/components/skeleton";
import { orpcClient } from "@shared/lib/orpc-client";
import {
  TrendingUp,
  DollarSign,
  PiggyBank,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

// Componente de métrica
function MetricCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  gradient,
}: {
  title: string;
  value: string;
  change?: number;
  trend?: "up" | "down";
  icon: any;
  gradient: string;
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
      <div className={`absolute inset-0 opacity-5 ${gradient}`} />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-full ${gradient} bg-opacity-10`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {value}
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {trend === "up" ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            <Badge
              status={trend === "up" ? "success" : "error"}
              className="text-xs font-semibold"
            >
              {change > 0 ? "+" : ""}
              {change.toFixed(1)}%
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Tabla de organizaciones
function OrganizationsTable({ organizations }: { organizations: any[] }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "PAUSED":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      case "OPTIMIZING":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "KILLED":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "";
    }
  };

  const getROIColor = (roi: number) => {
    if (roi > 200) return "text-green-500 font-bold";
    if (roi > 100) return "text-blue-500 font-semibold";
    if (roi > 0) return "text-yellow-500";
    return "text-red-500 font-semibold";
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Portfolio de SaaS</CardTitle>
        <p className="text-sm text-muted-foreground">
          Rendimiento financiero de cada producto
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  SaaS
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  MRR
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Revenue (30d)
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Costs (30d)
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Profit
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  ROI
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {organizations.map((org) => (
                <tr
                  key={org.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-4 font-medium">{org.name}</td>
                  <td className="px-4 py-4 text-right tabular-nums">
                    {formatCurrency(org.mrr)}
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums">
                    {formatCurrency(org.revenue)}
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums text-muted-foreground">
                    {formatCurrency(org.costs)}
                  </td>
                  <td
                    className={`px-4 py-4 text-right font-semibold tabular-nums ${
                      org.profit > 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {formatCurrency(org.profit)}
                  </td>
                  <td
                    className={`px-4 py-4 text-right tabular-nums ${getROIColor(
                      org.roi
                    )}`}
                  >
                    {org.roi.toFixed(1)}%
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Badge className={getStatusColor(org.status)}>
                      {org.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente principal con datos
async function FinanceOverview() {
  const data = await orpcClient.finance.getOverview();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          FinanceOS Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">
          Inteligencia financiera para tu portfolio de SaaS
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="MRR Total"
          value={formatCurrency(data.totalMRR)}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
        />
        <MetricCard
          title="Revenue (30d)"
          value={formatCurrency(data.totalRevenue)}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-purple-500 to-pink-500"
        />
        <MetricCard
          title="Profit Neto"
          value={formatCurrency(data.netProfit)}
          trend={data.netProfit > 0 ? "up" : "down"}
          icon={PiggyBank}
          gradient="bg-gradient-to-br from-green-500 to-emerald-500"
        />
        <MetricCard
          title="ROI Promedio"
          value={`${data.avgROI.toFixed(1)}%`}
          trend={data.avgROI > 0 ? "up" : "down"}
          icon={Target}
          gradient="bg-gradient-to-br from-orange-500 to-yellow-500"
        />
      </div>

      {/* Organizations Table */}
      <OrganizationsTable organizations={data.organizations} />
    </div>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-6 w-80" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

// Export principal
export default function FinancePage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Suspense fallback={<LoadingSkeleton />}>
        <FinanceOverview />
      </Suspense>
    </div>
  );
}
