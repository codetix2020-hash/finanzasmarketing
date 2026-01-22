import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import {
	BarChart3,
	Bot,
	Calendar,
	Check,
	MessageSquare,
	Rocket,
	Share2,
	Sparkles,
	TrendingUp,
	Zap,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
	return (
		<div className="flex min-h-screen flex-col">
			{/* Hero Section */}
			<section className="relative overflow-hidden border-b bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-950/20 dark:via-background dark:to-indigo-950/20">
				<div className="container mx-auto px-4 py-24 sm:py-32">
					<div className="mx-auto max-w-4xl text-center">
						<div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-2 text-sm backdrop-blur-sm">
							<Sparkles className="h-4 w-4 text-primary" />
							<span className="text-muted-foreground">
								Powered by IA • Automatización Inteligente
							</span>
						</div>
						<h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
							Automatiza tu marketing con{" "}
							<span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
								IA
							</span>
						</h1>
						<p className="mb-8 text-xl text-muted-foreground sm:text-2xl">
							Gestiona todas tus redes sociales, crea contenido y analiza métricas
							desde un solo lugar
						</p>
						<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
							<Button asChild size="lg" variant="primary" className="w-full sm:w-auto">
								<Link href="/auth/signup">Empezar gratis</Link>
							</Button>
							<Button
								asChild
								size="lg"
								variant="outline"
								className="w-full sm:w-auto"
							>
								<Link href="#features">Ver demo</Link>
							</Button>
						</div>
						{/* Dashboard Mockup Placeholder */}
						<div className="mt-16 rounded-2xl border bg-card p-8 shadow-2xl">
							<div className="aspect-video w-full rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center">
								<div className="text-center">
									<BarChart3 className="mx-auto h-16 w-16 text-muted-foreground/50" />
									<p className="mt-4 text-sm text-muted-foreground">
										Dashboard Preview
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="features" className="container mx-auto px-4 py-24">
				<div className="mx-auto max-w-6xl">
					<div className="mb-16 text-center">
						<h2 className="mb-4 text-4xl font-bold tracking-tight">
							Todo lo que necesitas para dominar el marketing digital
						</h2>
						<p className="text-xl text-muted-foreground">
							Herramientas potentes que ahorran tiempo y aumentan resultados
						</p>
					</div>
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						<Card>
							<CardHeader>
								<Share2 className="mb-2 h-8 w-8 text-primary" />
								<CardTitle>Gestión de Redes Sociales</CardTitle>
								<CardDescription>
									Conecta Instagram, Facebook, TikTok y más desde un dashboard
									unificado
								</CardDescription>
							</CardHeader>
						</Card>
						<Card>
							<CardHeader>
								<Bot className="mb-2 h-8 w-8 text-primary" />
								<CardTitle>Generación de Contenido IA</CardTitle>
								<CardDescription>
									Crea posts, captions y hashtags automáticamente con IA
									avanzada
								</CardDescription>
							</CardHeader>
						</Card>
						<Card>
							<CardHeader>
								<Calendar className="mb-2 h-8 w-8 text-primary" />
								<CardTitle>Programación Inteligente</CardTitle>
								<CardDescription>
									Publica en el mejor momento para tu audiencia
									automáticamente
								</CardDescription>
							</CardHeader>
						</Card>
						<Card>
							<CardHeader>
								<BarChart3 className="mb-2 h-8 w-8 text-primary" />
								<CardTitle>Analytics Unificados</CardTitle>
								<CardDescription>
									Métricas de todas tus redes en un solo lugar con insights
									accionables
								</CardDescription>
							</CardHeader>
						</Card>
						<Card>
							<CardHeader>
								<Rocket className="mb-2 h-8 w-8 text-primary" />
								<CardTitle>Campañas Automatizadas</CardTitle>
								<CardDescription>
									Configura y olvídate, la IA optimiza y ejecuta tus campañas
								</CardDescription>
							</CardHeader>
						</Card>
						<Card>
							<CardHeader>
								<MessageSquare className="mb-2 h-8 w-8 text-primary" />
								<CardTitle>Respuestas Automáticas</CardTitle>
								<CardDescription>
									Gestiona comentarios y DMs con IA que entiende el contexto
								</CardDescription>
							</CardHeader>
						</Card>
					</div>
				</div>
			</section>

			{/* Pricing Section */}
			<section className="border-t bg-muted/30">
				<div className="container mx-auto px-4 py-24">
					<div className="mx-auto max-w-6xl">
						<div className="mb-16 text-center">
							<h2 className="mb-4 text-4xl font-bold tracking-tight">
								Planes que crecen contigo
							</h2>
							<p className="text-xl text-muted-foreground">
								Elige el plan perfecto para tu negocio
							</p>
						</div>
						<div className="grid gap-8 md:grid-cols-3">
							{/* Free Plan */}
							<Card>
								<CardHeader>
									<CardTitle>Free</CardTitle>
									<CardDescription>Perfecto para empezar</CardDescription>
									<div className="mt-4">
										<span className="text-4xl font-bold">€0</span>
										<span className="text-muted-foreground">/mes</span>
									</div>
								</CardHeader>
								<CardContent>
									<ul className="mb-6 space-y-3">
										<li className="flex items-center gap-2">
											<Check className="h-5 w-5 text-primary" />
											<span>1 red social</span>
										</li>
										<li className="flex items-center gap-2">
											<Check className="h-5 w-5 text-primary" />
											<span>10 posts/mes</span>
										</li>
										<li className="flex items-center gap-2">
											<Check className="h-5 w-5 text-primary" />
											<span>Analytics básicos</span>
										</li>
										<li className="flex items-center gap-2">
											<Check className="h-5 w-5 text-primary" />
											<span>Soporte por email</span>
										</li>
									</ul>
									<Button asChild variant="outline" className="w-full">
										<Link href="/auth/signup">Empezar</Link>
									</Button>
								</CardContent>
							</Card>

							{/* Pro Plan */}
							<Card className="border-primary shadow-lg">
								<CardHeader>
									<div className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
										Más Popular
									</div>
									<CardTitle>Pro</CardTitle>
									<CardDescription>Para profesionales y negocios</CardDescription>
									<div className="mt-4">
										<span className="text-4xl font-bold">€29</span>
										<span className="text-muted-foreground">/mes</span>
									</div>
								</CardHeader>
								<CardContent>
									<ul className="mb-6 space-y-3">
										<li className="flex items-center gap-2">
											<Check className="h-5 w-5 text-primary" />
											<span>5 redes sociales</span>
										</li>
										<li className="flex items-center gap-2">
											<Check className="h-5 w-5 text-primary" />
											<span>Posts ilimitados</span>
										</li>
										<li className="flex items-center gap-2">
											<Check className="h-5 w-5 text-primary" />
											<span>IA avanzada</span>
										</li>
										<li className="flex items-center gap-2">
											<Check className="h-5 w-5 text-primary" />
											<span>Analytics completos</span>
										</li>
										<li className="flex items-center gap-2">
											<Check className="h-5 w-5 text-primary" />
											<span>Soporte prioritario</span>
										</li>
									</ul>
									<Button asChild variant="primary" className="w-full">
										<Link href="/auth/signup">Empezar</Link>
									</Button>
								</CardContent>
							</Card>

							{/* Business Plan */}
							<Card>
								<CardHeader>
									<CardTitle>Business</CardTitle>
									<CardDescription>Para equipos y empresas</CardDescription>
									<div className="mt-4">
										<span className="text-4xl font-bold">€99</span>
										<span className="text-muted-foreground">/mes</span>
									</div>
								</CardHeader>
								<CardContent>
									<ul className="mb-6 space-y-3">
										<li className="flex items-center gap-2">
											<Check className="h-5 w-5 text-primary" />
											<span>Redes ilimitadas</span>
										</li>
										<li className="flex items-center gap-2">
											<Check className="h-5 w-5 text-primary" />
											<span>Gestión de equipo</span>
										</li>
										<li className="flex items-center gap-2">
											<Check className="h-5 w-5 text-primary" />
											<span>API access</span>
										</li>
										<li className="flex items-center gap-2">
											<Check className="h-5 w-5 text-primary" />
											<span>White-label</span>
										</li>
										<li className="flex items-center gap-2">
											<Check className="h-5 w-5 text-primary" />
											<span>Soporte 24/7</span>
										</li>
									</ul>
									<Button asChild variant="outline" className="w-full">
										<Link href="/auth/signup">Empezar</Link>
									</Button>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			<section className="container mx-auto px-4 py-24">
				<div className="mx-auto max-w-4xl">
					<div className="mb-16 text-center">
						<h2 className="mb-4 text-4xl font-bold tracking-tight">
							Lo que dicen nuestros clientes
						</h2>
					</div>
					<div className="grid gap-8 md:grid-cols-2">
						<Card>
							<CardContent className="pt-6">
								<div className="mb-4 flex gap-1 text-yellow-500">
									{"★".repeat(5)}
								</div>
								<p className="mb-4 text-lg italic text-muted-foreground">
									"Pasé de 2 horas diarias en redes a 15 minutos. La IA genera
									todo el contenido y lo programa automáticamente. Increíble."
								</p>
								<div>
									<p className="font-semibold">María López</p>
									<p className="text-sm text-muted-foreground">
										La Quilmeña - Restaurante
									</p>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div className="mb-4 flex gap-1 text-yellow-500">
									{"★".repeat(5)}
								</div>
								<p className="mb-4 text-lg italic text-muted-foreground">
									"Incrementamos engagement 340% en 2 meses. Las campañas
									automatizadas y el análisis de datos nos ayudaron a entender
									mejor a nuestra audiencia."
								</p>
								<div>
									<p className="font-semibold">Carlos García</p>
									<p className="text-sm text-muted-foreground">
										Tech Startup - CEO
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="border-t bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
				<div className="container mx-auto px-4 py-24">
					<div className="mx-auto max-w-2xl text-center">
						<Zap className="mx-auto mb-6 h-12 w-12 text-primary" />
						<h2 className="mb-4 text-4xl font-bold tracking-tight">
							¿Listo para automatizar tu marketing?
						</h2>
						<p className="mb-8 text-xl text-muted-foreground">
							Únete a cientos de empresas que ya están ahorrando tiempo y
							aumentando resultados
						</p>
						<Button asChild size="lg" variant="primary">
							<Link href="/auth/signup">Empezar gratis ahora</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t bg-muted/30">
				<div className="container mx-auto px-4 py-12">
					<div className="grid gap-8 md:grid-cols-4">
						<div>
							<h3 className="mb-4 font-bold text-lg">MarketingOS</h3>
							<p className="text-sm text-muted-foreground">
								Automatización de marketing con IA para empresas modernas
							</p>
						</div>
						<div>
							<h4 className="mb-4 font-semibold">Producto</h4>
							<ul className="space-y-2 text-sm text-muted-foreground">
								<li>
									<Link href="#features" className="hover:text-foreground">
										Features
									</Link>
								</li>
								<li>
									<Link href="#pricing" className="hover:text-foreground">
										Pricing
									</Link>
								</li>
								<li>
									<Link href="/en/blog" className="hover:text-foreground">
										Blog
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h4 className="mb-4 font-semibold">Recursos</h4>
							<ul className="space-y-2 text-sm text-muted-foreground">
								<li>
									<Link href="/en/docs" className="hover:text-foreground">
										Documentación
									</Link>
								</li>
								<li>
									<Link href="/en/contact" className="hover:text-foreground">
										Contacto
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h4 className="mb-4 font-semibold">Legal</h4>
							<ul className="space-y-2 text-sm text-muted-foreground">
								<li>
									<Link href="/en/legal/privacy" className="hover:text-foreground">
										Privacidad
									</Link>
								</li>
								<li>
									<Link href="/en/legal/terms" className="hover:text-foreground">
										Términos
									</Link>
								</li>
							</ul>
						</div>
					</div>
					<div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
						<p>© 2026 MarketingOS by CodeTix. Todos los derechos reservados.</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
