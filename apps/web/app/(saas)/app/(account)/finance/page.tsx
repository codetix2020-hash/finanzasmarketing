'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Overview {
  mrr: number;
  arr: number;
  revenue30d: number;
  revenue90d: number;
  profit: number;
  roi: number;
  churnRate: number;
  growthRate: number;
  period: string;
}

interface Prediction {
  period: string;
  expected: number;
  best?: number;
  worst?: number;
  confidence: number;
}

interface Anomaly {
  id: string;
  type: string;
  severity: string;
  metric: string;
  deviation: number;
  cause: string | null;
  recommendation: string | null;
  detectedAt: string;
}

interface Cohort {
  cohort: string;
  m0: number;
  m1: number | null;
  m2: number | null;
  m3: number | null;
  m4: number | null;
  m5: number | null;
  m6: number | null;
}

interface UnitEconomics {
  ltv: number;
  cac: number;
  ltvCacRatio: number;
  averageRevenue: number;
  paybackPeriod: number;
}

export default function FinancePage() {
  const params = useParams();
  const organizationId = params?.organizationId as string || params?.organizationSlug as string;
  
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [unitEconomics, setUnitEconomics] = useState<UnitEconomics | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    if (organizationId) {
      fetchAllData();
    }
  }, [organizationId]);

  const fetchAllData = async () => {
    try {
      // Overview
      const overviewRes = await fetch(`/api/finance/overview?organizationId=${organizationId}`);
      const overviewData = await overviewRes.json();
      setOverview(overviewData);

      // Unit Economics
      const ueRes = await fetch(`/api/finance/unit-economics?organizationId=${organizationId}`);
      const ueData = await ueRes.json();
      setUnitEconomics(ueData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictions = async () => {
    try {
      const res = await fetch('/api/finance/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, monthsAhead: 6 }),
      });
      const data = await res.json();
      setPredictions(data.predictions || []);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const fetchAnomalies = async () => {
    try {
      const res = await fetch('/api/finance/detect-anomalies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });
      const data = await res.json();
      setAnomalies(data.anomalies || []);
    } catch (error) {
      console.error('Error fetching anomalies:', error);
    }
  };

  const fetchCohorts = async () => {
    try {
      const res = await fetch(`/api/finance/cohort-analysis?organizationId=${organizationId}`);
      const data = await res.json();
      setCohorts(data.cohorts || []);
    } catch (error) {
      console.error('Error fetching cohorts:', error);
    }
  };

  const toggleSection = async (section: string) => {
    const newExpanded = expandedSection === section ? null : section;
    setExpandedSection(newExpanded);

    // Fetch data when expanding
    if (newExpanded === 'predictive' && predictions.length === 0) {
      await fetchPredictions();
    } else if (newExpanded === 'anomalies' && anomalies.length === 0) {
      await fetchAnomalies();
    } else if (newExpanded === 'cohorts' && cohorts.length === 0) {
      await fetchCohorts();
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem' }}>⏳</div>
        <div>Cargando métricas financieras...</div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem' }}>⚠️</div>
        <div>No se pudieron cargar las métricas</div>
        <button 
          onClick={fetchAllData}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem', background: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
          🔮 FinanzaDIOS Dashboard
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
          CFO Autónomo con IA - Datos Reales • Periodo: {overview.period}
        </p>
      </div>

      {/* Métricas principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <MetricCard title="MRR Total" value={`€${overview.mrr.toLocaleString()}`} color="#6366f1" />
        <MetricCard title="ARR" value={`€${overview.arr.toLocaleString()}`} color="#ec4899" />
        <MetricCard title="Revenue (30d)" value={`€${overview.revenue30d.toLocaleString()}`} color="#10b981" />
        <MetricCard title="ROI" value={`${overview.roi.toFixed(1)}%`} color="#f59e0b" />
      </div>

      {/* Unit Economics */}
      {unitEconomics && (
        <div style={{ marginBottom: '3rem', padding: '2rem', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
            💰 Unit Economics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>LTV</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>€{unitEconomics.ltv}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>CAC</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>€{unitEconomics.cac}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>LTV/CAC Ratio</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6366f1' }}>{unitEconomics.ltvCacRatio}x</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Payback Period</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{unitEconomics.paybackPeriod} meses</div>
            </div>
          </div>
        </div>
      )}

      {/* Análisis Predictivo */}
      <Section
        title="📈 Análisis Predictivo (IA)"
        expanded={expandedSection === 'predictive'}
        onToggle={() => toggleSection('predictive')}
        gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
      >
        <div style={{ padding: '2rem' }}>
          {predictions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔮</div>
              <p style={{ color: '#6b7280' }}>Generando predicciones con IA...</p>
            </div>
          ) : (
            <div>
              <h4 style={{ marginBottom: '1rem' }}>Proyección MRR - Próximos 6 meses</h4>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {predictions.map((pred, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
                    <span style={{ fontWeight: '600' }}>{pred.period}</span>
                    <span>
                      Esperado: <strong>€{pred.expected.toLocaleString()}</strong>
                      {pred.best && ` • Mejor: €${pred.best.toLocaleString()}`}
                      {pred.worst && ` • Peor: €${pred.worst.toLocaleString()}`}
                    </span>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      Confianza: {(pred.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Detección de Anomalías */}
      <Section
        title="🚨 Detección de Anomalías (IA)"
        expanded={expandedSection === 'anomalies'}
        onToggle={() => toggleSection('anomalies')}
        gradient="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
      >
        <div style={{ padding: '2rem' }}>
          {anomalies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✅</div>
              <p style={{ color: '#10b981', fontWeight: '600' }}>No se detectaron anomalías</p>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Todas las métricas dentro del rango esperado</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {anomalies.map((anomaly) => (
                <div key={anomaly.id} style={{ padding: '1rem', background: '#fef2f2', border: '2px solid #ef4444', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '700', color: '#991b1b' }}>
                      {anomaly.severity === 'critical' ? '🔴' : anomaly.severity === 'high' ? '🟠' : '🟡'} {anomaly.type}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      Desviación: {anomaly.deviation.toFixed(1)}%
                    </span>
                  </div>
                  {anomaly.cause && (
                    <div style={{ fontSize: '0.875rem', color: '#991b1b', marginBottom: '0.25rem' }}>
                      <strong>Causa:</strong> {anomaly.cause}
                    </div>
                  )}
                  {anomaly.recommendation && (
                    <div style={{ fontSize: '0.875rem', color: '#065f46', background: '#d1fae5', padding: '0.5rem', borderRadius: '6px', marginTop: '0.5rem' }}>
                      <strong>Recomendación:</strong> {anomaly.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* Análisis de Cohortes */}
      <Section
        title="📊 Análisis de Cohortes"
        expanded={expandedSection === 'cohorts'}
        onToggle={() => toggleSection('cohorts')}
        gradient="linear-gradient(135deg, #a855f7 0%, #9333ea 100%)"
      >
        <div style={{ padding: '2rem' }}>
          {cohorts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
              <p style={{ color: '#6b7280' }}>Cargando análisis de cohortes...</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Cohorte</th>
                    <th style={{ padding: '1rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>M0</th>
                    <th style={{ padding: '1rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>M1</th>
                    <th style={{ padding: '1rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>M2</th>
                    <th style={{ padding: '1rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>M3</th>
                    <th style={{ padding: '1rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>M4</th>
                    <th style={{ padding: '1rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>M5</th>
                    <th style={{ padding: '1rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>M6</th>
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((cohort, idx) => (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                      <td style={{ padding: '1rem', border: '1px solid #e5e7eb', fontWeight: '600' }}>{cohort.cohort}</td>
                      <td style={{ padding: '1rem', textAlign: 'center', border: '1px solid #e5e7eb', background: '#dcfce7', fontWeight: '600' }}>100%</td>
                      <td style={{ padding: '1rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>{cohort.m1 ? `${cohort.m1}%` : '-'}</td>
                      <td style={{ padding: '1rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>{cohort.m2 ? `${cohort.m2}%` : '-'}</td>
                      <td style={{ padding: '1rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>{cohort.m3 ? `${cohort.m3}%` : '-'}</td>
                      <td style={{ padding: '1rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>{cohort.m4 ? `${cohort.m4}%` : '-'}</td>
                      <td style={{ padding: '1rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>{cohort.m5 ? `${cohort.m5}%` : '-'}</td>
                      <td style={{ padding: '1rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>{cohort.m6 ? `${cohort.m6}%` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Section>

      {/* Footer */}
      <div style={{ marginTop: '3rem', padding: '2rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', color: 'white', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Sistema Conectado a Datos Reales
        </h2>
        <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
          7 Endpoints API • IA Claude Sonnet • {cohorts.length} Cohortes • {anomalies.length} Anomalías
        </p>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div style={{ padding: '2rem', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '500' }}>
        {title}
      </div>
      <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color }}>
        {value}
      </div>
    </div>
  );
}

function Section({ 
  title, 
  expanded, 
  onToggle, 
  gradient, 
  children 
}: { 
  title: string; 
  expanded: boolean; 
  onToggle: () => void; 
  gradient: string; 
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '2rem', background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
      <div
        style={{
          padding: '1.5rem',
          background: gradient,
          color: 'white',
          cursor: 'pointer',
          transition: 'opacity 0.2s',
        }}
        onClick={onToggle}
        onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
        onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
            {title}
          </h2>
          <div style={{ fontSize: '1.5rem' }}>
            {expanded ? '▼' : '▶'}
          </div>
        </div>
      </div>
      {expanded && children}
    </div>
  );
}
