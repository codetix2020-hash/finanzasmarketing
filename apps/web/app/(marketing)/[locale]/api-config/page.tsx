'use client';

import { useState } from 'react';

export default function ApiConfigPage() {
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  const testSlack = async () => {
    setTesting({ ...testing, slack: true });
    try {
      const response = await fetch('/api/rpc/integration.testSlack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const result = await response.json();
      setTestResults({ ...testResults, slack: result });
      if (result.success) {
        alert('✅ Slack webhook funcionando! Verifica tu canal de Slack.');
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Failed to test Slack');
    } finally {
      setTesting({ ...testing, slack: false });
    }
  };

  const testResend = async () => {
    setTesting({ ...testing, resend: true });
    try {
      const response = await fetch('/api/rpc/integration.testResend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const result = await response.json();
      setTestResults({ ...testResults, resend: result });
      if (result.success) {
        alert('✅ Email enviado! Verifica tu bandeja.');
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Failed to test Email');
    } finally {
      setTesting({ ...testing, resend: false });
    }
  };

  const testStripe = async () => {
    setTesting({ ...testing, stripe: true });
    try {
      const response = await fetch('/api/rpc/integration.testStripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const result = await response.json();
      setTestResults({ ...testResults, stripe: result });
      if (result.success) {
        alert('✅ Stripe conectado correctamente!');
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Failed to test Stripe');
    } finally {
      setTesting({ ...testing, stripe: false });
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          🔌 API Configuration
        </h1>
        <p style={{ fontSize: '1rem', color: '#6b7280' }}>
          Prueba las APIs configuradas en .env.local
        </p>
      </div>

      {/* Slack */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '2rem', marginRight: '1rem' }}>💬</div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Slack Webhooks</h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Variable: SLACK_WEBHOOK_URL</p>
          </div>
        </div>
        <button 
          onClick={testSlack} 
          disabled={testing.slack}
          style={{ 
            padding: '0.75rem 1.5rem', 
            background: testing.slack ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            fontSize: '0.875rem', 
            fontWeight: 'bold', 
            cursor: testing.slack ? 'not-allowed' : 'pointer',
          }}
        >
          {testing.slack ? '⏳ Probando...' : '🧪 Probar Slack'}
        </button>
        {testResults.slack && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            background: testResults.slack.success ? '#d1fae5' : '#fee2e2', 
            border: `2px solid ${testResults.slack.success ? '#10b981' : '#ef4444'}`,
            borderRadius: '8px', 
            fontSize: '0.875rem',
          }}>
            {testResults.slack.success ? '✅' : '❌'} {testResults.slack.message}
          </div>
        )}
      </div>

      {/* Resend */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '2rem', marginRight: '1rem' }}>📧</div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Resend Email</h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Variables: RESEND_API_KEY, FINANCE_ALERT_EMAIL</p>
          </div>
        </div>
        <button 
          onClick={testResend} 
          disabled={testing.resend}
          style={{ 
            padding: '0.75rem 1.5rem', 
            background: testing.resend ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            fontSize: '0.875rem', 
            fontWeight: 'bold', 
            cursor: testing.resend ? 'not-allowed' : 'pointer',
          }}
        >
          {testing.resend ? '⏳ Probando...' : '🧪 Probar Email'}
        </button>
        {testResults.resend && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            background: testResults.resend.success ? '#d1fae5' : '#fee2e2', 
            border: `2px solid ${testResults.resend.success ? '#10b981' : '#ef4444'}`,
            borderRadius: '8px', 
            fontSize: '0.875rem',
          }}>
            {testResults.resend.success ? '✅' : '❌'} {testResults.resend.message}
          </div>
        )}
      </div>

      {/* Stripe */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '2rem', marginRight: '1rem' }}>💳</div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Stripe</h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Variable: STRIPE_SECRET_KEY</p>
          </div>
        </div>
        <button 
          onClick={testStripe} 
          disabled={testing.stripe}
          style={{ 
            padding: '0.75rem 1.5rem', 
            background: testing.stripe ? '#9ca3af' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            fontSize: '0.875rem', 
            fontWeight: 'bold', 
            cursor: testing.stripe ? 'not-allowed' : 'pointer',
          }}
        >
          {testing.stripe ? '⏳ Probando...' : '🧪 Probar Stripe'}
        </button>
        {testResults.stripe && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            background: testResults.stripe.success ? '#d1fae5' : '#fee2e2', 
            border: `2px solid ${testResults.stripe.success ? '#10b981' : '#ef4444'}`,
            borderRadius: '8px', 
            fontSize: '0.875rem',
          }}>
            {testResults.stripe.success ? '✅' : '❌'} {testResults.stripe.message}
          </div>
        )}
      </div>

      {/* Success Message */}
      <div style={{ marginTop: '2rem', padding: '2rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '16px', color: 'white', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔌</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          APIS CONFIGURADAS
        </div>
        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
          Prueba cada API con los botones de arriba
        </div>
      </div>
    </div>
  );
}
