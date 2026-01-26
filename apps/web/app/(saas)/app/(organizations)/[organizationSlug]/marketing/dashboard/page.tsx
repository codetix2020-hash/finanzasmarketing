"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  Sparkles, TrendingUp, Users, Heart, FileText, Clock, 
  CheckCircle, Circle, ArrowRight, Instagram, Facebook,
  Zap, Calendar, MessageCircle, BarChart3, Target,
  Bot, RefreshCw, ChevronRight, Play, Pause, Eye,
  DollarSign, Timer, Award, Rocket
} from "lucide-react";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useSession } from "@saas/auth/hooks/use-session";

export default function MarketingDashboard() {
  const params = useParams();
  const orgSlug = params.organizationSlug as string;
  const { activeOrganization, loaded } = useActiveOrganization();
  const { user } = useSession();
  
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isAutomationActive, setIsAutomationActive] = useState(true);

  useEffect(() => {
    // Actualizar título de la página
    document.title = "Dashboard | MarketingOS";
    
    if (loaded && activeOrganization?.id) {
      fetchDashboardData();
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
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        setAccounts(Array.isArray(accountsData) ? accountsData : []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular progreso de setup
  const setupSteps = [
    { id: 'account', label: 'Cuenta creada', done: true },
    { id: 'social', label: 'Red social conectada', done: accounts.length > 0 },
    { id: 'profile', label: 'Perfil de empresa', done: profile?.isComplete },
    { id: 'photos', label: 'Fotos subidas', done: (stats?.mediaCount || 0) > 0 },
  ];
  const completedSteps = setupSteps.filter(s => s.done).length;
  const setupProgress = Math.round((completedSteps / setupSteps.length) * 100);
  const isFullySetup = setupProgress === 100;

  // Calcular valor generado (estimaciones)
  const hoursPerPost = 2; // horas que toma crear un post manualmente
  const hourlyRate = 50; // €/hora de un social media manager
  const postsThisMonth = stats?.publishedCount || 0;
  const hoursSaved = postsThisMonth * hoursPerPost;
  const moneySaved = hoursSaved * hourlyRate;
  const roi = moneySaved > 0 ? (moneySaved / 500).toFixed(1) : 0; // asumiendo €500/mes

  // Obtener hora actual para saludo
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  // Obtener el nombre real del usuario (solo primer nombre)
  const userName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuario';

  if (!loaded || isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* HEADER CON SALUDO Y ESTADO */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white relative overflow-hidden">
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
                    <span>Tu marketing está funcionando automáticamente</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                    <span>Sistema pausado - Completa la configuración</span>
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
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Activar
                </>
              )}
            </button>
          </div>

          {/* Próxima acción */}
          {isAutomationActive && (
            <div className="mt-4 flex items-center gap-2 text-sm bg-white/10 rounded-lg px-4 py-2 w-fit">
              <Clock className="w-4 h-4" />
              <span>Próxima publicación: <strong>Mañana 10:00</strong> en Instagram</span>
            </div>
          )}
        </div>
      </div>

      {/* BARRA DE PROGRESO DE SETUP (si no está completo) */}
      {!isFullySetup && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-amber-900">Completa tu configuración</span>
            </div>
            <span className="text-2xl font-bold text-amber-600">{setupProgress}%</span>
          </div>
          
          <div className="w-full bg-amber-200 rounded-full h-2 mb-4">
            <div 
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${setupProgress}%` }}
            />
          </div>

          <div className="flex items-center gap-6">
            {setupSteps.map((step, i) => (
              <div key={step.id} className="flex items-center gap-2">
                {step.done ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5 text-amber-300" />
                )}
                <span className={`text-sm ${step.done ? 'text-green-700' : 'text-amber-600'}`}>
                  {step.label}
                </span>
                {i < setupSteps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-amber-300 ml-2" />
                )}
              </div>
            ))}
          </div>

          {/* CTA para completar el siguiente paso */}
          <div className="mt-4">
            {!setupSteps[1].done && (
              <Link href={`/app/${orgSlug}/settings/integrations`}>
                <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                  Conectar Instagram
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            )}
            {setupSteps[1].done && !setupSteps[2].done && (
              <Link href={`/app/${orgSlug}/marketing/profile`}>
                <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                  Completar perfil de empresa
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            )}
            {setupSteps[2].done && !setupSteps[3].done && (
              <Link href={`/app/${orgSlug}/marketing/media`}>
                <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                  Subir fotos de tu negocio
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* VALOR GENERADO */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900">Valor generado este mes</h3>
            <p className="text-sm text-green-600">Lo que estarías pagando a una agencia</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <Timer className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-700">{hoursSaved}h</div>
            <div className="text-xs text-green-600">Horas ahorradas</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <DollarSign className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-700">€{moneySaved.toLocaleString()}</div>
            <div className="text-xs text-green-600">Equivalente en agencia</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <Award className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-700">{roi}x</div>
            <div className="text-xs text-green-600">ROI de tu inversión</div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard 
          icon={Eye}
          label="Alcance Total"
          value={stats?.totalReach ? stats.totalReach.toLocaleString() : '—'}
          change={stats?.totalReach ? undefined : 'Conecta redes para ver'}
          positive={!!stats?.totalReach}
          color="blue"
        />
        <KPICard 
          icon={Heart}
          label="Engagement"
          value={stats?.engagementRate ? `${stats.engagementRate}%` : '—'}
          change={stats?.engagementRate ? undefined : undefined}
          positive={!!stats?.engagementRate}
          color="pink"
        />
        <KPICard 
          icon={Users}
          label="Seguidores"
          value={stats?.totalFollowers ? stats.totalFollowers.toLocaleString() : '—'}
          change={stats?.totalFollowers ? undefined : 'Conecta cuentas para ver'}
          positive={!!stats?.totalFollowers}
          color="purple"
        />
        <KPICard 
          icon={FileText}
          label="Posts este mes"
          value={stats?.publishedCount || '0'}
          change={`de ${stats?.scheduledCount || 0} programados`}
          color="green"
        />
      </div>

      {/* DOS COLUMNAS: Próximas acciones + Actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PRÓXIMAS ACCIONES DEL SISTEMA */}
        <div className="bg-white border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold">Próximas acciones automáticas</h3>
            </div>
            <Link href={`/app/${orgSlug}/marketing/automation`}>
              <span className="text-sm text-purple-500 hover:underline">Ver todo</span>
            </Link>
          </div>

          <div className="space-y-3">
            <ActionItem 
              time="10:00"
              action="Publicar post sobre productos"
              platform="instagram"
            />
            <ActionItem 
              time="13:00"
              action="Responder 3 comentarios pendientes"
              platform="instagram"
            />
            <ActionItem 
              time="18:00"
              action="Analizar métricas del día"
              platform="system"
            />
            <ActionItem 
              time="21:00"
              action="Programar contenido para mañana"
              platform="system"
            />
          </div>

          {!isFullySetup && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
              ⚠️ Completa tu configuración para activar las acciones automáticas
            </div>
          )}
        </div>

        {/* ACTIVIDAD RECIENTE */}
        <div className="bg-white border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">Actividad reciente</h3>
            </div>
          </div>

          <div className="space-y-3">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity: any, i: number) => (
                <ActivityItem key={i} {...activity} />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Sin actividad aún</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Cuando publiques contenido, verás la actividad aquí
                </p>
                <Link href={`/app/${orgSlug}/marketing/content/create`}>
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                    <Sparkles className="w-4 h-4" />
                    Crear primer post
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CUENTAS CONECTADAS */}
      <div className="bg-white border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Cuentas conectadas</h3>
          <Link href={`/app/${orgSlug}/settings/integrations`}>
            <span className="text-sm text-blue-500 hover:underline">Gestionar</span>
          </Link>
        </div>

        <div className="flex flex-wrap gap-3">
          {accounts.length > 0 ? (
            accounts.map((account: any) => (
              <div 
                key={account.id}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full"
              >
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                {account.platform === 'instagram' && <Instagram className="w-4 h-4 text-pink-500" />}
                {account.platform === 'facebook' && <Facebook className="w-4 h-4 text-blue-500" />}
                <span className="text-sm font-medium">@{account.accountName || account.username || 'Unknown'}</span>
              </div>
            ))
          ) : (
            <Link href={`/app/${orgSlug}/settings/integrations`}>
              <button className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-full text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
                <span className="text-lg">+</span>
                <span className="text-sm">Conectar red social</span>
              </button>
            </Link>
          )}
          
          {accounts.length > 0 && accounts.length < 3 && (
            <Link href={`/app/${orgSlug}/settings/integrations`}>
              <button className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-full text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
                <span className="text-lg">+</span>
                <span className="text-sm">Añadir otra</span>
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction 
          href={`/app/${orgSlug}/marketing/content/create`}
          icon={Sparkles}
          label="Crear post con IA"
          color="purple"
        />
        <QuickAction 
          href={`/app/${orgSlug}/marketing/assistant`}
          icon={Bot}
          label="Hablar con el asistente"
          color="blue"
        />
        <QuickAction 
          href={`/app/${orgSlug}/marketing/content/calendar`}
          icon={Calendar}
          label="Ver calendario"
          color="green"
        />
        <QuickAction 
          href={`/app/${orgSlug}/marketing/seo`}
          icon={Target}
          label="Analizar SEO"
          color="orange"
        />
      </div>
    </div>
  );
}

// Componentes auxiliares
function KPICard({ icon: Icon, label, value, change, positive, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    pink: 'bg-pink-50 text-pink-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {change && (
          <span className={`text-xs font-medium ${positive ? 'text-green-500' : 'text-gray-400'}`}>
            {change}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

function ActionItem({ time, action, platform }: any) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="text-sm font-mono text-gray-400 w-12">{time}</div>
      <div className="w-px h-8 bg-gray-200" />
      <div className="flex-1">
        <div className="text-sm font-medium">{action}</div>
        <div className="text-xs text-gray-400 capitalize">{platform}</div>
      </div>
      {platform === 'instagram' && <Instagram className="w-4 h-4 text-pink-500" />}
      {platform === 'system' && <Bot className="w-4 h-4 text-purple-500" />}
    </div>
  );
}

function ActivityItem({ type, message, time, platform }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        type === 'post' ? 'bg-green-100' : 
        type === 'comment' ? 'bg-blue-100' : 'bg-gray-100'
      }`}>
        {type === 'post' && <FileText className="w-4 h-4 text-green-600" />}
        {type === 'comment' && <MessageCircle className="w-4 h-4 text-blue-600" />}
        {type === 'seo' && <BarChart3 className="w-4 h-4 text-gray-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">{message}</p>
        <p className="text-xs text-gray-400">{time}</p>
      </div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, color }: any) {
  const colors: Record<string, string> = {
    purple: 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
    blue: 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
    green: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
    orange: 'from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600',
  };

  return (
    <Link href={href}>
      <div className={`bg-gradient-to-r ${colors[color]} rounded-xl p-4 text-white cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg`}>
        <Icon className="w-6 h-6 mb-2" />
        <div className="text-sm font-medium">{label}</div>
      </div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero skeleton */}
      <div className="h-40 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl" />
      
      {/* Progress bar skeleton */}
      <div className="h-24 bg-gray-100 rounded-xl" />
      
      {/* Value section skeleton */}
      <div className="h-32 bg-gray-100 rounded-xl" />
      
      {/* KPIs skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-28 bg-gray-100 rounded-xl" />
        ))}
      </div>
      
      {/* Two columns skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-gray-100 rounded-xl" />
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}
