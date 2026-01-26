"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Progress } from "@repo/ui/components/progress";
import { Checkbox } from "@repo/ui/components/checkbox";
import { 
  Globe, Search, AlertCircle, CheckCircle, Copy, ExternalLink, 
  Play, ChevronDown, ChevronRight, RefreshCw, Zap, Target,
  FileText, Image, Clock, Link2, Code, Eye, TrendingUp,
  Youtube, BookOpen, Lightbulb, ArrowRight, Check, X
} from "lucide-react";
import { toast } from "sonner";

// Tipos de problemas SEO
const ISSUE_TYPES = {
  'meta-description': { 
    icon: FileText, 
    color: 'text-red-500',
    label: 'Meta Descriptions'
  },
  'meta-title': { 
    icon: FileText, 
    color: 'text-red-500',
    label: 'Títulos de Página'
  },
  'headings': { 
    icon: Code, 
    color: 'text-orange-500',
    label: 'Estructura de Encabezados'
  },
  'images': { 
    icon: Image, 
    color: 'text-yellow-500',
    label: 'Optimización de Imágenes'
  },
  'alt-text': { 
    icon: Image, 
    color: 'text-yellow-500',
    label: 'Texto Alternativo'
  },
  'speed': { 
    icon: Clock, 
    color: 'text-orange-500',
    label: 'Velocidad de Carga'
  },
  'links': { 
    icon: Link2, 
    color: 'text-blue-500',
    label: 'Enlaces Rotos'
  },
  'mobile': { 
    icon: Eye, 
    color: 'text-purple-500',
    label: 'Experiencia Móvil'
  },
};

const PLATFORMS = [
  { value: 'wordpress', label: 'WordPress', icon: '🔵' },
  { value: 'wix', label: 'Wix', icon: '⚫' },
  { value: 'shopify', label: 'Shopify', icon: '🟢' },
  { value: 'squarespace', label: 'Squarespace', icon: '⬛' },
  { value: 'webflow', label: 'Webflow', icon: '🔷' },
  { value: 'html', label: 'HTML/Código', icon: '📄' },
  { value: 'other', label: 'Otro', icon: '❓' },
];

export default function SeoPage() {
  const params = useParams();
  const organizationSlug = params.organizationSlug as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [seoConfig, setSeoConfig] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [platform, setPlatform] = useState<string>('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSeoData();
  }, [organizationSlug]);

  const fetchSeoData = async () => {
    try {
      const res = await fetch(`/api/marketing/seo/config?organizationSlug=${organizationSlug}`);
      if (res.ok) {
        const data = await res.json();
        setSeoConfig(data.config);
        setIssues(data.issues || []);
        setWebsiteUrl(data.config?.websiteUrl || '');
        setPlatform(data.config?.platform || '');
      }
    } catch (error) {
      console.error('Error fetching SEO data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!websiteUrl) {
      toast.error('Ingresa la URL de tu sitio web');
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/marketing/seo/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          organizationSlug, 
          websiteUrl,
          platform 
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSeoConfig(data.config);
        setIssues(data.issues);
        toast.success('Análisis completado');
      } else {
        toast.error('Error al analizar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMarkFixed = async (issueId: string) => {
    try {
      await fetch(`/api/marketing/seo/issues/${issueId}/mark-fixed`, {
        method: 'POST',
      });
      
      setIssues(issues.map(i => 
        i.id === issueId ? { ...i, status: 'fixed', fixedAt: new Date() } : i
      ));
      toast.success('Marcado como resuelto');
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const handleVerify = async (issueId: string) => {
    try {
      const res = await fetch(`/api/marketing/seo/issues/${issueId}/verify`, {
        method: 'POST',
      });
      const data = await res.json();
      
      if (data.isFixed) {
        setIssues(issues.map(i => 
          i.id === issueId ? { ...i, status: 'fixed', verifiedAt: new Date() } : i
        ));
        toast.success('¡Verificado! El problema está resuelto');
      } else {
        toast.error('El problema aún no está resuelto');
      }
    } catch (error) {
      toast.error('Error al verificar');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // PANTALLA DE SETUP INICIAL
  if (!seoConfig?.websiteUrl) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Analiza el SEO de tu web</h1>
          <p className="text-gray-500 text-lg">
            Te diremos exactamente qué mejorar y cómo hacerlo paso a paso
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <Label htmlFor="url" className="text-base font-medium">
                URL de tu sitio web
              </Label>
              <Input
                id="url"
                placeholder="https://tusitio.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="mt-2 h-12 text-lg"
              />
            </div>

            <div>
              <Label className="text-base font-medium">
                ¿En qué plataforma está tu web?
              </Label>
              <p className="text-sm text-gray-500 mb-3">
                Así te daremos instrucciones específicas para tu caso
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPlatform(p.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      platform === p.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{p.icon}</div>
                    <div className="text-sm font-medium">{p.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleAnalyze} 
              disabled={!websiteUrl || isAnalyzing}
              className="w-full h-12 text-lg"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Analizar mi sitio
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center text-sm text-gray-500">
          <div>
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <p>Análisis completo</p>
          </div>
          <div>
            <Target className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p>Guías paso a paso</p>
          </div>
          <div>
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <p>Mejora tu ranking</p>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD SEO COMPLETO
  const criticalIssues = issues.filter(i => i.severity === 'critical' && i.status !== 'fixed');
  const warningIssues = issues.filter(i => i.severity === 'warning' && i.status !== 'fixed');
  const fixedIssues = issues.filter(i => i.status === 'fixed');
  const totalIssues = issues.length;
  const fixedCount = fixedIssues.length;
  const progressPercent = totalIssues > 0 ? Math.round((fixedCount / totalIssues) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">SEO Dashboard</h1>
          <p className="text-gray-500 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            {seoConfig.websiteUrl}
            <a href={seoConfig.websiteUrl} target="_blank" rel="noopener" className="text-blue-500 hover:underline">
              <ExternalLink className="w-4 h-4" />
            </a>
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleAnalyze} disabled={isAnalyzing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            Re-analizar
          </Button>
        </div>
      </div>

      {/* Score y Progreso */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score General */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6 text-center">
            <div className={`text-6xl font-bold ${getScoreColor(seoConfig.seoScore || 0)}`}>
              {seoConfig.seoScore || 0}
            </div>
            <p className="text-gray-500 mt-2">Score SEO</p>
            <p className="text-xs text-gray-400 mt-1">
              Último análisis: {seoConfig.lastScanAt ? new Date(seoConfig.lastScanAt).toLocaleDateString() : 'Nunca'}
            </p>
          </CardContent>
        </Card>

        {/* Progreso de mejoras */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Tu progreso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <Progress value={progressPercent} className="h-3" />
              </div>
              <span className="font-bold text-lg">{progressPercent}%</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{criticalIssues.length}</div>
                <div className="text-xs text-red-600">Críticos</div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{warningIssues.length}</div>
                <div className="text-xs text-yellow-600">Advertencias</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{fixedCount}</div>
                <div className="text-xs text-green-600">Resueltos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Performance', score: seoConfig.scanResults?.performance || 0 },
          { label: 'Accesibilidad', score: seoConfig.scanResults?.accessibility || 0 },
          { label: 'Mejores Prácticas', score: seoConfig.scanResults?.bestPractices || 0 },
          { label: 'SEO', score: seoConfig.scanResults?.seo || 0 },
        ].map((metric) => (
          <Card key={metric.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{metric.label}</span>
                <span className={`text-xl font-bold ${getScoreColor(metric.score)}`}>
                  {metric.score}
                </span>
              </div>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getScoreBg(metric.score)} transition-all`}
                  style={{ width: `${metric.score}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista de Problemas */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Pendientes ({criticalIssues.length + warningIssues.length})
          </TabsTrigger>
          <TabsTrigger value="fixed" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Resueltos ({fixedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-4">
          {criticalIssues.length === 0 && warningIssues.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-700">¡Excelente!</h3>
                <p className="text-gray-500">No hay problemas pendientes</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Críticos primero */}
              {criticalIssues.map((issue) => (
                <IssueCard 
                  key={issue.id} 
                  issue={issue} 
                  platform={platform}
                  onMarkFixed={handleMarkFixed}
                  onVerify={handleVerify}
                  onCopy={copyToClipboard}
                />
              ))}
              {/* Luego warnings */}
              {warningIssues.map((issue) => (
                <IssueCard 
                  key={issue.id} 
                  issue={issue}
                  platform={platform}
                  onMarkFixed={handleMarkFixed}
                  onVerify={handleVerify}
                  onCopy={copyToClipboard}
                />
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="fixed" className="mt-4 space-y-4">
          {fixedIssues.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aún no has resuelto ningún problema</p>
              </CardContent>
            </Card>
          ) : (
            fixedIssues.map((issue) => (
              <IssueCard 
                key={issue.id} 
                issue={issue}
                platform={platform}
                onMarkFixed={handleMarkFixed}
                onVerify={handleVerify}
                onCopy={copyToClipboard}
                isFixed
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente de cada problema
function IssueCard({ 
  issue, 
  platform,
  onMarkFixed, 
  onVerify, 
  onCopy,
  isFixed = false 
}: { 
  issue: any;
  platform: string;
  onMarkFixed: (id: string) => void;
  onVerify: (id: string) => void;
  onCopy: (text: string) => void;
  isFixed?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(!isFixed);
  const IssueIcon = ISSUE_TYPES[issue.type as keyof typeof ISSUE_TYPES]?.icon || AlertCircle;
  
  // Obtener guía específica para la plataforma
  const platformGuide = issue.platformGuide?.[platform] || issue.platformGuide?.html || [];

  return (
    <Card className={`overflow-hidden transition-all ${isFixed ? 'opacity-75' : ''}`}>
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${
            issue.severity === 'critical' ? 'bg-red-100' : 'bg-yellow-100'
          }`}>
            <IssueIcon className={`w-5 h-5 ${
              issue.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
            }`} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{issue.title}</CardTitle>
              <Badge variant={issue.severity === 'critical' ? 'destructive' : 'secondary'}>
                {issue.severity === 'critical' ? 'CRÍTICO' : 'ADVERTENCIA'}
              </Badge>
              {isFixed && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Check className="w-3 h-3 mr-1" />
                  Resuelto
                </Badge>
              )}
            </div>
            <p className="text-gray-500 text-sm">{issue.description}</p>
            {issue.affectedCount > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Afecta a {issue.affectedCount} página{issue.affectedCount > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {issue.impactScore && (
              <div className="text-right">
                <div className="text-xs text-gray-400">Impacto</div>
                <div className={`font-bold ${
                  issue.impactScore >= 70 ? 'text-red-500' : 
                  issue.impactScore >= 40 ? 'text-yellow-500' : 'text-blue-500'
                }`}>
                  {issue.impactScore}%
                </div>
              </div>
            )}
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 border-t">
          {/* Páginas afectadas */}
          {issue.affectedUrls?.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Páginas afectadas:</h4>
              <div className="flex flex-wrap gap-2">
                {issue.affectedUrls.slice(0, 5).map((url: string, i: number) => (
                  <a 
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener"
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-blue-600 flex items-center gap-1"
                  >
                    {new URL(url).pathname || '/'}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
                {issue.affectedUrls.length > 5 && (
                  <span className="text-xs text-gray-400 px-2 py-1">
                    +{issue.affectedUrls.length - 5} más
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Código solución */}
          {issue.solutionCode && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Código a usar:
                </h4>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onCopy(issue.solutionCode)}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copiar
                </Button>
              </div>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                {issue.solutionCode}
              </pre>
            </div>
          )}

          {/* Guía paso a paso */}
          {platformGuide.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-sm text-gray-700 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Guía paso a paso para {PLATFORMS.find(p => p.value === platform)?.label || 'tu plataforma'}:
              </h4>
              <div className="space-y-3">
                {platformGuide.map((step: any, index: number) => (
                  <div 
                    key={index}
                    className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{step.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                      
                      {step.url && (
                        <a 
                          href={step.url}
                          target="_blank"
                          className="text-sm text-blue-500 hover:underline flex items-center gap-1 mt-2"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {step.urlLabel || 'Ir a esta página'}
                        </a>
                      )}
                      
                      {step.code && (
                        <div className="mt-2">
                          <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
                            {step.code}
                          </pre>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="mt-1"
                            onClick={() => onCopy(step.code)}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copiar
                          </Button>
                        </div>
                      )}

                      {step.tip && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                          <span className="text-yellow-800">{step.tip}</span>
                        </div>
                      )}

                      {step.videoUrl && (
                        <a 
                          href={step.videoUrl}
                          target="_blank"
                          className="mt-2 inline-flex items-center gap-2 text-sm text-red-600 hover:underline"
                        >
                          <Youtube className="w-4 h-4" />
                          Ver video tutorial
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            {!isFixed ? (
              <>
                <Button onClick={() => onMarkFixed(issue.id)}>
                  <Check className="w-4 h-4 mr-2" />
                  Ya lo arreglé
                </Button>
                <Button variant="outline" onClick={() => onVerify(issue.id)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Verificar automáticamente
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => onVerify(issue.id)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-verificar
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
