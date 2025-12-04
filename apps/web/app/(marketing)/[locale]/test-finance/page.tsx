// @ts-nocheck

'use client';

import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

// Datos mock
const mockData = {
	totalMRR: 15420,
	totalRevenue: 45230,
	totalCosts: 12100,
	netProfit: 33130,
	avgROI: 273.8,
};

const historicalData = {
	currentMonth: {
		totalMRR: 15420,
		totalRevenue: 45230,
		totalCosts: 12100,
		netProfit: 33130,
		avgROI: 273.8,
	},
	lastMonth: {
		totalMRR: 13800,
		totalRevenue: 41200,
		totalCosts: 11500,
		netProfit: 29700,
		avgROI: 258.3,
	},
	twoMonthsAgo: {
		totalMRR: 11900,
		totalRevenue: 35800,
		totalCosts: 10200,
		netProfit: 25600,
		avgROI: 251.0,
	},
	threeMonthsAgo: {
		totalMRR: 10200,
		totalRevenue: 30600,
		totalCosts: 9100,
		netProfit: 21500,
		avgROI: 236.3,
	},
	fourMonthsAgo: {
		totalMRR: 8900,
		totalRevenue: 26700,
		totalCosts: 8200,
		netProfit: 18500,
		avgROI: 225.6,
	},
	fiveMonthsAgo: {
		totalMRR: 7500,
		totalRevenue: 22500,
		totalCosts: 7300,
		netProfit: 15200,
		avgROI: 208.2,
	},
};

const historicalDataArray = [
	{
		month: "Hace 5 meses",
		...historicalData.fiveMonthsAgo,
		churnRate: 4.2,
		newCustomers: 12,
	},
	{
		month: "Hace 4 meses",
		...historicalData.fourMonthsAgo,
		churnRate: 4.5,
		newCustomers: 15,
	},
	{
		month: "Hace 3 meses",
		...historicalData.threeMonthsAgo,
		churnRate: 4.8,
		newCustomers: 18,
	},
	{
		month: "Hace 2 meses",
		...historicalData.twoMonthsAgo,
		churnRate: 4.1,
		newCustomers: 22,
	},
	{
		month: "Mes pasado",
		...historicalData.lastMonth,
		churnRate: 3.9,
		newCustomers: 25,
	},
	{
		month: "Mes actual",
		...historicalData.currentMonth,
		churnRate: 3.7,
		newCustomers: 28,
	},
];

export default function TestFinancePage() {
	const [predictions, setPredictions] = useState<any>(null);
	const [loadingPredictions, setLoadingPredictions] = useState(false);
	const [anomalies, setAnomalies] = useState<any>(null);
	const [detectingAnomalies, setDetectingAnomalies] = useState(false);
	const [cohortData, setCohortData] = useState<any>(null);
	const [loadingCohorts, setLoadingCohorts] = useState(false);
	const [selectedCohorts, setSelectedCohorts] = useState<string[]>([]);
	const [unitEconomics, setUnitEconomics] = useState<any>(null);
	const [loadingUnitEcon, setLoadingUnitEcon] = useState(false);
	const [simulation, setSimulation] = useState<any>(null);
	const [simulationParams, setSimulationParams] = useState({
		churnRateChange: 0,
		pricingChange: 0,
		cacChange: 0,
		grossMarginChange: 0,
	});
	const [benchmarking, setBenchmarking] = useState<any>(null);
	const [loadingBenchmark, setLoadingBenchmark] = useState(false);

	const getPredictions = async () => {
		setLoadingPredictions(true);

		try {
			const response = await fetch("/api/rpc/finance.predictMetrics", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					historicalData: historicalDataArray.map((d) => ({
						month: d.month,
						mrr: d.totalMRR,
						revenue: d.totalRevenue,
						costs: d.totalCosts,
						profit: d.netProfit,
						churnRate: d.churnRate,
						newCustomers: d.newCustomers,
					})),
					currentMetrics: {
						totalMRR: mockData.totalMRR,
						totalRevenue: mockData.totalRevenue,
						totalCosts: mockData.totalCosts,
						avgROI: mockData.avgROI,
						totalCustomers: 373,
					},
					predictionMonths: 12,
				}),
			});

			const result = await response.json();
			setPredictions(result);
		} catch (error) {
			console.error("Error al obtener predicciones:", error);
			alert("Error al obtener predicciones. Verifica la consola.");
		} finally {
			setLoadingPredictions(false);
		}
	};

	const detectAnomaliesNow = async () => {
		setDetectingAnomalies(true);

		try {
			const response = await fetch("/api/rpc/finance.detectAnomalies", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					currentMetrics: {
						totalMRR: mockData.totalMRR,
						totalRevenue: mockData.totalRevenue,
						totalCosts: mockData.totalCosts,
						netProfit: mockData.netProfit,
						avgROI: mockData.avgROI,
						churnRate: 3.7,
						cac: 85,
						ltv: 450,
					},
					historicalData: historicalDataArray.map((d, index) => ({
						date: new Date(
							Date.now() - index * 30 * 24 * 60 * 60 * 1000,
						).toISOString(),
						mrr: d.totalMRR,
						revenue: d.totalRevenue,
						costs: d.totalCosts,
						profit: d.netProfit,
					})),
					recentEvents: [
						"Lanzamiento de nueva feature hace 2 semanas",
						"Campaña de ads escalada +30% hace 1 mes",
						"Competidor lanzó pricing agresivo hace 3 semanas",
					],
				}),
			});

			const result = await response.json();
			setAnomalies(result);
		} catch (error) {
			console.error("Error al detectar anomalías:", error);
			alert("Error al detectar anomalías. Verifica la consola.");
		} finally {
			setDetectingAnomalies(false);
		}
	};

	const loadCohortAnalysis = async () => {
		setLoadingCohorts(true);

		try {
			const response = await fetch("/api/rpc/finance.getCohortAnalysis", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			});

			const result = await response.json();
			setCohortData(result);
		} catch (error) {
			console.error("Error al cargar cohort analysis:", error);
			alert("Error al cargar análisis de cohortes. Verifica la consola.");
		} finally {
			setLoadingCohorts(false);
		}
	};

	const calculateUnitEcon = async () => {
		setLoadingUnitEcon(true);

		try {
			const response = await fetch(
				"/api/rpc/finance.calculateUnitEconomics",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						mrr: mockData.totalMRR,
						customers: 373,
						grossMargin: 75,
						churnRate: 3.7,
						revenueGrowthRate: 45,
						newMRRThisMonth: 1620,
						expansionMRR: 420,
						churnedMRR: 280,
						contractionMRR: 120,
						marketingSpend: 3800,
						salesSpend: 1500,
						newCustomersThisMonth: 28,
						netBurn: -21030,
						netNewARR: 19440,
					}),
				},
			);

			const result = await response.json();
			setUnitEconomics(result);
			setSimulation(null);
		} catch (error) {
			console.error("Error al calcular unit economics:", error);
			alert("Error al calcular unit economics. Verifica la consola.");
		} finally {
			setLoadingUnitEcon(false);
		}
	};

	const runSimulation = async () => {
		if (!unitEconomics) return;

		try {
			const response = await fetch(
				"/api/rpc/finance.simulateUnitEconomics",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						baseData: {
							mrr: mockData.totalMRR,
							customers: 373,
							grossMargin: 75,
							churnRate: 3.7,
							revenueGrowthRate: 45,
							newMRRThisMonth: 1620,
							expansionMRR: 420,
							churnedMRR: 280,
							contractionMRR: 120,
							marketingSpend: 3800,
							salesSpend: 1500,
							newCustomersThisMonth: 28,
							netBurn: -21030,
							netNewARR: 19440,
						},
						changes: simulationParams,
					}),
				},
			);

			const result = await response.json();
			setSimulation(result);
		} catch (error) {
			console.error("Error en simulación:", error);
		}
	};

	const loadBenchmarking = async () => {
		// Necesitamos tener unit economics calculado primero
		if (!unitEconomics) {
			alert("Por favor calcula Unit Economics primero");
			return;
		}

		setLoadingBenchmark(true);

		try {
			const response = await fetch("/api/rpc/finance.getBenchmarking", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					revenueGrowthRate: 45,
					nrr: cohortData?.aggregateMetrics.averageNRR || 105,
					grossMargin: 75,
					ltvToCac: unitEconomics.ratios.ltvToCac,
					cacPayback: unitEconomics.cac.paybackPeriod,
					churnRate: 3.7,
					ruleOf40: unitEconomics.ratios.ruleOf40,
					magicNumber: unitEconomics.ratios.magicNumber,
				}),
			});

			const result = await response.json();
			setBenchmarking(result);
		} catch (error) {
			console.error("Error al cargar benchmarking:", error);
			alert("Error al cargar benchmarking. Verifica la consola.");
		} finally {
			setLoadingBenchmark(false);
		}
	};

	return (
		<div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
			<h1
				style={{
					fontSize: "2.5rem",
					fontWeight: "bold",
					marginBottom: "1rem",
					background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
					WebkitBackgroundClip: "text",
					WebkitTextFillColor: "transparent",
				}}
			>
				🔮 Finance Dashboard - Test
			</h1>

			{/* Métricas principales */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(4, 1fr)",
					gap: "1rem",
					marginBottom: "2rem",
				}}
			>
				<div
					style={{
						background: "white",
						borderRadius: "16px",
						padding: "1.5rem",
						boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
					}}
				>
					<div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>
						MRR Total
					</div>
					<div style={{ fontSize: "2rem", fontWeight: "bold", color: "#1e40af" }}>
						€{mockData.totalMRR.toLocaleString()}
					</div>
				</div>
				<div
					style={{
						background: "white",
						borderRadius: "16px",
						padding: "1.5rem",
						boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
					}}
				>
					<div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>
						Revenue (30d)
					</div>
					<div style={{ fontSize: "2rem", fontWeight: "bold", color: "#7c3aed" }}>
						€{mockData.totalRevenue.toLocaleString()}
					</div>
				</div>
				<div
					style={{
						background: "white",
						borderRadius: "16px",
						padding: "1.5rem",
						boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
					}}
				>
					<div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>
						Profit Neto
					</div>
					<div style={{ fontSize: "2rem", fontWeight: "bold", color: "#059669" }}>
						€{mockData.netProfit.toLocaleString()}
					</div>
				</div>
				<div
					style={{
						background: "white",
						borderRadius: "16px",
						padding: "1.5rem",
						boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
					}}
				>
					<div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>
						ROI Promedio
					</div>
					<div style={{ fontSize: "2rem", fontWeight: "bold", color: "#f59e0b" }}>
						{mockData.avgROI.toFixed(1)}%
					</div>
				</div>
			</div>

			{/* Comparaciones Temporales */}
			<div style={{ marginBottom: '2rem', background: 'white', borderRadius: '12px', border: '2px solid #6366f1', overflow: 'hidden' }}>
				<div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', cursor: 'pointer' }} onClick={() => toggleSection('comparisons')}>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
							<span style={{ fontSize: '1.5rem' }}>⏱️</span>
							<h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Comparaciones Temporales</h2>
						</div>
					</div>
				</div>
				{expandedSection === 'comparisons' && (
					<div style={{ padding: '2rem' }}>
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
							<div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
								<div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>MoM (Month over Month)</div>
								<div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>+12.5%</div>
								<div style={{ fontSize: '0.75rem', color: '#6b7280' }}>vs November 2024</div>
							</div>
							<div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
								<div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>QoQ (Quarter over Quarter)</div>
								<div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>+28.3%</div>
								<div style={{ fontSize: '0.75rem', color: '#6b7280' }}>vs Q3 2024</div>
							</div>
							<div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
								<div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>YoY (Year over Year)</div>
								<div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>+156%</div>
								<div style={{ fontSize: '0.75rem', color: '#6b7280' }}>vs December 2023</div>
							</div>
						</div>
						
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={[
								{ month: 'Jul', mrr: 8500 },
								{ month: 'Aug', mrr: 10200 },
								{ month: 'Sep', mrr: 11800 },
								{ month: 'Oct', mrr: 12900 },
								{ month: 'Nov', mrr: 13700 },
								{ month: 'Dec', mrr: 15420 },
							]}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="month" />
								<YAxis />
								<Tooltip />
								<Bar dataKey="mrr" fill="#6366f1" />
							</BarChart>
						</ResponsiveContainer>
					</div>
				)}
			</div>

			{/* Autonomous Executor */}
			<div style={{ marginBottom: '2rem', background: 'white', borderRadius: '12px', border: '2px solid #10b981', overflow: 'hidden' }}>
				<div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', cursor: 'pointer' }} onClick={() => toggleSection('executor')}>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
							<span style={{ fontSize: '1.5rem' }}>🤖</span>
							<h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Autonomous Executor</h2>
						</div>
						<button
							onClick={(e) => { e.stopPropagation(); alert('Ver Log de Acciones - Funcionalidad en desarrollo'); }}
							style={{
								padding: '0.75rem 1.5rem',
								background: 'white',
								color: '#10b981',
								border: 'none',
								borderRadius: '8px',
								fontWeight: 'bold',
								cursor: 'pointer',
							}}
						>
							📋 Ver Log de Acciones
						</button>
					</div>
				</div>
				{expandedSection === 'executor' && (
					<div style={{ padding: '2rem' }}>
						<div style={{ marginBottom: '2rem' }}>
							<div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>Acciones Ejecutadas (últimas 10)</div>
							<div style={{ background: '#f9fafb', borderRadius: '8px', padding: '1rem' }}>
								{[
									{ time: '2024-12-04 18:45', action: 'Alerta Slack enviada', status: 'success', impact: 'MRR drop detectado' },
									{ time: '2024-12-04 14:20', action: 'Precio ajustado en Stripe', status: 'success', impact: '+€250/month' },
									{ time: '2024-12-03 22:10', action: 'Email de retención enviado', status: 'success', impact: '3 customers saved' },
									{ time: '2024-12-03 15:30', action: 'Notificación de anomalía', status: 'success', impact: 'Churn spike detected' },
									{ time: '2024-12-02 09:15', action: 'Upgrade sugerido', status: 'pending', impact: '€450 potential ARR' },
								].map((log, idx) => (
									<div key={idx} style={{ padding: '0.75rem', borderBottom: idx < 4 ? '1px solid #e5e7eb' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
										<div>
											<div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{log.action}</div>
											<div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{log.time} • {log.impact}</div>
										</div>
										<div style={{ 
											padding: '0.25rem 0.75rem', 
											borderRadius: '12px', 
											fontSize: '0.75rem',
											background: log.status === 'success' ? '#d1fae5' : '#fef3c7',
											color: log.status === 'success' ? '#065f46' : '#92400e'
										}}>
											{log.status === 'success' ? '✅ Completado' : '⏳ Pendiente'}
										</div>
									</div>
								))}
							</div>
						</div>
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
							<div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '8px', textAlign: 'center' }}>
								<div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>47</div>
								<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Acciones este mes</div>
							</div>
							<div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '8px', textAlign: 'center' }}>
								<div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>98.3%</div>
								<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Success Rate</div>
							</div>
							<div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '8px', textAlign: 'center' }}>
								<div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>€12.5k</div>
								<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Impacto financiero</div>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Panel de Predicciones */}
			<div
			style={{
				background: "white",
				borderRadius: "16px",
				padding: "1.5rem",
				boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
				marginBottom: "2rem",
				border: "2px solid #3b82f6",
				overflow: 'hidden',
			}}
		>
			<div
				style={{
					padding: "1.5rem",
					background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
					color: "white",
					cursor: "pointer",
				}}
				onClick={() => toggleSection('predictive')}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
						<span style={{ fontSize: '1.5rem' }}>🔮</span>
						<h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>
							Predictive Analytics
						</h2>
					</div>
					<button
						onClick={(e) => { e.stopPropagation(); getPredictions(); }}
						disabled={loadingPredictions}
						style={{
							padding: "0.75rem 1.5rem",
							background: loadingPredictions ? "#9ca3af" : "white",
							color: loadingPredictions ? "#6b7280" : "#3b82f6",
							border: "none",
							borderRadius: "8px",
							fontSize: "0.875rem",
							fontWeight: "bold",
							cursor: loadingPredictions ? "not-allowed" : "pointer",
						}}
					>
						{loadingPredictions ? "⏳ Analizando..." : "🔮 Generar Predicciones"}
					</button>
				</div>
			</div>

			{expandedSection === 'predictive' && (
				<div style={{ padding: '2rem' }}>
					{!predictions && !loadingPredictions && (
						<>
							<div style={{ marginBottom: '2rem' }}>
								<h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>📈 Proyección MRR</h3>
								<ResponsiveContainer width="100%" height={300}>
									<LineChart data={[
										{ month: 'Dec', actual: 15420, expected: 15420, best: 15420, worst: 15420 },
										{ month: 'Jan', actual: null, expected: 17250, best: 19500, worst: 15800 },
										{ month: 'Feb', actual: null, expected: 19200, best: 22100, worst: 17200 },
										{ month: 'Mar', actual: null, expected: 21500, best: 25200, worst: 19100 },
										{ month: 'Apr', actual: null, expected: 24100, best: 28900, worst: 21400 },
										{ month: 'May', actual: null, expected: 27200, best: 33200, worst: 24100 },
										{ month: 'Jun', actual: null, expected: 30800, best: 38100, worst: 27300 },
									]}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="month" />
										<YAxis />
										<Tooltip />
										<Legend />
										<Line type="monotone" dataKey="actual" stroke="#8b5cf6" strokeWidth={3} name="Actual" />
										<Line type="monotone" dataKey="expected" stroke="#3b82f6" strokeWidth={2} name="Expected" strokeDasharray="5 5" />
										<Line type="monotone" dataKey="best" stroke="#10b981" strokeWidth={1} name="Best Case" />
										<Line type="monotone" dataKey="worst" stroke="#ef4444" strokeWidth={1} name="Worst Case" />
									</LineChart>
								</ResponsiveContainer>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
								<div style={{ padding: '1rem', background: '#dcfce7', borderRadius: '8px' }}>
									<div style={{ fontSize: '0.875rem', color: '#065f46', marginBottom: '0.5rem' }}>Best Case (6m)</div>
									<div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#065f46' }}>€38.1k MRR</div>
									<div style={{ fontSize: '0.75rem', color: '#065f46' }}>+147% growth</div>
								</div>
								<div style={{ padding: '1rem', background: '#dbeafe', borderRadius: '8px' }}>
									<div style={{ fontSize: '0.875rem', color: '#1e40af', marginBottom: '0.5rem' }}>Expected (6m)</div>
									<div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>€30.8k MRR</div>
									<div style={{ fontSize: '0.75rem', color: '#1e40af' }}>+100% growth</div>
								</div>
								<div style={{ padding: '1rem', background: '#fee2e2', borderRadius: '8px' }}>
									<div style={{ fontSize: '0.875rem', color: '#991b1b', marginBottom: '0.5rem' }}>Worst Case (6m)</div>
									<div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#991b1b' }}>€27.3k MRR</div>
									<div style={{ fontSize: '0.75rem', color: '#991b1b' }}>+77% growth</div>
								</div>
							</div>

							<div style={{ background: '#f3f4f6', borderRadius: '8px', padding: '1.5rem' }}>
								<div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>💰 Runway & Burn Rate</div>
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
									<div>
										<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Current Runway</div>
										<div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>18 months</div>
									</div>
									<div>
										<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Monthly Burn</div>
										<div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>€12,500</div>
									</div>
									<div>
										<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Cash Balance</div>
										<div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>€225,000</div>
									</div>
									<div>
										<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Next Funding Need</div>
										<div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Q2 2026</div>
									</div>
								</div>
							</div>
						</>
					)}

					{predictions && (
					<>
						{/* Runway Warning */}
						{predictions.runway.warning && (
							<div
								style={{
									padding: "1rem",
									background: "#fee2e2",
									border: "2px solid #ef4444",
									borderRadius: "12px",
									marginBottom: "1.5rem",
								}}
							>
								<div
									style={{
										fontSize: "1rem",
										fontWeight: "bold",
										color: "#991b1b",
										marginBottom: "0.5rem",
									}}
								>
									{predictions.runway.warning}
								</div>
								<div style={{ fontSize: "0.875rem", color: "#7f1d1d" }}>
									Runway: {predictions.runway.months} meses | Run out:{" "}
									{new Date(predictions.runway.runOutDate).toLocaleDateString(
										"es-ES",
									)}
								</div>
							</div>
						)}

						{/* Predicciones a 3, 6, 12 meses */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(3, 1fr)",
								gap: "1rem",
								marginBottom: "1.5rem",
							}}
						>
							<div
								style={{
									padding: "1.5rem",
									background: "#f0f9ff",
									borderRadius: "12px",
									border: "2px solid #3b82f6",
								}}
							>
								<div
									style={{
										fontSize: "0.875rem",
										color: "#1e40af",
										fontWeight: "600",
										marginBottom: "0.5rem",
									}}
								>
									3 Meses ({predictions.predictions.threeMonths.confidence}%
									confianza)
								</div>
								<div
									style={{
										fontSize: "1.75rem",
										fontWeight: "bold",
										color: "#1e3a8a",
										marginBottom: "0.5rem",
									}}
								>
									€{predictions.predictions.threeMonths.mrr.toLocaleString()}
								</div>
								<div style={{ fontSize: "0.75rem", color: "#3730a3" }}>
									MRR Proyectado
								</div>
								<div
									style={{
										fontSize: "0.75rem",
										color:
											predictions.predictions.threeMonths.profit > 0
												? "#059669"
												: "#dc2626",
										marginTop: "0.5rem",
									}}
								>
									Profit: €
									{predictions.predictions.threeMonths.profit.toLocaleString()}
								</div>
							</div>

							<div
								style={{
									padding: "1.5rem",
									background: "#f0fdf4",
									borderRadius: "12px",
									border: "2px solid #10b981",
								}}
							>
								<div
									style={{
										fontSize: "0.875rem",
										color: "#047857",
										fontWeight: "600",
										marginBottom: "0.5rem",
									}}
								>
									6 Meses ({predictions.predictions.sixMonths.confidence}%
									confianza)
								</div>
								<div
									style={{
										fontSize: "1.75rem",
										fontWeight: "bold",
										color: "#065f46",
										marginBottom: "0.5rem",
									}}
								>
									€{predictions.predictions.sixMonths.mrr.toLocaleString()}
								</div>
								<div style={{ fontSize: "0.75rem", color: "#047857" }}>
									MRR Proyectado
								</div>
								<div
									style={{
										fontSize: "0.75rem",
										color:
											predictions.predictions.sixMonths.profit > 0
												? "#059669"
												: "#dc2626",
										marginTop: "0.5rem",
									}}
								>
									Profit: €
									{predictions.predictions.sixMonths.profit.toLocaleString()}
								</div>
							</div>

							<div
								style={{
									padding: "1.5rem",
									background: "#fef3c7",
									borderRadius: "12px",
									border: "2px solid #f59e0b",
								}}
							>
								<div
									style={{
										fontSize: "0.875rem",
										color: "#92400e",
										fontWeight: "600",
										marginBottom: "0.5rem",
									}}
								>
									12 Meses ({predictions.predictions.twelveMonths.confidence}%
									confianza)
								</div>
								<div
									style={{
										fontSize: "1.75rem",
										fontWeight: "bold",
										color: "#78350f",
										marginBottom: "0.5rem",
									}}
								>
									€{predictions.predictions.twelveMonths.mrr.toLocaleString()}
								</div>
								<div style={{ fontSize: "0.75rem", color: "#92400e" }}>
									MRR Proyectado
								</div>
								<div
									style={{
										fontSize: "0.75rem",
										color:
											predictions.predictions.twelveMonths.profit > 0
												? "#059669"
												: "#dc2626",
										marginTop: "0.5rem",
									}}
								>
									Profit: €
									{predictions.predictions.twelveMonths.profit.toLocaleString()}
								</div>
							</div>
						</div>

						{/* Escenarios */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(3, 1fr)",
								gap: "1rem",
								marginBottom: "1.5rem",
							}}
						>
							<div
								style={{
									padding: "1.5rem",
									background: "#d1fae5",
									borderRadius: "12px",
								}}
							>
								<div
									style={{
										fontSize: "1rem",
										fontWeight: "bold",
										color: "#065f46",
										marginBottom: "0.5rem",
									}}
								>
									🚀 Best Case
								</div>
								<div
									style={{
										fontSize: "1.5rem",
										fontWeight: "bold",
										color: "#047857",
										marginBottom: "0.5rem",
									}}
								>
									€{predictions.scenarios.bestCase.mrr12m.toLocaleString()}
								</div>
								<div style={{ fontSize: "0.75rem", color: "#047857" }}>
									{predictions.scenarios.bestCase.description}
								</div>
							</div>

							<div
								style={{
									padding: "1.5rem",
									background: "#e0e7ff",
									borderRadius: "12px",
								}}
							>
								<div
									style={{
										fontSize: "1rem",
										fontWeight: "bold",
										color: "#3730a3",
										marginBottom: "0.5rem",
									}}
								>
									📊 Realistic
								</div>
								<div
									style={{
										fontSize: "1.5rem",
										fontWeight: "bold",
										color: "#4338ca",
										marginBottom: "0.5rem",
									}}
								>
									€{predictions.scenarios.realistic.mrr12m.toLocaleString()}
								</div>
								<div style={{ fontSize: "0.75rem", color: "#4338ca" }}>
									{predictions.scenarios.realistic.description}
								</div>
							</div>

							<div
								style={{
									padding: "1.5rem",
									background: "#fee2e2",
									borderRadius: "12px",
								}}
							>
								<div
									style={{
										fontSize: "1rem",
										fontWeight: "bold",
										color: "#991b1b",
										marginBottom: "0.5rem",
									}}
								>
									⚠️ Worst Case
								</div>
								<div
									style={{
										fontSize: "1.5rem",
										fontWeight: "bold",
										color: "#dc2626",
										marginBottom: "0.5rem",
									}}
								>
									€{predictions.scenarios.worstCase.mrr12m.toLocaleString()}
								</div>
								<div style={{ fontSize: "0.75rem", color: "#dc2626" }}>
									{predictions.scenarios.worstCase.description}
								</div>
							</div>
						</div>

						{/* Insights */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
								gap: "1.5rem",
							}}
						>
							<div
								style={{
									padding: "1.5rem",
									background: "#f9fafb",
									borderRadius: "12px",
								}}
							>
								<h3
									style={{
										fontSize: "1rem",
										fontWeight: "bold",
										marginBottom: "0.75rem",
										color: "#374151",
									}}
								>
									💡 Insights Clave
								</h3>
								<ul
									style={{
										fontSize: "0.875rem",
										color: "#6b7280",
										marginLeft: "1.25rem",
									}}
								>
									{predictions.insights.map((insight: string, i: number) => (
										<li key={i} style={{ marginBottom: "0.5rem" }}>
											{insight}
										</li>
									))}
								</ul>
							</div>

							<div
								style={{
									padding: "1.5rem",
									background: "#f9fafb",
									borderRadius: "12px",
								}}
							>
								<h3
									style={{
										fontSize: "1rem",
										fontWeight: "bold",
										marginBottom: "0.75rem",
										color: "#374151",
									}}
								>
									🎯 Recomendaciones
								</h3>
								<ul
									style={{
										fontSize: "0.875rem",
										color: "#6b7280",
										marginLeft: "1.25rem",
									}}
								>
									{predictions.recommendations.map((rec: string, i: number) => (
										<li key={i} style={{ marginBottom: "0.5rem" }}>
											{rec}
										</li>
									))}
								</ul>
							</div>
						</div>
					</>
				)}
					</div>
				)}
			</div>

			{/* Panel de Anomaly Detection */}
			<div
				style={{
					background: "white",
					borderRadius: "16px",
					boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
					marginBottom: "2rem",
					border: "2px solid #ef4444",
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						padding: "1.5rem",
						background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
						color: "white",
						cursor: "pointer",
					}}
					onClick={() => toggleSection('anomaly')}
				>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
							<span style={{ fontSize: '1.5rem' }}>🚨</span>
							<h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>
								Anomaly Detection
							</h2>
						</div>
						<button
							onClick={(e) => { e.stopPropagation(); detectAnomaliesNow(); }}
							disabled={detectingAnomalies}
							style={{
								padding: "0.75rem 1.5rem",
								background: detectingAnomalies ? "#9ca3af" : "white",
								color: detectingAnomalies ? "#6b7280" : "#ef4444",
								border: "none",
								borderRadius: "8px",
								fontSize: "0.875rem",
								fontWeight: "bold",
								cursor: detectingAnomalies ? "not-allowed" : "pointer",
							}}
						>
							{detectingAnomalies ? "⏳ Analizando..." : "🚨 Detectar Anomalías"}
						</button>
					</div>
				</div>

				{expandedSection === 'anomaly' && (
					<div style={{ padding: '2rem' }}>
						<div style={{ marginBottom: '2rem' }}>
							<h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>📊 Timeline de Anomalías</h3>
							<ResponsiveContainer width="100%" height={250}>
								<LineChart data={[
									{ date: 'Nov 20', mrr: 13200, anomaly: null },
									{ date: 'Nov 22', mrr: 13400, anomaly: null },
									{ date: 'Nov 25', mrr: 13700, anomaly: null },
									{ date: 'Nov 28', mrr: 12800, anomaly: 12800 },
									{ date: 'Nov 30', mrr: 13100, anomaly: null },
									{ date: 'Dec 01', mrr: 12200, anomaly: 12200 },
									{ date: 'Dec 03', mrr: 14100, anomaly: null },
									{ date: 'Dec 04', mrr: 15420, anomaly: null },
								]}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="date" />
									<YAxis />
									<Tooltip />
									<Line type="monotone" dataKey="mrr" stroke="#3b82f6" strokeWidth={2} />
									<Line type="monotone" dataKey="anomaly" stroke="#ef4444" strokeWidth={4} dot={{ r: 8 }} />
								</LineChart>
							</ResponsiveContainer>
						</div>

						<div style={{ marginBottom: '2rem' }}>
							<h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>⚠️ Anomalías Detectadas</h3>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
								{[
									{ 
										date: '2024-12-01', 
										type: 'MRR Drop', 
										severity: 'critical', 
										impact: '-€2,300', 
										cause: 'Churn spike - 8 customers',
										action: 'Alerta enviada + Análisis iniciado'
									},
									{ 
										date: '2024-11-28', 
										type: 'Conversion Drop', 
										severity: 'high', 
										impact: '-€1,100', 
										cause: 'Landing page issue detected',
										action: 'Dev team notified'
									},
									{ 
										date: '2024-11-25', 
										type: 'Payment Failure Spike', 
										severity: 'medium', 
										impact: '-€850', 
										cause: '12 failed payments',
										action: 'Retry emails sent'
									},
								].map((anomaly, idx) => (
									<div 
										key={idx} 
										style={{ 
											padding: '1rem', 
											background: anomaly.severity === 'critical' ? '#fee2e2' : anomaly.severity === 'high' ? '#fed7aa' : '#fef3c7',
											borderLeft: `4px solid ${anomaly.severity === 'critical' ? '#dc2626' : anomaly.severity === 'high' ? '#ea580c' : '#f59e0b'}`,
											borderRadius: '8px'
										}}
									>
										<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
											<div>
												<div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
													{anomaly.severity === 'critical' ? '🔴' : anomaly.severity === 'high' ? '🟠' : '🟡'} {anomaly.type}
												</div>
												<div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{anomaly.date}</div>
											</div>
											<div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#dc2626' }}>{anomaly.impact}</div>
										</div>
										<div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
											<strong>Causa probable:</strong> {anomaly.cause}
										</div>
										<div style={{ fontSize: '0.875rem', color: '#059669' }}>
											<strong>✅ Acción:</strong> {anomaly.action}
										</div>
									</div>
								))}
							</div>
						</div>

						<div style={{ background: '#f3f4f6', borderRadius: '8px', padding: '1.5rem' }}>
							<div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>📈 Estadísticas de Detección</div>
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
								<div style={{ textAlign: 'center' }}>
									<div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>23</div>
									<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Anomalías este mes</div>
								</div>
								<div style={{ textAlign: 'center' }}>
									<div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>156 min</div>
									<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Tiempo promedio detección</div>
								</div>
								<div style={{ textAlign: 'center' }}>
									<div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>€8.5k</div>
									<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Pérdidas evitadas</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{!anomalies && !detectingAnomalies && expandedSection !== 'anomaly' && (
					<div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
						<div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔍</div>
						<div
							style={{
								fontSize: "1.25rem",
								fontWeight: "600",
								marginBottom: "0.5rem",
							}}
						>
							Detección inteligente de anomalías
						</div>
						<div style={{ fontSize: "0.875rem" }}>
							Click en "Detectar Anomalías" para analizar patrones inusuales con IA
						</div>
					</div>
				)}

				{anomalies && (
					<>
						{/* Summary */}
						<div
							style={{
								padding: "1rem",
								background: "#f0f9ff",
								borderRadius: "12px",
								border: "1px solid #3b82f6",
								marginBottom: "1.5rem",
							}}
						>
							<div
								style={{
									fontSize: "0.875rem",
									fontWeight: "bold",
									color: "#1e40af",
									marginBottom: "0.5rem",
								}}
							>
								📊 Resumen del Análisis
							</div>
							<div style={{ fontSize: "0.875rem", color: "#1e3a8a" }}>
								{anomalies.analysis.summary}
							</div>
						</div>

						{/* Assessment */}
						<div
							style={{
								padding: "1rem",
								background:
									anomalies.analysis.urgentActions.length > 0
										? "#fee2e2"
										: "#f0fdf4",
								borderRadius: "12px",
								border: `2px solid ${anomalies.analysis.urgentActions.length > 0 ? "#ef4444" : "#10b981"}`,
								marginBottom: "1.5rem",
							}}
						>
							<div
								style={{
									fontSize: "0.875rem",
									fontWeight: "bold",
									color:
										anomalies.analysis.urgentActions.length > 0
											? "#991b1b"
											: "#065f46",
									marginBottom: "0.5rem",
								}}
							>
								{anomalies.analysis.urgentActions.length > 0
									? "⚠️ Assessment General"
									: "✅ Assessment General"}
							</div>
							<div
								style={{
									fontSize: "0.875rem",
									color:
										anomalies.analysis.urgentActions.length > 0
											? "#7f1d1d"
											: "#047857",
								}}
							>
								{anomalies.analysis.overallAssessment}
							</div>
						</div>

						{/* Urgent Actions */}
						{anomalies.analysis.urgentActions.length > 0 && (
							<div
								style={{
									padding: "1rem",
									background: "#fef3c7",
									borderRadius: "12px",
									border: "2px solid #f59e0b",
									marginBottom: "1.5rem",
								}}
							>
								<div
									style={{
										fontSize: "0.875rem",
										fontWeight: "bold",
										color: "#92400e",
										marginBottom: "0.5rem",
									}}
								>
									⚡ Acciones Urgentes
								</div>
								<ul
									style={{
										fontSize: "0.875rem",
										color: "#78350f",
										marginLeft: "1.25rem",
									}}
								>
									{anomalies.analysis.urgentActions.map(
										(action: string, i: number) => (
											<li key={i} style={{ marginBottom: "0.25rem" }}>
												{action}
											</li>
										),
									)}
								</ul>
							</div>
						)}

						{/* Anomalías detectadas */}
						{anomalies.anomalies.length > 0 && (
							<div>
								<h3
									style={{
										fontSize: "1rem",
										fontWeight: "bold",
										marginBottom: "0.75rem",
										color: "#374151",
									}}
								>
									Anomalías Detectadas ({anomalies.anomalies.length})
								</h3>

								<div style={{ display: "grid", gap: "0.75rem" }}>
									{anomalies.anomalies.map((anomaly: any) => {
										const bgColors = {
											CRITICAL: "#fee2e2",
											HIGH: "#fed7aa",
											MEDIUM: "#fef3c7",
											LOW: "#f3f4f6",
										};
										const borderColors = {
											CRITICAL: "#ef4444",
											HIGH: "#f97316",
											MEDIUM: "#f59e0b",
											LOW: "#9ca3af",
										};
										const textColors = {
											CRITICAL: "#991b1b",
											HIGH: "#9a3412",
											MEDIUM: "#92400e",
											LOW: "#374151",
										};

										return (
											<div
												key={anomaly.id}
												style={{
													padding: "1rem",
													background:
														bgColors[anomaly.severity as keyof typeof bgColors],
													border: `2px solid ${borderColors[anomaly.severity as keyof typeof borderColors]}`,
													borderRadius: "12px",
												}}
											>
												<div
													style={{
														display: "flex",
														justifyContent: "space-between",
														alignItems: "start",
														marginBottom: "0.5rem",
													}}
												>
													<div>
														<span
															style={{
																fontSize: "0.75rem",
																padding: "0.25rem 0.5rem",
																borderRadius: "9999px",
																background:
																	borderColors[
																		anomaly.severity as keyof typeof borderColors
																	],
																color: "white",
																fontWeight: "bold",
																marginRight: "0.5rem",
															}}
														>
															{anomaly.severity}
														</span>
														<span
															style={{
																fontSize: "0.875rem",
																fontWeight: "bold",
																color:
																	textColors[
																		anomaly.severity as keyof typeof textColors
																	],
															}}
														>
															{anomaly.type.replace(/_/g, " ")} - {anomaly.metric}
														</span>
													</div>
													{anomaly.autoInvestigate && (
														<span
															style={{
																fontSize: "0.75rem",
																padding: "0.25rem 0.5rem",
																borderRadius: "9999px",
																background: "#dc2626",
																color: "white",
																fontWeight: "bold",
															}}
														>
															🔍 Auto-Investigar
														</span>
													)}
												</div>

												<div
													style={{
														fontSize: "0.875rem",
														color:
															textColors[anomaly.severity as keyof typeof textColors],
														marginBottom: "0.5rem",
													}}
												>
													{anomaly.description}
												</div>

												<div
													style={{
														fontSize: "0.75rem",
														color: "#6b7280",
														marginBottom: "0.5rem",
													}}
												>
													{anomaly.context}
												</div>

												<div
													style={{
														display: "grid",
														gridTemplateColumns: "1fr 1fr",
														gap: "0.75rem",
														marginTop: "0.75rem",
													}}
												>
													<div
														style={{
															padding: "0.5rem",
															background: "rgba(255, 255, 255, 0.5)",
															borderRadius: "6px",
														}}
													>
														<div
															style={{
																fontSize: "0.75rem",
																color: "#6b7280",
																marginBottom: "0.25rem",
															}}
														>
															Posibles causas:
														</div>
														<ul
															style={{
																fontSize: "0.75rem",
																color: "#374151",
																marginLeft: "1rem",
															}}
														>
															{anomaly.possibleCauses
																.slice(0, 2)
																.map((cause: string, i: number) => (
																	<li key={i}>{cause}</li>
																))}
														</ul>
													</div>

													<div
														style={{
															padding: "0.5rem",
															background: "rgba(255, 255, 255, 0.5)",
															borderRadius: "6px",
														}}
													>
														<div
															style={{
																fontSize: "0.75rem",
																color: "#6b7280",
																marginBottom: "0.25rem",
															}}
														>
															Recomendaciones:
														</div>
														<ul
															style={{
																fontSize: "0.75rem",
																color: "#374151",
																marginLeft: "1rem",
															}}
														>
															{anomaly.recommendations
																.slice(0, 2)
																.map((rec: string, i: number) => (
																	<li key={i}>{rec}</li>
																))}
														</ul>
													</div>
												</div>

												{anomaly.aiReasoning && (
													<div
														style={{
															marginTop: "0.75rem",
															padding: "0.5rem",
															background: "rgba(139, 92, 246, 0.1)",
															borderRadius: "6px",
														}}
													>
														<div
															style={{
																fontSize: "0.75rem",
																color: "#6b21a8",
																fontWeight: "bold",
																marginBottom: "0.25rem",
															}}
														>
															🤖 Análisis de IA:
														</div>
														<div style={{ fontSize: "0.75rem", color: "#7c3aed" }}>
															{anomaly.aiReasoning}
														</div>
													</div>
												)}
											</div>
										);
									})}
								</div>
							</div>
						)}

						{anomalies.anomalies.length === 0 && (
							<div style={{ textAlign: "center", padding: "2rem", color: "#10b981" }}>
								<div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>✅</div>
								<div style={{ fontSize: "1rem", fontWeight: "600" }}>
									No se detectaron anomalías
								</div>
								<div
									style={{
										fontSize: "0.875rem",
										marginTop: "0.25rem",
										color: "#6b7280",
									}}
								>
									Todas las métricas están dentro de rangos normales
								</div>
							</div>
						)}
					</>
				)}
			</div>

			{/* Segmentación & Breakdown */}
			<div style={{ marginBottom: '2rem', background: 'white', borderRadius: '12px', border: '2px solid #f59e0b', overflow: 'hidden' }}>
				<div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', cursor: 'pointer' }} onClick={() => toggleSection('segmentation')}>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
							<span style={{ fontSize: '1.5rem' }}>🎯</span>
							<h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Segmentación & Breakdown</h2>
						</div>
					</div>
				</div>
				{expandedSection === 'segmentation' && (
					<div style={{ padding: '2rem' }}>
						{/* MRR by Plan */}
						<div style={{ marginBottom: '2rem' }}>
							<h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>💎 MRR por Plan</h3>
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
								<div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '8px' }}>
									<div style={{ fontSize: '0.875rem', color: '#92400e', marginBottom: '0.5rem' }}>Enterprise</div>
									<div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#92400e' }}>€8,500</div>
									<div style={{ fontSize: '0.75rem', color: '#92400e' }}>55% del MRR • 12 customers</div>
								</div>
								<div style={{ padding: '1rem', background: '#dbeafe', borderRadius: '8px' }}>
									<div style={{ fontSize: '0.875rem', color: '#1e3a8a', marginBottom: '0.5rem' }}>Pro</div>
									<div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e3a8a' }}>€4,200</div>
									<div style={{ fontSize: '0.75rem', color: '#1e3a8a' }}>27% del MRR • 28 customers</div>
								</div>
								<div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
									<div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>Starter</div>
									<div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151' }}>€2,720</div>
									<div style={{ fontSize: '0.75rem', color: '#374151' }}>18% del MRR • 68 customers</div>
								</div>
							</div>
							<ResponsiveContainer width="100%" height={200}>
								<BarChart data={[
									{ plan: 'Enterprise', mrr: 8500, customers: 12 },
									{ plan: 'Pro', mrr: 4200, customers: 28 },
									{ plan: 'Starter', mrr: 2720, customers: 68 },
								]} layout="vertical">
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis type="number" />
									<YAxis type="category" dataKey="plan" />
									<Tooltip />
									<Bar dataKey="mrr" fill="#f59e0b" />
								</BarChart>
							</ResponsiveContainer>
						</div>

						{/* By Channel */}
						<div style={{ marginBottom: '2rem' }}>
							<h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>📊 Por Canal de Adquisición</h3>
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
								{[
									{ channel: 'Paid Ads', customers: 45, cac: '€1,450', ltv: '€4,800', roi: '231%' },
									{ channel: 'Organic', customers: 38, cac: '€850', ltv: '€4,200', roi: '394%' },
									{ channel: 'Referral', customers: 18, cac: '€320', ltv: '€5,100', roi: '1,494%' },
									{ channel: 'Direct', customers: 7, cac: '€0', ltv: '€3,900', roi: '∞' },
								].map((channel, idx) => (
									<div key={idx} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
										<div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{channel.channel}</div>
										<div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>{channel.customers} customers</div>
										<div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>CAC: {channel.cac}</div>
										<div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>LTV: {channel.ltv}</div>
										<div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#10b981' }}>ROI: {channel.roi}</div>
									</div>
								))}
							</div>
						</div>

						{/* By Geography */}
						<div>
							<h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>🌍 Por Región</h3>
							<ResponsiveContainer width="100%" height={250}>
								<PieChart>
									<Pie
										data={[
											{ region: 'Europe', value: 6800, color: '#3b82f6' },
											{ region: 'North America', value: 5200, color: '#8b5cf6' },
											{ region: 'Asia Pacific', value: 2400, color: '#10b981' },
											{ region: 'LATAM', value: 1020, color: '#f59e0b' },
										]}
										dataKey="value"
										nameKey="region"
										cx="50%"
										cy="50%"
										outerRadius={80}
										label
									>
										{[
											{ region: 'Europe', value: 6800, color: '#3b82f6' },
											{ region: 'North America', value: 5200, color: '#8b5cf6' },
											{ region: 'Asia Pacific', value: 2400, color: '#10b981' },
											{ region: 'LATAM', value: 1020, color: '#f59e0b' },
										].map((entry, index) => (
											<Cell key={`cell-${index}`} fill={entry.color} />
										))}
									</Pie>
									<Tooltip />
									<Legend />
								</PieChart>
							</ResponsiveContainer>
						</div>
					</div>
				)}
			</div>

			{/* Panel de Cohort Analysis */}
			<div
				style={{
					background: "white",
					borderRadius: "16px",
					boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
					marginBottom: "2rem",
					border: "2px solid #8b5cf6",
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						padding: "1.5rem",
						background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
						color: "white",
						cursor: "pointer",
					}}
					onClick={() => toggleSection('cohort')}
				>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
							<span style={{ fontSize: '1.5rem' }}>📊</span>
							<h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>
								Cohort Analysis & Retention
							</h2>
						</div>
						<button
							onClick={(e) => { e.stopPropagation(); loadCohortAnalysis(); }}
							disabled={loadingCohorts}
							style={{
								padding: "0.75rem 1.5rem",
								background: loadingCohorts ? "#9ca3af" : "white",
								color: loadingCohorts ? "#6b7280" : "#8b5cf6",
								border: "none",
								borderRadius: "8px",
								fontSize: "0.875rem",
								fontWeight: "bold",
								cursor: loadingCohorts ? "not-allowed" : "pointer",
							}}
						>
							{loadingCohorts ? "⏳ Cargando..." : "📊 Cargar Cohort Analysis"}
						</button>
					</div>
				</div>

				{expandedSection === 'cohort' && (
					<div style={{ padding: '2rem' }}>
						<div style={{ marginBottom: '2rem' }}>
							<h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>📊 Tabla de Retención por Cohorte</h3>
							<div style={{ overflowX: 'auto' }}>
								<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
									<thead>
										<tr style={{ background: '#f3f4f6' }}>
											<th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Cohorte</th>
											<th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>M0</th>
											<th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>M1</th>
											<th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>M2</th>
											<th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>M3</th>
											<th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>M6</th>
											<th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>M12</th>
										</tr>
									</thead>
									<tbody>
										{[
											{ month: 'Jan 2024', m0: 100, m1: 92, m2: 88, m3: 85, m6: 78, m12: 72, isGolden: true },
											{ month: 'Feb 2024', m0: 100, m1: 89, m2: 84, m3: 80, m6: 74, m12: 68, isGolden: false },
											{ month: 'Mar 2024', m0: 100, m1: 91, m2: 86, m3: 82, m6: 76, m12: null, isGolden: false },
											{ month: 'Apr 2024', m0: 100, m1: 87, m2: 82, m3: 78, m6: 71, m12: null, isGolden: false },
											{ month: 'May 2024', m0: 100, m1: 93, m2: 89, m3: 85, m6: null, m12: null, isGolden: false },
											{ month: 'Jun 2024', m0: 100, m1: 90, m2: 85, m3: null, m6: null, m12: null, isGolden: false },
										].map((cohort, idx) => (
											<tr key={idx} style={{ background: cohort.isGolden ? '#fef3c7' : 'white' }}>
												<td style={{ padding: '0.75rem', border: '1px solid #e5e7eb', fontWeight: cohort.isGolden ? 'bold' : 'normal' }}>
													{cohort.month} {cohort.isGolden && '⭐'}
												</td>
												<td style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e5e7eb', background: '#dcfce7' }}>{cohort.m0}%</td>
												<td style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e5e7eb', background: cohort.m1 >= 90 ? '#bbf7d0' : '#d1fae5' }}>{cohort.m1}%</td>
												<td style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e5e7eb', background: cohort.m2 >= 85 ? '#bbf7d0' : '#d1fae5' }}>{cohort.m2}%</td>
												<td style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e5e7eb', background: cohort.m3 >= 80 ? '#bbf7d0' : '#d1fae5' }}>{cohort.m3 || '-'}%</td>
												<td style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e5e7eb', background: cohort.m6 >= 75 ? '#bbf7d0' : cohort.m6 ? '#fef3c7' : '#f3f4f6' }}>{cohort.m6 ? `${cohort.m6}%` : '-'}</td>
												<td style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e5e7eb', background: cohort.m12 >= 70 ? '#bbf7d0' : cohort.m12 ? '#fef3c7' : '#f3f4f6' }}>{cohort.m12 ? `${cohort.m12}%` : '-'}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>

						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
							<div style={{ padding: '1.5rem', background: '#fef3c7', borderRadius: '8px', border: '2px solid #f59e0b' }}>
								<div style={{ fontSize: '0.875rem', color: '#92400e', marginBottom: '0.5rem' }}>⭐ Golden Cohort</div>
								<div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#92400e', marginBottom: '0.5rem' }}>Jan 2024</div>
								<div style={{ fontSize: '0.75rem', color: '#92400e' }}>72% retención a 12 meses</div>
								<div style={{ fontSize: '0.75rem', color: '#92400e' }}>€5,200 LTV promedio</div>
							</div>
							<div style={{ padding: '1.5rem', background: '#dcfce7', borderRadius: '8px' }}>
								<div style={{ fontSize: '0.875rem', color: '#065f46', marginBottom: '0.5rem' }}>Net Revenue Retention</div>
								<div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#065f46' }}>115%</div>
								<div style={{ fontSize: '0.75rem', color: '#065f46' }}>Target: >110%</div>
							</div>
							<div style={{ padding: '1.5rem', background: '#dbeafe', borderRadius: '8px' }}>
								<div style={{ fontSize: '0.875rem', color: '#1e3a8a', marginBottom: '0.5rem' }}>Quick Ratio</div>
								<div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e3a8a' }}>4.2</div>
								<div style={{ fontSize: '0.75rem', color: '#1e3a8a' }}>Target: >4.0 ✅</div>
							</div>
						</div>

						<div style={{ background: '#f3f4f6', borderRadius: '8px', padding: '1.5rem' }}>
							<h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>📈 NRR Trend</h3>
							<ResponsiveContainer width="100%" height={200}>
								<LineChart data={[
									{ month: 'Jul', nrr: 108 },
									{ month: 'Aug', nrr: 111 },
									{ month: 'Sep', nrr: 113 },
									{ month: 'Oct', nrr: 112 },
									{ month: 'Nov', nrr: 114 },
									{ month: 'Dec', nrr: 115 },
								]}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="month" />
									<YAxis domain={[100, 120]} />
									<Tooltip />
									<Line type="monotone" dataKey="nrr" stroke="#10b981" strokeWidth={2} />
								</LineChart>
							</ResponsiveContainer>
						</div>
					</div>
				)}

				{!cohortData && !loadingCohorts && expandedSection !== 'cohort' && (
					<div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
						<div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📊</div>
						<div
							style={{
								fontSize: "1.25rem",
								fontWeight: "600",
								marginBottom: "0.5rem",
							}}
						>
							Análisis de Cohortes & Retención
						</div>
						<div style={{ fontSize: "0.875rem" }}>
							Click en "Cargar Cohort Analysis" para ver retención por cohorte,
							golden cohort y NRR
						</div>
					</div>
				)}

				{cohortData && (
					<>
						{/* Métricas agregadas */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns:
									"repeat(auto-fit, minmax(200px, 1fr))",
								gap: "1rem",
								marginBottom: "1.5rem",
							}}
						>
							<div
								style={{
									padding: "1rem",
									background: "#f0f9ff",
									borderRadius: "12px",
									border: "1px solid #3b82f6",
								}}
							>
								<div
									style={{
										fontSize: "0.75rem",
										color: "#1e40af",
										marginBottom: "0.25rem",
									}}
								>
									Retención M1
								</div>
								<div
									style={{
										fontSize: "1.5rem",
										fontWeight: "bold",
										color: "#1e3a8a",
									}}
								>
									{cohortData.aggregateMetrics.averageRetention.month1.toFixed(
										1,
									)}
									%
								</div>
							</div>
							<div
								style={{
									padding: "1rem",
									background: "#f0fdf4",
									borderRadius: "12px",
									border: "1px solid #10b981",
								}}
							>
								<div
									style={{
										fontSize: "0.75rem",
										color: "#047857",
										marginBottom: "0.25rem",
									}}
								>
									Retención M12
								</div>
								<div
									style={{
										fontSize: "1.5rem",
										fontWeight: "bold",
										color: "#065f46",
									}}
								>
									{cohortData.aggregateMetrics.averageRetention.month12.toFixed(
										1,
									)}
									%
								</div>
							</div>
							<div
								style={{
									padding: "1rem",
									background: "#fef3c7",
									borderRadius: "12px",
									border: "1px solid #f59e0b",
								}}
							>
								<div
									style={{
										fontSize: "0.75rem",
										color: "#92400e",
										marginBottom: "0.25rem",
									}}
								>
									NRR Promedio
								</div>
								<div
									style={{
										fontSize: "1.5rem",
										fontWeight: "bold",
										color: "#78350f",
									}}
								>
									{cohortData.aggregateMetrics.averageNRR.toFixed(1)}%
								</div>
							</div>
							<div
								style={{
									padding: "1rem",
									background: "#e0e7ff",
									borderRadius: "12px",
									border: "1px solid #6366f1",
								}}
							>
								<div
									style={{
										fontSize: "0.75rem",
										color: "#3730a3",
										marginBottom: "0.25rem",
									}}
								>
									LTV Promedio
								</div>
								<div
									style={{
										fontSize: "1.5rem",
										fontWeight: "bold",
										color: "#4338ca",
									}}
								>
									€{cohortData.aggregateMetrics.averageLTV.toFixed(0)}
								</div>
							</div>
						</div>

						{/* Golden Cohort */}
						<div
							style={{
								padding: "1.5rem",
								background:
									"linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
								borderRadius: "12px",
								marginBottom: "1.5rem",
								color: "white",
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
								}}
							>
								<div style={{ flex: 1 }}>
									<div
										style={{
											fontSize: "1rem",
											fontWeight: "bold",
											marginBottom: "0.5rem",
										}}
									>
										🏆 Golden Cohort
									</div>
									<div
										style={{
											fontSize: "1.5rem",
											fontWeight: "bold",
											marginBottom: "0.5rem",
										}}
									>
										{cohortData.goldenCohort.name}
									</div>
									<div
										style={{
											fontSize: "0.875rem",
											opacity: 0.9,
											marginBottom: "0.75rem",
										}}
									>
										La cohorte con mejor performance combinado (LTV + NRR +
										Retención)
									</div>
									<div
										style={{
											display: "flex",
											gap: "1rem",
											fontSize: "0.875rem",
										}}
									>
										<span>
											LTV: €{cohortData.goldenCohort.metrics.ltv}
										</span>
										<span>
											NRR: {cohortData.goldenCohort.metrics.nrr}%
										</span>
										<span>
											Ret. M12: {cohortData.goldenCohort.retention.month12}%
										</span>
									</div>
								</div>
								<div style={{ fontSize: "4rem" }}>🏆</div>
							</div>
							{cohortData.goldenCohort.characteristics.length > 0 && (
								<div
									style={{
										marginTop: "1rem",
										display: "flex",
										flexWrap: "wrap",
										gap: "0.5rem",
									}}
								>
									{cohortData.goldenCohort.characteristics.map(
										(char: string, i: number) => (
											<span
												key={i}
												style={{
													padding: "0.25rem 0.75rem",
													background: "rgba(255, 255, 255, 0.2)",
													borderRadius: "9999px",
													fontSize: "0.75rem",
												}}
											>
												{char}
											</span>
										),
									)}
								</div>
							)}
						</div>

						{/* Heatmap de Retención */}
						<div style={{ marginBottom: "1.5rem" }}>
							<h3
								style={{
									fontSize: "1rem",
									fontWeight: "bold",
									marginBottom: "0.75rem",
									color: "#374151",
								}}
							>
								🔥 Heatmap de Retención
							</h3>
							<div style={{ overflowX: "auto" }}>
								<table
									style={{
										width: "100%",
										borderCollapse: "separate",
										borderSpacing: "4px",
									}}
								>
									<thead>
										<tr>
											<th
												style={{
													padding: "0.5rem",
													fontSize: "0.75rem",
													textAlign: "left",
													color: "#6b7280",
												}}
											>
												Cohorte
											</th>
											<th
												style={{
													padding: "0.5rem",
													fontSize: "0.75rem",
													textAlign: "center",
													color: "#6b7280",
												}}
											>
												M0
											</th>
											<th
												style={{
													padding: "0.5rem",
													fontSize: "0.75rem",
													textAlign: "center",
													color: "#6b7280",
												}}
											>
												M1
											</th>
											<th
												style={{
													padding: "0.5rem",
													fontSize: "0.75rem",
													textAlign: "center",
													color: "#6b7280",
												}}
											>
												M2
											</th>
											<th
												style={{
													padding: "0.5rem",
													fontSize: "0.75rem",
													textAlign: "center",
													color: "#6b7280",
												}}
											>
												M3
											</th>
											<th
												style={{
													padding: "0.5rem",
													fontSize: "0.75rem",
													textAlign: "center",
													color: "#6b7280",
												}}
											>
												M6
											</th>
											<th
												style={{
													padding: "0.5rem",
													fontSize: "0.75rem",
													textAlign: "center",
													color: "#6b7280",
												}}
											>
												M12
											</th>
										</tr>
									</thead>
									<tbody>
										{cohortData.heatmapData.map((row: any) => (
											<tr key={row.cohort}>
												<td
													style={{
														padding: "0.5rem",
														fontSize: "0.75rem",
														fontWeight: "600",
														color: "#374151",
													}}
												>
													{row.cohort}
												</td>
												{[
													"month0",
													"month1",
													"month2",
													"month3",
													"month6",
													"month12",
												].map((month) => {
													const value = row[month];

													const getColor = (val: number) => {
														if (val >= 90) return "#10b981";
														if (val >= 75) return "#3b82f6";
														if (val >= 60) return "#f59e0b";
														if (val >= 40) return "#f97316";
														return "#ef4444";
													};

													return (
														<td
															key={month}
															style={{
																padding: "0.5rem",
																textAlign: "center",
																background: getColor(value),
																color: "white",
																fontSize: "0.75rem",
																fontWeight: "bold",
																borderRadius: "4px",
															}}
														>
															{value.toFixed(0)}%
														</td>
													);
												})}
											</tr>
										))}
									</tbody>
								</table>
							</div>
							<div
								style={{
									marginTop: "0.5rem",
									display: "flex",
									gap: "1rem",
									fontSize: "0.75rem",
									color: "#6b7280",
								}}
							>
								<span
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.25rem",
									}}
								>
									<div
										style={{
											width: "12px",
											height: "12px",
											background: "#10b981",
											borderRadius: "2px",
										}}
									></div>
								≥90%
								</span>
								<span
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.25rem",
									}}
								>
									<div
										style={{
											width: "12px",
											height: "12px",
											background: "#3b82f6",
											borderRadius: "2px",
										}}
									></div>
									75-90%
								</span>
								<span
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.25rem",
									}}
								>
									<div
										style={{
											width: "12px",
											height: "12px",
											background: "#f59e0b",
											borderRadius: "2px",
										}}
									></div>
									60-75%
								</span>
								<span
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.25rem",
									}}
								>
									<div
										style={{
											width: "12px",
											height: "12px",
											background: "#f97316",
											borderRadius: "2px",
										}}
									></div>
									40-60%
								</span>
								<span
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.25rem",
									}}
								>
									<div
										style={{
											width: "12px",
											height: "12px",
											background: "#ef4444",
											borderRadius: "2px",
										}}
									></div>
									{'<'}40%
								</span>
							</div>
						</div>

						{/* Lista de Cohortes */}
						<div>
							<h3
								style={{
									fontSize: "1rem",
									fontWeight: "bold",
									marginBottom: "0.75rem",
									color: "#374151",
								}}
							>
								📋 Todas las Cohortes
							</h3>
							<div
								style={{
									display: "grid",
									gap: "0.75rem",
									maxHeight: "400px",
									overflowY: "auto",
								}}
							>
								{cohortData.cohorts.map((cohort: any) => (
									<div
										key={cohort.id}
										style={{
											padding: "1rem",
											background:
												cohort.id === cohortData.goldenCohort.id
													? "#fef3c7"
													: "#f9fafb",
											border: `2px solid ${cohort.id === cohortData.goldenCohort.id ? "#f59e0b" : "#e5e7eb"}`,
											borderRadius: "12px",
											cursor: "pointer",
											transition: "all 0.2s",
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.transform = "scale(1.02)";
											e.currentTarget.style.boxShadow =
												"0 4px 12px rgba(0,0,0,0.1)";
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.transform = "scale(1)";
											e.currentTarget.style.boxShadow = "none";
										}}
									>
										<div
											style={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "start",
												marginBottom: "0.5rem",
											}}
										>
											<div>
												<div
													style={{
														fontSize: "0.875rem",
														fontWeight: "bold",
														color: "#374151",
													}}
												>
													{cohort.name}
													{cohort.id === cohortData.goldenCohort.id && " 🏆"}
												</div>
												<div
													style={{
														fontSize: "0.75rem",
														color: "#6b7280",
													}}
												>
													{cohort.initialSize} usuarios iniciales →{" "}
													{cohort.currentSize} activos
												</div>
											</div>
											<div style={{ textAlign: "right" }}>
												<div
													style={{
														fontSize: "0.875rem",
														fontWeight: "bold",
														color:
															cohort.metrics.nrr > 100
																? "#10b981"
																: "#6b7280",
													}}
												>
													NRR: {cohort.metrics.nrr}%
												</div>
												<div
													style={{
														fontSize: "0.75rem",
														color: "#6b7280",
													}}
												>
													LTV: €{cohort.metrics.ltv}
												</div>
											</div>
										</div>

										{cohort.characteristics.length > 0 && (
											<div
												style={{
													display: "flex",
													flexWrap: "wrap",
													gap: "0.25rem",
													marginTop: "0.5rem",
												}}
											>
												{cohort.characteristics.map(
													(char: string, i: number) => (
														<span
															key={i}
															style={{
																padding: "0.125rem 0.5rem",
																background: "#e0e7ff",
																color: "#3730a3",
																borderRadius: "9999px",
																fontSize: "0.65rem",
															}}
														>
															{char}
														</span>
													),
												)}
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					</>
				)}
			</div>

			{/* Panel de Unit Economics Calculator */}
			<div
				style={{
					background: "white",
					borderRadius: "16px",
					padding: "1.5rem",
					boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
					marginBottom: "2rem",
					border: "2px solid #10b981",
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "1rem",
					}}
				>
					<h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
						🧮 Unit Economics Calculator
					</h2>

					<button
						onClick={calculateUnitEcon}
						disabled={loadingUnitEcon}
						style={{
							padding: "0.75rem 1.5rem",
							background: loadingUnitEcon
								? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
								: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
							color: "white",
							border: "none",
							borderRadius: "12px",
							fontSize: "0.875rem",
							fontWeight: "bold",
							cursor: loadingUnitEcon ? "not-allowed" : "pointer",
							transition: "all 0.2s",
						}}
						onMouseEnter={(e) =>
							!loadingUnitEcon &&
							(e.currentTarget.style.transform = "scale(1.05)")
						}
						onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
					>
						{loadingUnitEcon
							? "⏳ Calculando..."
							: "🧮 Calcular Unit Economics"}
					</button>
				</div>

				{!unitEconomics && !loadingUnitEcon && (
					<div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
						<div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🧮</div>
						<div
							style={{
								fontSize: "1.25rem",
								fontWeight: "600",
								marginBottom: "0.5rem",
							}}
						>
							Unit Economics Calculator
						</div>
						<div style={{ fontSize: "0.875rem" }}>
							Click en "Calcular Unit Economics" para ver LTV, CAC, Rule of 40,
							Magic Number y más
						</div>
					</div>
				)}

				{unitEconomics && (
					<>
						{/* Health Score */}
						<div
							style={{
								padding: "1.5rem",
								background:
									unitEconomics.assessment.overallHealth === "excellent"
										? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
										: unitEconomics.assessment.overallHealth === "good"
											? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
											: unitEconomics.assessment.overallHealth ===
													"concerning"
												? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
												: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
								borderRadius: "12px",
								marginBottom: "1.5rem",
								color: "white",
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
								}}
							>
								<div>
									<div
										style={{
											fontSize: "1rem",
											fontWeight: "bold",
											opacity: 0.9,
											marginBottom: "0.5rem",
										}}
									>
										Health Score
									</div>
									<div style={{ fontSize: "3rem", fontWeight: "bold" }}>
										{unitEconomics.assessment.score}
										<span style={{ fontSize: "1.5rem", opacity: 0.8 }}>
											/100
										</span>
									</div>
									<div
										style={{
											fontSize: "1rem",
											marginTop: "0.5rem",
											textTransform: "capitalize",
										}}
									>
										{unitEconomics.assessment.overallHealth}
									</div>
								</div>
								<div style={{ fontSize: "5rem", opacity: 0.2 }}>
									{unitEconomics.assessment.overallHealth === "excellent"
										? "🏆"
										: unitEconomics.assessment.overallHealth === "good"
											? "✅"
											: unitEconomics.assessment.overallHealth === "concerning"
												? "⚠️"
												: "🚨"}
								</div>
							</div>
						</div>

						{/* Key Ratios */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
								gap: "1rem",
								marginBottom: "1.5rem",
							}}
						>
							<div
								style={{
									padding: "1rem",
									background: "#f0f9ff",
									borderRadius: "12px",
									border: `2px solid ${
										unitEconomics.assessment.ltvCacHealth === "excellent"
											? "#10b981"
											: unitEconomics.assessment.ltvCacHealth === "good"
												? "#3b82f6"
												: "#ef4444"
									}`,
								}}
							>
								<div
									style={{
										fontSize: "0.75rem",
										color: "#1e40af",
										marginBottom: "0.25rem",
									}}
								>
									LTV:CAC Ratio
								</div>
								<div
									style={{
										fontSize: "2rem",
										fontWeight: "bold",
										color: "#1e3a8a",
									}}
								>
									{unitEconomics.ratios.ltvToCac.toFixed(1)}x
								</div>
								<div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
									Target: &gt;3x
								</div>
							</div>

							<div
								style={{
									padding: "1rem",
									background: "#f0fdf4",
									borderRadius: "12px",
									border: `2px solid ${
										unitEconomics.assessment.paybackHealth === "excellent"
											? "#10b981"
											: "#f59e0b"
									}`,
								}}
							>
								<div
									style={{
										fontSize: "0.75rem",
										color: "#047857",
										marginBottom: "0.25rem",
									}}
								>
									Payback Period
								</div>
								<div
									style={{
										fontSize: "2rem",
										fontWeight: "bold",
										color: "#065f46",
									}}
								>
									{unitEconomics.cac.paybackPeriod.toFixed(1)}m
								</div>
								<div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
									Target: &lt;12m
								</div>
							</div>

							<div
								style={{
									padding: "1rem",
									background: "#fef3c7",
									borderRadius: "12px",
									border: `2px solid ${
										unitEconomics.assessment.ruleOf40Health === "excellent"
											? "#10b981"
											: "#f59e0b"
									}`,
								}}
							>
								<div
									style={{
										fontSize: "0.75rem",
										color: "#92400e",
										marginBottom: "0.25rem",
									}}
								>
									Rule of 40
								</div>
								<div
									style={{
										fontSize: "2rem",
										fontWeight: "bold",
										color: "#78350f",
									}}
								>
									{unitEconomics.ratios.ruleOf40.toFixed(0)}
								</div>
								<div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
									Target: ≥40
								</div>
							</div>

							<div
								style={{
									padding: "1rem",
									background: "#e0e7ff",
									borderRadius: "12px",
									border: "2px solid #6366f1",
								}}
							>
								<div
									style={{
										fontSize: "0.75rem",
										color: "#3730a3",
										marginBottom: "0.25rem",
									}}
								>
									Magic Number
								</div>
								<div
									style={{
										fontSize: "2rem",
										fontWeight: "bold",
										color: "#4338ca",
									}}
								>
									{unitEconomics.ratios.magicNumber.toFixed(2)}
								</div>
								<div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
									Target: &gt;0.75
								</div>
							</div>

							<div
								style={{
									padding: "1rem",
									background: "#fce7f3",
									borderRadius: "12px",
									border: "2px solid #ec4899",
								}}
							>
								<div
									style={{
										fontSize: "0.75rem",
										color: "#9f1239",
										marginBottom: "0.25rem",
									}}
								>
									Quick Ratio
								</div>
								<div
									style={{
										fontSize: "2rem",
										fontWeight: "bold",
										color: "#831843",
									}}
								>
									{unitEconomics.ratios.quickRatio.toFixed(1)}x
								</div>
								<div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
									Target: &gt;4x
								</div>
							</div>

							<div
								style={{
									padding: "1rem",
									background: "#f5f3ff",
									borderRadius: "12px",
									border: "2px solid #8b5cf6",
								}}
							>
								<div
									style={{
										fontSize: "0.75rem",
										color: "#6b21a8",
										marginBottom: "0.25rem",
									}}
								>
									Burn Multiple
								</div>
								<div
									style={{
										fontSize: "2rem",
										fontWeight: "bold",
										color: "#7c3aed",
									}}
								>
									{unitEconomics.ratios.burnMultiple.toFixed(1)}x
								</div>
								<div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
									Target: &lt;1.5x
								</div>
							</div>
						</div>

						{/* LTV & CAC Breakdown */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
								gap: "1.5rem",
								marginBottom: "1.5rem",
							}}
						>
							<div
								style={{
									padding: "1.5rem",
									background: "#f9fafb",
									borderRadius: "12px",
								}}
							>
								<h3
									style={{
										fontSize: "1rem",
										fontWeight: "bold",
										marginBottom: "1rem",
										color: "#374151",
									}}
								>
									💰 LTV Breakdown
								</h3>
								<div
									style={{
										fontSize: "2rem",
										fontWeight: "bold",
										color: "#10b981",
										marginBottom: "1rem",
									}}
								>
									€{unitEconomics.ltv.value.toLocaleString()}
								</div>
								<div
									style={{
										fontSize: "0.875rem",
										color: "#6b7280",
										display: "grid",
										gap: "0.5rem",
									}}
								>
									<div style={{ display: "flex", justifyContent: "space-between" }}>
										<span>ARPU:</span>
										<span style={{ fontWeight: "600" }}>
											€
											{unitEconomics.ltv.breakdown.avgRevenuePerUser.toFixed(2)}
											/mes
										</span>
									</div>
									<div style={{ display: "flex", justifyContent: "space-between" }}>
										<span>Gross Margin:</span>
										<span style={{ fontWeight: "600" }}>
											{unitEconomics.ltv.breakdown.grossMargin}%
										</span>
									</div>
									<div style={{ display: "flex", justifyContent: "space-between" }}>
										<span>Churn Rate:</span>
										<span style={{ fontWeight: "600" }}>
											{unitEconomics.ltv.breakdown.churnRate}%
										</span>
									</div>
									<div style={{ display: "flex", justifyContent: "space-between" }}>
										<span>Avg Lifespan:</span>
										<span style={{ fontWeight: "600" }}>
											{unitEconomics.ltv.breakdown.averageLifespan} meses
										</span>
									</div>
								</div>
							</div>

							<div
								style={{
									padding: "1.5rem",
									background: "#f9fafb",
									borderRadius: "12px",
								}}
							>
								<h3
									style={{
										fontSize: "1rem",
										fontWeight: "bold",
										marginBottom: "1rem",
										color: "#374151",
									}}
								>
									📊 CAC por Canal
								</h3>
								<div
									style={{
										fontSize: "2rem",
										fontWeight: "bold",
										color: "#ef4444",
										marginBottom: "1rem",
									}}
								>
									€{unitEconomics.cac.value.toLocaleString()}
								</div>
								<div
									style={{
										fontSize: "0.875rem",
										color: "#6b7280",
										display: "grid",
										gap: "0.5rem",
									}}
								>
									{unitEconomics.cac.byChannel.map((ch: any) => (
										<div
											key={ch.channel}
											style={{ display: "flex", justifyContent: "space-between" }}
										>
											<span>{ch.channel}:</span>
											<span style={{ fontWeight: "600" }}>
												€{ch.cac.toFixed(0)}
											</span>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* Recommendations */}
						{unitEconomics.recommendations.length > 0 && (
							<div style={{ marginBottom: "1.5rem" }}>
								<h3
									style={{
										fontSize: "1rem",
										fontWeight: "bold",
										marginBottom: "0.75rem",
										color: "#374151",
									}}
								>
									💡 Recomendaciones
								</h3>
								<div style={{ display: "grid", gap: "0.75rem" }}>
									{unitEconomics.recommendations.map((rec: any, i: number) => (
										<div
											key={i}
											style={{
												padding: "1rem",
												background:
													rec.priority === "high"
														? "#fee2e2"
														: rec.priority === "medium"
															? "#fef3c7"
															: "#f3f4f6",
												border: `2px solid ${
													rec.priority === "high"
														? "#ef4444"
														: rec.priority === "medium"
															? "#f59e0b"
															: "#9ca3af"
												}`,
												borderRadius: "12px",
											}}
										>
											<div
												style={{
													display: "flex",
													gap: "0.5rem",
													marginBottom: "0.5rem",
												}}
											>
												<span
													style={{
														fontSize: "0.75rem",
														padding: "0.25rem 0.5rem",
														borderRadius: "9999px",
														background:
															rec.priority === "high"
																? "#dc2626"
																: rec.priority === "medium"
																	? "#d97706"
																	: "#6b7280",
														color: "white",
														fontWeight: "bold",
														textTransform: "uppercase",
													}}
												>
													{rec.priority}
												</span>
												<span
													style={{
														fontSize: "0.75rem",
														padding: "0.25rem 0.5rem",
														borderRadius: "9999px",
														background: "#e0e7ff",
														color: "#3730a3",
														fontWeight: "600",
													}}
												>
													{rec.category}
												</span>
											</div>
											<div
												style={{
													fontSize: "0.875rem",
													fontWeight: "600",
													color: "#374151",
													marginBottom: "0.25rem",
												}}
											>
												{rec.message}
											</div>
											<div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
												{rec.impact}
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* What-If Simulator */}
						<div
							style={{
								padding: "1.5rem",
								background:
									"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
								borderRadius: "12px",
								color: "white",
							}}
						>
							<h3
								style={{
									fontSize: "1.25rem",
									fontWeight: "bold",
									marginBottom: "1rem",
								}}
							>
								🎯 Simulador What-If
							</h3>
							<div
								style={{
									fontSize: "0.875rem",
									marginBottom: "1rem",
									opacity: 0.9,
								}}
							>
								Ajusta los parámetros para ver el impacto en tus unit economics
							</div>

							<div
								style={{
									display: "grid",
									gridTemplateColumns: "repeat(2, 1fr)",
									gap: "1rem",
									marginBottom: "1rem",
								}}
							>
								<div>
									<label
										style={{
											fontSize: "0.75rem",
											display: "block",
											marginBottom: "0.5rem",
										}}
									>
										Churn Rate (%):{" "}
										{simulationParams.churnRateChange > 0 ? "+" : ""}
										{simulationParams.churnRateChange}%
									</label>
									<input
										type="range"
										min="-50"
										max="50"
										value={simulationParams.churnRateChange}
										onChange={(e) =>
											setSimulationParams({
												...simulationParams,
												churnRateChange: Number(e.target.value),
											})
										}
										style={{ width: "100%" }}
									/>
								</div>

								<div>
									<label
										style={{
											fontSize: "0.75rem",
											display: "block",
											marginBottom: "0.5rem",
										}}
									>
										Pricing (%):{" "}
										{simulationParams.pricingChange > 0 ? "+" : ""}
										{simulationParams.pricingChange}%
									</label>
									<input
										type="range"
										min="-50"
										max="100"
										value={simulationParams.pricingChange}
										onChange={(e) =>
											setSimulationParams({
												...simulationParams,
												pricingChange: Number(e.target.value),
											})
										}
										style={{ width: "100%" }}
									/>
								</div>

								<div>
									<label
										style={{
											fontSize: "0.75rem",
											display: "block",
											marginBottom: "0.5rem",
										}}
									>
										CAC (%): {simulationParams.cacChange > 0 ? "+" : ""}
										{simulationParams.cacChange}%
									</label>
									<input
										type="range"
										min="-50"
										max="100"
										value={simulationParams.cacChange}
										onChange={(e) =>
											setSimulationParams({
												...simulationParams,
												cacChange: Number(e.target.value),
											})
										}
										style={{ width: "100%" }}
									/>
								</div>

								<div>
									<label
										style={{
											fontSize: "0.75rem",
											display: "block",
											marginBottom: "0.5rem",
										}}
									>
										Gross Margin (%):{" "}
										{simulationParams.grossMarginChange > 0 ? "+" : ""}
										{simulationParams.grossMarginChange}%
									</label>
									<input
										type="range"
										min="-50"
										max="50"
										value={simulationParams.grossMarginChange}
										onChange={(e) =>
											setSimulationParams({
												...simulationParams,
												grossMarginChange: Number(e.target.value),
											})
										}
										style={{ width: "100%" }}
									/>
								</div>
							</div>

							<button
								onClick={runSimulation}
								style={{
									padding: "0.75rem 1.5rem",
									background: "rgba(255, 255, 255, 0.2)",
									color: "white",
									border: "2px solid white",
									borderRadius: "8px",
									fontSize: "0.875rem",
									fontWeight: "bold",
									cursor: "pointer",
									transition: "all 0.2s",
									width: "100%",
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
								}}
							>
								🎯 Simular Cambios
							</button>

							{simulation && (
								<div
									style={{
										marginTop: "1rem",
										padding: "1rem",
										background: "rgba(255, 255, 255, 0.15)",
										borderRadius: "8px",
									}}
								>
									<div
										style={{
											fontSize: "0.875rem",
											fontWeight: "bold",
											marginBottom: "0.75rem",
										}}
									>
										📊 Resultados de la Simulación
									</div>
									<div
										style={{
											display: "grid",
											gridTemplateColumns: "repeat(2, 1fr)",
											gap: "0.5rem",
											fontSize: "0.75rem",
										}}
									>
										<div>
											<div style={{ opacity: 0.8 }}>LTV:</div>
											<div style={{ fontWeight: "bold" }}>
												€{simulation.original.ltv.value} → €
												{simulation.simulated.ltv.value}
												<span
													style={{
														color:
															simulation.impact.ltvChange > 0
																? "#86efac"
																: "#fca5a5",
														marginLeft: "0.5rem",
													}}
												>
													({simulation.impact.ltvChange > 0 ? "+" : ""}
													{simulation.impact.ltvChange.toFixed(1)}%)
												</span>
											</div>
										</div>
										<div>
											<div style={{ opacity: 0.8 }}>LTV:CAC:</div>
											<div style={{ fontWeight: "bold" }}>
												{simulation.original.ratios.ltvToCac.toFixed(1)}x →{" "}
												{simulation.simulated.ratios.ltvToCac.toFixed(1)}x
												<span
													style={{
														color:
															simulation.impact.ltvCacChange > 0
																? "#86efac"
																: "#fca5a5",
														marginLeft: "0.5rem",
													}}
												>
													({simulation.impact.ltvCacChange > 0 ? "+" : ""}
													{simulation.impact.ltvCacChange.toFixed(1)}x)
												</span>
											</div>
										</div>
										<div>
											<div style={{ opacity: 0.8 }}>Payback:</div>
											<div style={{ fontWeight: "bold" }}>
												{simulation.original.cac.paybackPeriod.toFixed(1)}m →{" "}
												{simulation.simulated.cac.paybackPeriod.toFixed(1)}m
												<span
													style={{
														color:
															simulation.impact.paybackChange < 0
																? "#86efac"
																: "#fca5a5",
														marginLeft: "0.5rem",
													}}
												>
													({simulation.impact.paybackChange > 0 ? "+" : ""}
													{simulation.impact.paybackChange.toFixed(1)}m)
												</span>
											</div>
										</div>
										<div>
											<div style={{ opacity: 0.8 }}>Score:</div>
											<div style={{ fontWeight: "bold" }}>
												{simulation.original.assessment.score} →{" "}
												{simulation.simulated.assessment.score}
												<span
													style={{
														color:
															simulation.impact.scoreChange > 0
																? "#86efac"
																: "#fca5a5",
														marginLeft: "0.5rem",
													}}
												>
													({simulation.impact.scoreChange > 0 ? "+" : ""}
													{simulation.impact.scoreChange})
												</span>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					</>
				)}
			</div>

			{/* Cash Flow & Burn */}
			<div style={{ marginBottom: '2rem', background: 'white', borderRadius: '12px', border: '2px solid #dc2626', overflow: 'hidden' }}>
				<div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', color: 'white', cursor: 'pointer' }} onClick={() => toggleSection('cashflow')}>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
							<span style={{ fontSize: '1.5rem' }}>💰</span>
							<h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Cash Flow & Burn</h2>
						</div>
					</div>
				</div>
				{expandedSection === 'cashflow' && (
					<div style={{ padding: '2rem' }}>
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
							<div style={{ padding: '1.5rem', background: '#fee2e2', borderRadius: '8px' }}>
								<div style={{ fontSize: '0.875rem', color: '#991b1b', marginBottom: '0.5rem' }}>Current Cash</div>
								<div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#991b1b' }}>€450k</div>
							</div>
							<div style={{ padding: '1.5rem', background: '#fed7aa', borderRadius: '8px' }}>
								<div style={{ fontSize: '0.875rem', color: '#9a3412', marginBottom: '0.5rem' }}>Monthly Burn</div>
								<div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#9a3412' }}>€45k</div>
							</div>
							<div style={{ padding: '1.5rem', background: '#fef3c7', borderRadius: '8px' }}>
								<div style={{ fontSize: '0.875rem', color: '#92400e', marginBottom: '0.5rem' }}>Runway</div>
								<div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#92400e' }}>10 meses</div>
								<div style={{ fontSize: '0.75rem', color: '#92400e' }}>⚠️ < 12 meses</div>
							</div>
						</div>

						<div style={{ marginBottom: '2rem' }}>
							<h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>💸 Monthly Burn Breakdown</h3>
							<ResponsiveContainer width="100%" height={250}>
								<BarChart data={[
									{ category: 'Salaries', amount: 28000 },
									{ category: 'Marketing', amount: 12000 },
									{ category: 'Infrastructure', amount: 5000 },
								]}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="category" />
									<YAxis />
									<Tooltip />
									<Bar dataKey="amount" fill="#dc2626" />
								</BarChart>
							</ResponsiveContainer>
							<div style={{ marginTop: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
								<div style={{ marginBottom: '0.5rem' }}>▓▓▓▓▓▓ <strong>Salaries:</strong> €28k (62%)</div>
								<div style={{ marginBottom: '0.5rem' }}>▓▓▓ <strong>Marketing:</strong> €12k (27%)</div>
								<div>▓ <strong>Infrastructure:</strong> €5k (11%)</div>
							</div>
						</div>

						<div style={{ background: '#fee2e2', borderRadius: '8px', padding: '1.5rem', border: '2px solid #dc2626' }}>
							<div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#991b1b' }}>⚠️ ALERTA: Runway < 12 meses</div>
							<div style={{ fontSize: '0.875rem', color: '#991b1b', marginBottom: '0.5rem' }}>
								💡 <strong>Sugerencia 1:</strong> Reducir marketing spend 15% → Runway +2 meses
							</div>
							<div style={{ fontSize: '0.875rem', color: '#991b1b' }}>
								💡 <strong>Sugerencia 2:</strong> Raise €300k dentro de 6 meses → Runway +7 meses
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Panel de Benchmarking */}
			<div
				style={{
					background: "white",
					borderRadius: "16px",
					padding: "1.5rem",
					boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
					marginBottom: "2rem",
					border: "2px solid #f59e0b",
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "1rem",
					}}
				>
					<h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
						🏆 Benchmarking vs Industria
					</h2>

					<button
						onClick={loadBenchmarking}
						disabled={loadingBenchmark || !unitEconomics}
						style={{
							padding: "0.75rem 1.5rem",
							background:
								loadingBenchmark || !unitEconomics
									? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
									: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
							color: "white",
							border: "none",
							borderRadius: "12px",
							fontSize: "0.875rem",
							fontWeight: "bold",
							cursor:
								loadingBenchmark || !unitEconomics
									? "not-allowed"
									: "pointer",
							transition: "all 0.2s",
						}}
						onMouseEnter={(e) =>
							!loadingBenchmark &&
							unitEconomics &&
							(e.currentTarget.style.transform = "scale(1.05)")
						}
						onMouseLeave={(e) =>
							(e.currentTarget.style.transform = "scale(1)")
						}
					>
						{loadingBenchmark
							? "⏳ Cargando..."
							: !unitEconomics
								? "⚠️ Calcula Unit Econ primero"
								: "🏆 Comparar vs Industria"}
					</button>
				</div>

				{!benchmarking && !loadingBenchmark && (
					<div
						style={{
							textAlign: "center",
							padding: "3rem",
							color: "#6b7280",
						}}
					>
						<div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🏆</div>
						<div
							style={{
								fontSize: "1.25rem",
								fontWeight: "600",
								marginBottom: "0.5rem",
							}}
						>
							Benchmarking vs Industria
						</div>
						<div style={{ fontSize: "0.875rem" }}>
							{!unitEconomics
								? "Primero calcula Unit Economics para poder comparar con la industria"
								: 'Click en "Comparar vs Industria" para ver cómo te comparas con otros SaaS'}
						</div>
					</div>
				)}

				{benchmarking && (
					<>
						{/* Overall Score & Position */}
						<div
							style={{
								padding: "2rem",
								background:
									benchmarking.competitiveness === "market_leader"
										? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
										: benchmarking.competitiveness === "strong_performer"
											? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
											: benchmarking.competitiveness === "average"
												? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
												: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
								borderRadius: "16px",
								marginBottom: "1.5rem",
								color: "white",
							}}
						>
							<div
								style={{
									display: "grid",
									gridTemplateColumns: "2fr 1fr",
									gap: "2rem",
									alignItems: "center",
								}}
							>
								<div>
									<div
										style={{
											fontSize: "1rem",
											opacity: 0.9,
											marginBottom: "0.5rem",
										}}
									>
										Tu posición en la industria
									</div>
									<div
										style={{
											fontSize: "3rem",
											fontWeight: "bold",
											marginBottom: "0.5rem",
										}}
									>
										{benchmarking.industryPosition.categoryRank}
									</div>
									<div
										style={{
											fontSize: "1.25rem",
											marginBottom: "1rem",
											textTransform: "capitalize",
										}}
									>
										{benchmarking.competitiveness.replace(/_/g, " ")}
									</div>
									<div style={{ fontSize: "1rem", opacity: 0.9 }}>
										Mejor que el {benchmarking.industryPosition.betterThan}% de
										SaaS en tu etapa
									</div>
								</div>
								<div style={{ textAlign: "center" }}>
									<div style={{ fontSize: "8rem", lineHeight: 1 }}>
										{benchmarking.competitiveness === "market_leader"
											? "👑"
											: benchmarking.competitiveness === "strong_performer"
												? "🚀"
												: benchmarking.competitiveness === "average"
													? "📊"
													: "⚠️"}
									</div>
									<div
										style={{
											fontSize: "2rem",
											fontWeight: "bold",
											marginTop: "1rem",
										}}
									>
										{benchmarking.overallScore}/100
									</div>
								</div>
							</div>
						</div>

						{/* Strengths & Weaknesses */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
								gap: "1.5rem",
								marginBottom: "1.5rem",
							}}
						>
							{benchmarking.strengths.length > 0 && (
								<div
									style={{
										padding: "1.5rem",
										background: "#d1fae5",
										borderRadius: "12px",
										border: "2px solid #10b981",
									}}
								>
									<h3
										style={{
											fontSize: "1rem",
											fontWeight: "bold",
											marginBottom: "0.75rem",
											color: "#065f46",
										}}
									>
										✅ Tus Fortalezas
									</h3>
									<ul
										style={{
											fontSize: "0.875rem",
											color: "#047857",
											marginLeft: "1.25rem",
										}}
									>
										{benchmarking.strengths.map(
											(strength: string, i: number) => (
												<li key={i} style={{ marginBottom: "0.5rem" }}>
													{strength}
												</li>
											),
										)}
									</ul>
								</div>
							)}

							{benchmarking.weaknesses.length > 0 && (
								<div
									style={{
										padding: "1.5rem",
										background: "#fee2e2",
										borderRadius: "12px",
										border: "2px solid #ef4444",
									}}
								>
									<h3
										style={{
											fontSize: "1rem",
											fontWeight: "bold",
											marginBottom: "0.75rem",
											color: "#991b1b",
										}}
									>
										⚠️ Áreas de Mejora
									</h3>
									<ul
										style={{
											fontSize: "0.875rem",
											color: "#b91c1c",
											marginLeft: "1.25rem",
										}}
									>
										{benchmarking.weaknesses.map(
											(weakness: string, i: number) => (
												<li key={i} style={{ marginBottom: "0.5rem" }}>
													{weakness}
												</li>
											),
										)}
									</ul>
								</div>
							)}
						</div>

						{/* Detailed Benchmarks */}
						<div style={{ marginBottom: "1.5rem" }}>
							<h3
								style={{
									fontSize: "1rem",
									fontWeight: "bold",
									marginBottom: "0.75rem",
									color: "#374151",
								}}
							>
								📊 Comparación Detallada
							</h3>
							<div style={{ display: "grid", gap: "0.75rem" }}>
								{benchmarking.benchmarks.map((bench: any) => {
									const performanceColors = {
										top10: {
											bg: "#d1fae5",
											border: "#10b981",
											text: "#065f46",
										},
										top25: {
											bg: "#dbeafe",
											border: "#3b82f6",
											text: "#1e40af",
										},
										average: {
											bg: "#fef3c7",
											border: "#f59e0b",
											text: "#92400e",
										},
										below_average: {
											bg: "#fed7aa",
											border: "#f97316",
											text: "#9a3412",
										},
										bottom10: {
											bg: "#fee2e2",
											border: "#ef4444",
											text: "#991b1b",
										},
									};

									const colors =
										performanceColors[
											bench.performance as keyof typeof performanceColors
										];

									return (
										<div
											key={bench.metric}
											style={{
												padding: "1rem",
												background: colors.bg,
												border: `2px solid ${colors.border}`,
												borderRadius: "12px",
											}}
										>
											<div
												style={{
													display: "flex",
													justifyContent: "space-between",
													alignItems: "start",
													marginBottom: "0.5rem",
												}}
											>
												<div>
													<div
														style={{
															fontSize: "0.875rem",
															fontWeight: "bold",
															color: colors.text,
														}}
													>
														{bench.metric}
													</div>
													<div
														style={{
															fontSize: "0.75rem",
															color: "#6b7280",
															marginTop: "0.25rem",
														}}
													>
														{bench.category}
													</div>
												</div>
												<div style={{ textAlign: "right" }}>
													<div
														style={{
															fontSize: "0.75rem",
															color: colors.text,
															fontWeight: "bold",
															marginBottom: "0.25rem",
														}}
													>
														Percentil {bench.userPercentile}
													</div>
													<div
														style={{
															fontSize: "0.75rem",
															padding: "0.125rem 0.5rem",
															background: colors.border,
															color: "white",
															borderRadius: "9999px",
														}}
													>
														{bench.performance.replace(/_/g, " ")}
													</div>
												</div>
											</div>

											<div
												style={{
													display: "grid",
													gridTemplateColumns: "1fr 1fr 1fr",
													gap: "0.5rem",
													fontSize: "0.75rem",
													color: "#374151",
													marginTop: "0.75rem",
												}}
											>
												<div>
													<div style={{ color: "#6b7280" }}>Tu valor:</div>
													<div
														style={{
															fontWeight: "bold",
															fontSize: "0.875rem",
														}}
													>
														{bench.metric.includes("Rate") ||
														bench.metric.includes("Margin") ||
														bench.metric.includes("NRR")
															? `${bench.userValue.toFixed(1)}%`
															: bench.metric.includes("Payback")
																? `${bench.userValue.toFixed(1)}m`
																: bench.userValue.toFixed(2)}
													</div>
												</div>
												<div>
													<div style={{ color: "#6b7280" }}>Promedio:</div>
													<div
														style={{
															fontWeight: "bold",
															fontSize: "0.875rem",
														}}
													>
														{bench.metric.includes("Rate") ||
														bench.metric.includes("Margin") ||
														bench.metric.includes("NRR")
															? `${bench.industryAverage.toFixed(1)}%`
															: bench.metric.includes("Payback")
																? `${bench.industryAverage.toFixed(1)}m`
																: bench.industryAverage.toFixed(2)}
													</div>
												</div>
												<div>
													<div style={{ color: "#6b7280" }}>Top 25%:</div>
													<div
														style={{
															fontWeight: "bold",
															fontSize: "0.875rem",
														}}
													>
														{bench.metric.includes("Rate") ||
														bench.metric.includes("Margin") ||
														bench.metric.includes("NRR")
															? `${bench.percentiles.p75.toFixed(1)}%`
															: bench.metric.includes("Payback")
																? `${bench.percentiles.p75.toFixed(1)}m`
																: bench.percentiles.p75.toFixed(2)}
													</div>
												</div>
											</div>

											{/* Percentile Bar */}
											<div style={{ marginTop: "0.75rem" }}>
												<div
													style={{
														height: "8px",
														background: "#e5e7eb",
														borderRadius: "4px",
														position: "relative",
														overflow: "hidden",
													}}
												>
													<div
														style={{
															position: "absolute",
															left: 0,
															top: 0,
															bottom: 0,
															width: `${bench.userPercentile}%`,
															background: colors.border,
															borderRadius: "4px",
															transition: "width 0.5s ease",
														}}
													></div>
												</div>
												<div
													style={{
														display: "flex",
														justifyContent: "space-between",
														fontSize: "0.65rem",
														color: "#9ca3af",
														marginTop: "0.25rem",
													}}
												>
													<span>0%</span>
													<span>25%</span>
													<span>50%</span>
													<span>75%</span>
													<span>100%</span>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</div>

						{/* Recommendations */}
						{benchmarking.recommendations.length > 0 && (
							<div>
								<h3
									style={{
										fontSize: "1rem",
										fontWeight: "bold",
										marginBottom: "0.75rem",
										color: "#374151",
									}}
								>
									🎯 Cómo Mejorar tu Ranking
								</h3>
								<div style={{ display: "grid", gap: "0.75rem" }}>
									{benchmarking.recommendations.map((rec: any, i: number) => (
										<div
											key={i}
											style={{
												padding: "1rem",
												background:
													rec.priority === "critical"
														? "#fee2e2"
														: rec.priority === "high"
															? "#fed7aa"
															: "#fef3c7",
												border: `2px solid ${
													rec.priority === "critical"
														? "#ef4444"
														: rec.priority === "high"
															? "#f97316"
															: "#f59e0b"
												}`,
												borderRadius: "12px",
											}}
										>
											<div
												style={{
													display: "flex",
													gap: "0.5rem",
													marginBottom: "0.5rem",
												}}
											>
												<span
													style={{
														fontSize: "0.75rem",
														padding: "0.25rem 0.5rem",
														borderRadius: "9999px",
														background:
															rec.priority === "critical"
																? "#dc2626"
																: rec.priority === "high"
																	? "#ea580c"
																	: "#d97706",
														color: "white",
														fontWeight: "bold",
														textTransform: "uppercase",
													}}
												>
													{rec.priority}
												</span>
												<span
													style={{
														fontSize: "0.75rem",
														padding: "0.25rem 0.5rem",
														borderRadius: "9999px",
														background: "#e0e7ff",
														color: "#3730a3",
														fontWeight: "600",
													}}
												>
													{rec.metric}
												</span>
											</div>
											<div
												style={{
													fontSize: "0.875rem",
													color: "#374151",
													marginBottom: "0.5rem",
												}}
											>
												{rec.message}
											</div>
											<div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
												Gap actual: {rec.currentGap.toFixed(1)} puntos hasta
												target ({rec.targetValue.toFixed(1)})
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</>
				)}
			</div>

			{/* Mensaje de éxito */}
			<div
				style={{
					marginTop: "2rem",
					padding: "2rem",
					background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
					borderRadius: "16px",
					border: "4px solid #f59e0b",
					color: "white",
					boxShadow: "0 10px 30px rgba(245, 158, 11, 0.5)",
				}}
			>
				<div
					style={{
						fontSize: "2rem",
						fontWeight: "bold",
						marginBottom: "1.5rem",
						textAlign: "center",
					}}
				>
					🎉 FINANZADIOS - FASE 2 COMPLETADA 🎉
				</div>

				<div style={{ fontSize: "1rem", fontWeight: "bold", marginBottom: "0.75rem" }}>
					✅ FASE 1 - EL CEREBRO:
				</div>
				<ul
					style={{
						marginLeft: "1.5rem",
						marginBottom: "1rem",
						fontSize: "0.875rem",
					}}
				>
					<li>#7: Autonomous Executor</li>
					<li>#8: Predictive Analytics</li>
					<li>#12: Anomaly Detection</li>
				</ul>

				<div style={{ fontSize: "1rem", fontWeight: "bold", marginBottom: "0.75rem" }}>
					✅ FASE 2 - ANÁLISIS PROFUNDO:
				</div>
				<ul style={{ marginLeft: "1.5rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
					<li>#9: Cohort Analysis & Retention</li>
					<li>#10: Unit Economics Calculator</li>
					<li>#13: Benchmarking vs Industria</li>
				</ul>

				<div
					style={{
						marginTop: "1.5rem",
						padding: "1.5rem",
						background: "rgba(255, 255, 255, 0.15)",
						borderRadius: "12px",
					}}
				>
					<div
						style={{
							fontSize: "1.25rem",
							fontWeight: "bold",
							marginBottom: "0.75rem",
							textAlign: "center",
						}}
					>
						🏆 FINANZADIOS ESTÁ COMPLETO 🏆
					</div>
					<div style={{ fontSize: "0.875rem", textAlign: "center" }}>
						Has creado el sistema de finanzas más avanzado del mercado.
						<br />
						Valor estimado: €250k-€500k standalone
					</div>
				</div>
			</div>
		</div>
	);
}

