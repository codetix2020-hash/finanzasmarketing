'use client';

import { useState, useEffect } from 'react';

export default function IntegratedDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [budgetDecisions, setBudgetDecisions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzingBudget, setAnalyzingBudget] = useState(false);
  const [autoExecuteMode, setAutoExecuteMode] = useState(false);

  const organizationId = 'org_demo_123';

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/rpc/integration.getIntegrationDashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });

      if (response.ok) {
        const result = await response.json();
        setDashboardData(result);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeBudget = async () => {
    setAnalyzingBudget(true);
    try {
      const response = await fetch('/api/rpc/integration.analyzeBudget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          organizationId, 
          autoExecute: autoExecuteMode,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setBudgetDecisions(result);
        if (autoExecuteMode) {
          alert('✅ Budget decisions executed automatically!');
          loadDashboard();
        }
      }
    } catch (error) {
      console.error('Error analyzing budget:', error);
      alert('Error analyzing budget. Verifica la consola.');
    } finally {
      setAnalyzingBudget(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>⏳</div>
        <div>Cargando Integrated Dashboard...</div>
      </div>
    );
  }

  const metrics = dashboardData?.aggregateMetrics || {};

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          🔗 Integrated Dashboard
        </h1>
        <p style={{ fontSize: '1rem', color: '#6b7280' }}>
          Marketing + Finance unified - El sistema más poderoso del mundo
        </p>
      </div>

      {/* Control Panel */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button 
          onClick={loadDashboard} 
          disabled={loading}
          style={{ 
            padding: '0.75rem 1.5rem', 
            background: loading ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white', 
            border: 'none', 
            borderRadius: '12px', 
            fontSize: '0.875rem', 
            fontWeight: 'bold', 
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '⏳ Loading...' : '🔄 Reload Dashboard'}
        </button>

        <button 
          onClick={analyzeBudget} 
          disabled={analyzingBudget || !dashboardData}
          style={{ 
            padding: '0.75rem 1.5rem', 
            background: analyzingBudget || !dashboardData ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: 'white', 
            border: 'none', 
            borderRadius: '12px', 
            fontSize: '0.875rem', 
            fontWeight: 'bold', 
            cursor: analyzingBudget || !dashboardData ? 'not-allowed' : 'pointer',
          }}
        >
          {analyzingBudget ? '⏳ Analyzing...' : '🤖 Finance Agent: Analyze Budget'}
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', color: '#374151' }}>Auto-Execute:</label>
          <button 
            onClick={() => setAutoExecuteMode(!autoExecuteMode)}
            style={{ 
              padding: '0.5rem 1rem', 
              background: autoExecuteMode ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '0.75rem', 
              fontWeight: 'bold', 
              cursor: 'pointer',
            }}
          >
            {autoExecuteMode ? '⚡ AUTO' : '👤 MANUAL'}
          </button>
        </div>
      </div>

      {!dashboardData && !loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
          <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🔗</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>
            Click "Reload Dashboard" to load integration data
          </div>
        </div>
      )}

      {dashboardData && (
        <>
          {/* Aggregate Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '16px', color: 'white' }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Total Revenue</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>€{metrics.totalRevenue?.toLocaleString() || '0'}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem' }}>From all campaigns</div>
            </div>

            <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', borderRadius: '16px', color: 'white' }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Total Spend</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>€{metrics.totalSpend?.toLocaleString() || '0'}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem' }}>Across all channels</div>
            </div>

            <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '16px', color: 'white' }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Overall ROI</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{metrics.totalROI?.toFixed(1) || '0'}%</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem' }}>Marketing efficiency</div>
            </div>

            <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', borderRadius: '16px', color: 'white' }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Active Campaigns</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{metrics.activeCampaigns || '0'}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem' }}>{metrics.totalConversions || 0} conversions</div>
            </div>
          </div>

          {/* Budget Decisions */}
          {budgetDecisions && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', border: '2px solid #8b5cf6' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                🤖 Finance Agent Decisions
              </h2>
              <div style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '12px', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: '600', marginBottom: '0.5rem' }}>Executive Summary</div>
                <div style={{ fontSize: '0.875rem', color: '#1e3a8a' }}>
                  {budgetDecisions.summary || 'Análisis completado'}
                </div>
              </div>
              {budgetDecisions.campaignDecisions && budgetDecisions.campaignDecisions.length > 0 && (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {budgetDecisions.campaignDecisions.map((decision: any, i: number) => (
                    <div key={i} style={{ padding: '1rem', background: '#f9fafb', border: '2px solid #e5e7eb', borderRadius: '12px' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {decision.campaignName || decision.campaignId}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {decision.action} - {decision.reasoning}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Success Message */}
      <div style={{ marginTop: '2rem', padding: '2rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '16px', color: 'white', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎉</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          INTEGRACIÓN COMPLETADA
        </div>
        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
          PilotSocials + FinanceOS conectados
        </div>
      </div>
    </div>
  );
}
