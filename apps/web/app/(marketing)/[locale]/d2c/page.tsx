import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import Link from "next/link";
import {
	Sparkles,
	Clock,
	Zap,
	CheckCircle,
	ArrowRight,
	Star,
	Play,
	Shield,
	Users,
	TrendingUp,
	Calendar,
	MessageSquare,
	Image as ImageIcon,
	Wand2,
	Target,
	Heart,
	ShoppingBag,
} from "lucide-react";

// Testimonios
const testimonials = [
	{
		name: "María García",
		role: "Fundadora de Velvet Studio",
		quote: "Pasé de publicar 2 veces por semana a diario. Mis ventas subieron un 40% en 2 meses.",
		brand: "Moda sostenible",
	},
	{
		name: "Carlos Ruiz",
		role: "CEO de Derma Luxe",
		quote: "La IA entiende perfectamente el tono de mi marca. Es como tener un community manager que me conoce.",
		brand: "Skincare premium",
	},
	{
		name: "Ana Martínez",
		role: "Dueña de Luna Joyas",
		quote: "Ahorro 10 horas a la semana. Ahora me enfoco en diseñar, no en pensar qué escribir.",
		brand: "Joyería artesanal",
	},
];

// Features
const features = [
	{
		icon: Wand2,
		title: "IA que aprende TU voz",
		description:
			"No genera textos genéricos. Estudia tu marca, productos y audiencia para crear contenido que suena a TI.",
	},
	{
		icon: ImageIcon,
		title: "De foto a post en 30 segundos",
		description:
			"Sube tu foto de producto y obtén el copy perfecto, hashtags optimizados y CTA que convierte.",
	},
	{
		icon: Calendar,
		title: "Calendario en piloto automático",
		description:
			"Programa tus posts y olvídate. Publica automáticamente en Instagram y Facebook.",
	},
	{
		icon: Target,
		title: "Contenido que vende",
		description:
			"Templates probados para productos, ofertas, testimonios, behind the scenes y más.",
	},
	{
		icon: TrendingUp,
		title: "Optimizado para engagement",
		description:
			"La IA sabe qué horas publicar, qué hashtags usar y cómo estructurar para máximo alcance.",
	},
	{
		icon: Shield,
		title: "Tu marca, tu control",
		description:
			"Define palabras a evitar, tono de voz, emojis favoritos. Siempre consistente.",
	},
];

// Tipos de contenido
const contentTypes = [
	{
		icon: ShoppingBag,
		label: "Producto estrella",
		color: "bg-blue-100 text-blue-600",
	},
	{
		icon: MessageSquare,
		label: "Engagement",
		color: "bg-purple-100 text-purple-600",
	},
	{
		icon: Star,
		label: "Testimonios",
		color: "bg-amber-100 text-amber-600",
	},
	{
		icon: Clock,
		label: "Urgencia",
		color: "bg-red-100 text-red-600",
	},
	{
		icon: Heart,
		label: "Behind the scenes",
		color: "bg-pink-100 text-pink-600",
	},
	{
		icon: Zap,
		label: "Ofertas flash",
		color: "bg-orange-100 text-orange-600",
	},
];

// Comparación
const comparison = [
	{
		feature: "Conoce tu marca en profundidad",
		us: true,
		cm: false,
		ai: false,
	},
	{
		feature: "Contenido 24/7 sin descanso",
		us: true,
		cm: false,
		ai: true,
	},
	{
		feature: "Especializado en D2C",
		us: true,
		cm: "Variable",
		ai: false,
	},
	{
		feature: "Publica automáticamente",
		us: true,
		cm: true,
		ai: false,
	},
	{
		feature: "Templates probados para ventas",
		us: true,
		cm: "Variable",
		ai: false,
	},
	{
		feature: "Precio",
		us: "29€/mes",
		cm: "500-1500€",
		ai: "20€/mes",
	},
];

export default function D2CLandingPage() {
	return (
		<div className="bg-white">
			{/* Hero */}
			<section className="pt-12 pb-20 px-4 overflow-hidden">
				<div className="container max-w-6xl mx-auto">
					<div className="text-center max-w-4xl mx-auto">
						{/* Badge */}
						<Badge className="mb-6 px-4 py-2 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
							<Sparkles className="h-4 w-4 mr-2" />
							Marketing con IA para marcas D2C
						</Badge>

						{/* Headline */}
						<h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
							Tú subes la foto.
							<br />
							<span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
								La IA escribe el copy.
							</span>
						</h1>

						{/* Subheadline */}
						<p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
							El community manager que conoce tu marca
							como tú. Contenido que vende, publicado en
							piloto automático.
						</p>

						{/* CTA */}
						<div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
							<Link href="/auth/signup">
								<Button
									size="lg"
									className="h-14 px-8 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full shadow-lg shadow-purple-500/25"
								>
									Prueba gratis 14 días
									<ArrowRight className="ml-2 h-5 w-5" />
								</Button>
							</Link>
							<Button
								size="lg"
								variant="outline"
								className="h-14 px-8 text-lg rounded-full"
							>
								<Play className="mr-2 h-5 w-5" />
								Ver demo
							</Button>
						</div>

						{/* Social proof */}
						<div className="flex items-center justify-center gap-8 text-sm text-gray-500">
							<div className="flex items-center gap-2">
								<div className="flex -space-x-2">
									{[1, 2, 3, 4].map((i) => (
										<div
											key={i}
											className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white"
										/>
									))}
								</div>
								<span>+500 marcas</span>
							</div>
							<div className="flex items-center gap-1">
								{[1, 2, 3, 4, 5].map((i) => (
									<Star
										key={i}
										className="h-4 w-4 fill-amber-400 text-amber-400"
									/>
								))}
								<span className="ml-1">4.9/5</span>
							</div>
						</div>
					</div>

					{/* Hero Image/Demo */}
					<div className="mt-16 relative">
						<div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
						<div className="relative rounded-2xl overflow-hidden border shadow-2xl shadow-purple-500/10">
							<div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
								<div className="text-center">
									<div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
										<Sparkles className="h-10 w-10 text-white" />
									</div>
									<p className="text-gray-500">
										Screenshot del generador
										de contenido
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Logos/Brands */}
			<section className="py-12 border-y bg-gray-50">
				<div className="container max-w-6xl mx-auto px-4">
					<p className="text-center text-sm text-gray-500 mb-8">
						Usado por marcas de moda, cosméticos y
						joyería
					</p>
					<div className="flex items-center justify-center gap-12 opacity-50">
						{[
							"Moda",
							"Beauty",
							"Joyas",
							"Accesorios",
							"Skincare",
						].map((brand) => (
							<div
								key={brand}
								className="text-xl font-bold text-gray-400"
							>
								{brand}
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Problem/Solution */}
			<section className="py-20 px-4">
				<div className="container max-w-6xl mx-auto">
					<div className="grid md:grid-cols-2 gap-12 items-center">
						{/* Problem */}
						<div>
							<Badge className="mb-4 bg-red-100 text-red-700">
								El problema
							</Badge>
							<h2 className="text-3xl font-bold mb-6">
								Tienes las fotos perfectas pero...
							</h2>
							<ul className="space-y-4">
								{[
									"No sabes qué escribir en el caption",
									"Empiezas fuerte y luego abandonas",
									"Contratar un CM es carísimo y no entiende tu marca",
									"ChatGPT genera textos genéricos que no suenan a ti",
								].map((problem) => (
									<li
										key={problem}
										className="flex items-start gap-3"
									>
										<div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
											<span className="text-red-600 text-sm">
												✕
											</span>
										</div>
										<span className="text-gray-600">
											{problem}
										</span>
									</li>
								))}
							</ul>
						</div>

						{/* Solution */}
						<div>
							<Badge className="mb-4 bg-green-100 text-green-700">
								La solución
							</Badge>
							<h2 className="text-3xl font-bold mb-6">
								MarketingOS aprende tu marca
							</h2>
							<ul className="space-y-4">
								{[
									"Estudia tu historia, productos y audiencia",
									"Genera contenido que suena exactamente a ti",
									"Publica automáticamente cuando tú quieras",
									"Por una fracción del costo de un CM",
								].map((solution) => (
									<li
										key={solution}
										className="flex items-start gap-3"
									>
										<div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
											<CheckCircle className="h-4 w-4 text-green-600" />
										</div>
										<span className="text-gray-600">
											{solution}
										</span>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			</section>

			{/* How it works */}
			<section className="py-20 px-4 bg-gray-50">
				<div className="container max-w-6xl mx-auto">
					<div className="text-center mb-16">
						<Badge className="mb-4">
							Cómo funciona
						</Badge>
						<h2 className="text-4xl font-bold">
							De foto a post publicado en 3 pasos
						</h2>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						{[
							{
								step: "1",
								title: "Configura tu marca",
								description:
									"Cuéntanos sobre tu negocio, productos, audiencia y tono de voz. Solo una vez.",
								color: "from-blue-500 to-cyan-500",
							},
							{
								step: "2",
								title: "Sube tu foto",
								description:
									"Arrastra tu foto de producto y elige el tipo de contenido que quieres.",
								color: "from-purple-500 to-pink-500",
							},
							{
								step: "3",
								title: "Publica o programa",
								description:
									"Revisa el copy, ajusta si quieres, y programa. La IA lo publica por ti.",
								color: "from-orange-500 to-red-500",
							},
						].map((item) => (
							<div
								key={item.step}
								className="relative"
							>
								<div
									className={`absolute -top-4 -left-4 w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}
								>
									{item.step}
								</div>
								<div className="bg-white rounded-2xl p-8 pt-12 shadow-sm border h-full">
									<h3 className="text-xl font-semibold mb-3">
										{item.title}
									</h3>
									<p className="text-gray-600">
										{item.description}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Content Types */}
			<section className="py-20 px-4">
				<div className="container max-w-6xl mx-auto">
					<div className="text-center mb-16">
						<Badge className="mb-4">
							Tipos de contenido
						</Badge>
						<h2 className="text-4xl font-bold mb-4">
							Todo lo que necesitas para vender
						</h2>
						<p className="text-gray-600 max-w-2xl mx-auto">
							Templates optimizados para cada tipo de
							post. Desde productos hasta stories de
							urgencia.
						</p>
					</div>

					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
						{contentTypes.map((type) => {
							const Icon = type.icon;
							return (
								<div
									key={type.label}
									className="p-6 rounded-2xl border bg-white hover:shadow-lg transition-shadow text-center"
								>
									<div
										className={`w-12 h-12 rounded-xl ${type.color} flex items-center justify-center mx-auto mb-3`}
									>
										<Icon className="h-6 w-6" />
									</div>
									<p className="font-medium text-sm">
										{type.label}
									</p>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* Features Grid */}
			<section id="features" className="py-20 px-4 bg-gray-50">
				<div className="container max-w-6xl mx-auto">
					<div className="text-center mb-16">
						<Badge className="mb-4">
							Funcionalidades
						</Badge>
						<h2 className="text-4xl font-bold mb-4">
							Todo lo que necesitas, nada que no
						</h2>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						{features.map((feature) => {
							const Icon = feature.icon;
							return (
								<div
									key={feature.title}
									className="bg-white rounded-2xl p-6 border hover:shadow-lg transition-shadow"
								>
									<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
										<Icon className="h-6 w-6 text-purple-600" />
									</div>
									<h3 className="text-xl font-semibold mb-2">
										{feature.title}
									</h3>
									<p className="text-gray-600">
										{feature.description}
									</p>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* Comparison Table */}
			<section className="py-20 px-4">
				<div className="container max-w-4xl mx-auto">
					<div className="text-center mb-16">
						<Badge className="mb-4">Comparativa</Badge>
						<h2 className="text-4xl font-bold mb-4">
							¿Por qué MarketingOS?
						</h2>
					</div>

					<div className="overflow-hidden rounded-2xl border">
						<table className="w-full">
							<thead className="bg-gray-50">
								<tr>
									<th className="text-left p-4 font-medium">
										Característica
									</th>
									<th className="p-4 font-medium">
										<div className="flex flex-col items-center">
											<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mb-1">
												<Sparkles className="h-5 w-5 text-white" />
											</div>
											<span className="text-sm">
												MarketingOS
											</span>
										</div>
									</th>
									<th className="p-4 font-medium text-gray-500">
										<div className="flex flex-col items-center">
											<div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center mb-1">
												<Users className="h-5 w-5 text-gray-500" />
											</div>
											<span className="text-sm">
												Community
												Manager
											</span>
										</div>
									</th>
									<th className="p-4 font-medium text-gray-500">
										<div className="flex flex-col items-center">
											<div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center mb-1">
												<MessageSquare className="h-5 w-5 text-gray-500" />
											</div>
											<span className="text-sm">
												ChatGPT
											</span>
										</div>
									</th>
								</tr>
							</thead>
							<tbody>
								{comparison.map((row) => (
									<tr
										key={row.feature}
										className="border-t"
									>
										<td className="p-4 text-gray-600">
											{row.feature}
										</td>
										<td className="p-4 text-center">
											{row.us === true ? (
												<CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
											) : (
												<span className="font-semibold text-purple-600">
													{
														row.us
													}
												</span>
											)}
										</td>
										<td className="p-4 text-center text-gray-400">
											{row.cm ===
											true ? (
												<CheckCircle className="h-5 w-5 text-gray-400 mx-auto" />
											) : row.cm ===
											  false ? (
												<span>
													✕
												</span>
											) : (
												<span>
													{
														row.cm
													}
												</span>
											)}
										</td>
										<td className="p-4 text-center text-gray-400">
											{row.ai ===
											true ? (
												<CheckCircle className="h-5 w-5 text-gray-400 mx-auto" />
											) : row.ai ===
											  false ? (
												<span>
													✕
												</span>
											) : (
												<span>
													{
														row.ai
													}
												</span>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</section>

			{/* Testimonials */}
			<section
				id="testimonials"
				className="py-20 px-4 bg-gray-50"
			>
				<div className="container max-w-6xl mx-auto">
					<div className="text-center mb-16">
						<Badge className="mb-4">Testimonios</Badge>
						<h2 className="text-4xl font-bold">
							Lo que dicen nuestras marcas
						</h2>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						{testimonials.map((t) => (
							<div
								key={t.name}
								className="bg-white rounded-2xl p-6 border shadow-sm"
							>
								<div className="flex items-center gap-1 mb-4">
									{[1, 2, 3, 4, 5].map(
										(i) => (
											<Star
												key={i}
												className="h-4 w-4 fill-amber-400 text-amber-400"
											/>
										),
									)}
								</div>
								<p className="text-gray-700 mb-6">
									&ldquo;{t.quote}&rdquo;
								</p>
								<div className="flex items-center gap-3">
									<div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
									<div>
										<p className="font-medium">
											{t.name}
										</p>
										<p className="text-sm text-gray-500">
											{t.role}
										</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Pricing */}
			<section id="pricing" className="py-20 px-4">
				<div className="container max-w-5xl mx-auto">
					<div className="text-center mb-16">
						<Badge className="mb-4">Precios</Badge>
						<h2 className="text-4xl font-bold mb-4">
							Simple y transparente
						</h2>
						<p className="text-gray-600">
							Sin sorpresas. Cancela cuando quieras.
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						{/* Starter */}
						<div className="rounded-2xl border p-8 bg-white">
							<h3 className="text-xl font-semibold mb-2">
								Starter
							</h3>
							<p className="text-gray-500 mb-4">
								Para empezar a crecer
							</p>
							<div className="mb-6">
								<span className="text-4xl font-bold">
									29€
								</span>
								<span className="text-gray-500">
									/mes
								</span>
							</div>
							<ul className="space-y-3 mb-8">
								{[
									"1 marca",
									"30 posts/mes",
									"Publicación manual",
									"Templates básicos",
									"Soporte por email",
								].map((f) => (
									<li
										key={f}
										className="flex items-center gap-2 text-gray-600"
									>
										<CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
										{f}
									</li>
								))}
							</ul>
							<Link href="/auth/signup">
								<Button
									variant="outline"
									className="w-full rounded-full"
								>
									Empezar gratis
								</Button>
							</Link>
						</div>

						{/* Pro - Destacado */}
						<div className="rounded-2xl border-2 border-purple-500 p-8 bg-white relative shadow-xl">
							<div className="absolute -top-3 left-1/2 -translate-x-1/2">
								<Badge className="bg-purple-600 text-white">
									Más popular
								</Badge>
							</div>
							<h3 className="text-xl font-semibold mb-2">
								Pro
							</h3>
							<p className="text-gray-500 mb-4">
								Para marcas en crecimiento
							</p>
							<div className="mb-6">
								<span className="text-4xl font-bold">
									79€
								</span>
								<span className="text-gray-500">
									/mes
								</span>
							</div>
							<ul className="space-y-3 mb-8">
								{[
									"3 marcas",
									"100 posts/mes",
									"Publicación automática",
									"Todos los templates",
									"Calendario visual",
									"Analíticas básicas",
									"Soporte prioritario",
								].map((f) => (
									<li
										key={f}
										className="flex items-center gap-2 text-gray-600"
									>
										<CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
										{f}
									</li>
								))}
							</ul>
							<Link href="/auth/signup">
								<Button className="w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
									Empezar gratis
								</Button>
							</Link>
						</div>

						{/* Business */}
						<div className="rounded-2xl border p-8 bg-white">
							<h3 className="text-xl font-semibold mb-2">
								Business
							</h3>
							<p className="text-gray-500 mb-4">
								Para agencias y equipos
							</p>
							<div className="mb-6">
								<span className="text-4xl font-bold">
									199€
								</span>
								<span className="text-gray-500">
									/mes
								</span>
							</div>
							<ul className="space-y-3 mb-8">
								{[
									"10 marcas",
									"Posts ilimitados",
									"Todo de Pro",
									"White-label",
									"API access",
									"Account manager",
								].map((f) => (
									<li
										key={f}
										className="flex items-center gap-2 text-gray-600"
									>
										<CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
										{f}
									</li>
								))}
							</ul>
							<Button
								variant="outline"
								className="w-full rounded-full"
							>
								Contactar ventas
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Final CTA */}
			<section className="py-20 px-4">
				<div className="container max-w-4xl mx-auto">
					<div className="rounded-3xl bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 p-12 text-center text-white">
						<h2 className="text-4xl font-bold mb-4">
							Empieza a publicar contenido que vende
						</h2>
						<p className="text-xl text-white/80 mb-8 max-w-xl mx-auto">
							14 días gratis. Sin tarjeta de crédito.
							Configura tu marca en 5 minutos.
						</p>
						<Link href="/auth/signup">
							<Button
								size="lg"
								className="h-14 px-8 text-lg bg-white text-purple-600 hover:bg-gray-100 rounded-full"
							>
								Activar mi piloto automático
								<ArrowRight className="ml-2 h-5 w-5" />
							</Button>
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}

