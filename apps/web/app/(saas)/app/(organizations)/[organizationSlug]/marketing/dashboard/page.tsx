'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card';
import { Button } from '@ui/components/button';
import { Plus, TrendingUp, FileText, Share2, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function MarketingDashboardPage() {
  const params = useParams();
  const orgSlug = params.organizationSlug as string;

  const stats = [
    {
      title: 'Posts Generados',
      value: '0',
      description: 'Contenido creado por IA',
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      title: 'Posts Publicados',
      value: '0',
      description: 'Publicados en redes',
      icon: Share2,
      color: 'text-green-600',
    },
    {
      title: 'Engagement',
      value: '0%',
      description: 'Tasa promedio',
      icon: TrendingUp,
      color: 'text-purple-600',
    },
    {
      title: 'Campañas Activas',
      value: '0',
      description: 'En ejecución',
      icon: BarChart3,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketing Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tu contenido, campañas y métricas de marketing
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Empieza a automatizar tu marketing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Generar Contenido
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/app/${orgSlug}/settings/integrations`}>
                <Share2 className="mr-2 h-4 w-4" />
                Conectar Redes
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Welcome message */}
      <Card>
        <CardHeader>
          <CardTitle>🎉 ¡Bienvenido a MarketingOS!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Tu sistema de marketing automatizado está listo. Conecta tus redes sociales 
            para empezar a generar y publicar contenido automáticamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
