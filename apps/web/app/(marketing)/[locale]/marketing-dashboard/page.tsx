"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardData {
  overview: {
    totalRevenue: number;
    activeCampaigns: number;
    conversionRate: number;
    avgROAS: number;
    revenueChart: Array<{ date: string; revenue: number }>;
  };
  content: {
    posts: Array<{
      id: string;
      platform: string;
      title: string;
      content: any;
      status: string;
      createdAt: string;
    }>;
    stats: { ready: number; published: number };
  };
  campaigns: Array<{
    id: string;
    name: string;
    platform: string;
    status: string;
    performance: {
      spend: number;
      impressions: number;
      clicks: number;
      conversions: number;
      roi: number;
    };
  }>;
  attribution: {
    byChannel: Array<{ channel: string; revenue: number; model: string }>;
    topCampaigns: Array<{ name: string; roi: number }>;
    avgTouchpoints: number;
    avgTimeToConversion: number;
  };
}

export default function MarketingDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    try {
      // TODO: Usar organizationId real del usuario logueado
      const orgId = "8uu4-W6mScG8IQtY";
      const response = await fetch(`/api/marketing/dashboard-data?org=${orgId}`);
      const result = await response.json();
      setData(result);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch inicial
    fetchDashboardData();

    // Auto-refresh cada 30 segundos
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red-600">Error cargando datos del dashboard</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketing Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Última actualización: {lastUpdate.toLocaleTimeString("es-ES")}
          </p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline">
          🔄 Actualizar
        </Button>
      </div>

      {/* SECCIÓN 1: OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenue Total</p>
              <p className="text-2xl font-bold text-green-600">
                €{data.overview.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Campañas Activas</p>
              <p className="text-2xl font-bold text-blue-600">
                {data.overview.activeCampaigns}
              </p>
            </div>
            <div className="text-3xl">📢</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {data.overview.conversionRate}%
              </p>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ROAS Promedio</p>
              <p className="text-2xl font-bold text-orange-600">
                {data.overview.avgROAS}x
              </p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </Card>
      </div>

      {/* Revenue Chart - Simple version */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Revenue últimos 7 días</h2>
        <div className="flex items-end justify-between h-40 gap-2">
          {data.overview.revenueChart.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-blue-600 rounded-t"
                style={{
                  height: `${(day.revenue / Math.max(...data.overview.revenueChart.map(d => d.revenue))) * 100}%`,
                }}
              ></div>
              <p className="text-xs text-gray-600 mt-2">{new Date(day.date).getDate()}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* SECCIÓN 2: CONTENIDO GENERADO */}
      <Card className="p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">Contenido Generado</h2>
            <p className="text-sm text-gray-600">
              {data.content.stats.ready} listos · {data.content.stats.published} publicados
            </p>
          </div>
          <Button size="sm">+ Generar Contenido</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.content.posts.slice(0, 8).map((post) => (
            <Card key={post.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <Badge variant={post.status === "READY" ? "default" : "secondary"}>
                  {post.status}
                </Badge>
                <span className="text-xl">
                  {post.platform === "instagram" ? "📷" : "🎵"}
                </span>
              </div>
              <p className="text-sm font-medium mb-2 line-clamp-2">{post.title}</p>
              <p className="text-xs text-gray-600 line-clamp-3">
                {typeof post.content === "string" 
                  ? post.content 
                  : post.content?.instagram?.content || post.content?.tiktok?.content || "Sin contenido"}
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="flex-1">
                  Editar
                </Button>
                <Button size="sm" className="flex-1">
                  Publicar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* SECCIÓN 3: CAMPAÑAS ACTIVAS */}
      <Card className="p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Campañas de Ads</h2>
          <Button size="sm">+ Nueva Campaña</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 text-sm font-medium text-gray-600">Campaña</th>
                <th className="text-left p-3 text-sm font-medium text-gray-600">Plataforma</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">Spend</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">Impresiones</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">Clicks</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">Conv.</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">ROI</th>
                <th className="text-center p-3 text-sm font-medium text-gray-600">Estado</th>
                <th className="text-center p-3 text-sm font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{campaign.name}</td>
                  <td className="p-3">
                    <Badge variant="outline">
                      {campaign.platform === "google" ? "🔍 Google" : "📘 Facebook"}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">€{campaign.performance.spend.toFixed(2)}</td>
                  <td className="p-3 text-right">{campaign.performance.impressions.toLocaleString()}</td>
                  <td className="p-3 text-right">{campaign.performance.clicks.toLocaleString()}</td>
                  <td className="p-3 text-right">{campaign.performance.conversions}</td>
                  <td className="p-3 text-right">
                    <span className={campaign.performance.roi > 0 ? "text-green-600" : "text-red-600"}>
                      {campaign.performance.roi > 0 ? "+" : ""}{campaign.performance.roi}%
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant={campaign.status === "ACTIVE" ? "default" : "secondary"}>
                      {campaign.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    <Button size="sm" variant="ghost">⋮</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SECCIÓN 4: ATRIBUCIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Revenue por Canal</h2>
          <div className="space-y-3">
            {data.attribution.byChannel.map((channel, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{channel.channel}</span>
                  <span className="text-gray-600">€{channel.revenue.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(channel.revenue / Math.max(...data.attribution.byChannel.map(c => c.revenue))) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Top Campañas por ROI</h2>
          <div className="space-y-3">
            {data.attribution.topCampaigns.map((campaign, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</span>
                  <span className="font-medium">{campaign.name}</span>
                </div>
                <span className="text-green-600 font-bold">{campaign.roi}x</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
            <div>
              <p className="text-sm text-gray-600">Avg Touchpoints</p>
              <p className="text-2xl font-bold">{data.attribution.avgTouchpoints}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Time to Conv.</p>
              <p className="text-2xl font-bold">{data.attribution.avgTimeToConversion}d</p>
            </div>
          </div>
        </Card>
      </div>

      {/* SECCIÓN 5: CONFIGURACIÓN RÁPIDA */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Configuración Rápida</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
            <span className="font-medium">Auto-publicación</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <Button variant="outline" className="justify-start">
            📱 Plataformas Activas
          </Button>

          <Button variant="outline" className="justify-start">
            🎨 Generar Contenido
          </Button>

          <Button variant="outline" className="justify-start">
            📊 Sync Métricas
          </Button>
        </div>
      </Card>
    </div>
  );
}

