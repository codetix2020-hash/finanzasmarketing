import { db } from './prisma/client';
import { subMonths, format } from 'date-fns';

async function seedFinanceData() {
  console.log('🌱 Seeding finance data...');

  // Buscar primera organización para usar como demo
  const org = await db.organization.findFirst();
  
  if (!org) {
    console.error('❌ No organization found. Create one first.');
    return;
  }

  console.log(`✅ Using organization: ${org.name}`);

  // Limpiar datos existentes de finanzas (opcional)
  await db.transaction.deleteMany({ where: { organizationId: org.id } });
  await db.financialMetric.deleteMany({ where: { organizationId: org.id } });
  await db.prediction.deleteMany({ where: { organizationId: org.id } });
  await db.anomaly.deleteMany({ where: { organizationId: org.id } });
  await db.financeAction.deleteMany({ where: { organizationId: org.id } });

  // Crear transacciones de los últimos 12 meses
  const customers = [
    { id: 'cust_001', name: 'TechCorp Inc', plan: 'Enterprise', mrr: 450 },
    { id: 'cust_002', name: 'StartupXYZ', plan: 'Pro', mrr: 149 },
    { id: 'cust_003', name: 'DesignCo', plan: 'Pro', mrr: 149 },
    { id: 'cust_004', name: 'DevShop', plan: 'Starter', mrr: 49 },
    { id: 'cust_005', name: 'MarketingAgency', plan: 'Pro', mrr: 149 },
    { id: 'cust_006', name: 'ConsultingGroup', plan: 'Enterprise', mrr: 499 },
    { id: 'cust_007', name: 'SoftwareStudio', plan: 'Pro', mrr: 149 },
    { id: 'cust_008', name: 'CreativeTeam', plan: 'Starter', mrr: 49 },
    { id: 'cust_009', name: 'DataAnalytics', plan: 'Enterprise', mrr: 450 },
    { id: 'cust_010', name: 'CloudServices', plan: 'Pro', mrr: 149 },
  ];

  console.log('📊 Creating transactions...');

  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    const date = subMonths(new Date(), monthsAgo);
    
    // Subscriptions (income)
    for (const customer of customers) {
      // Solo algunos clientes empiezan desde el mes 0
      // Simular crecimiento
      const customerAge = 11 - monthsAgo;
      const customerIndex = customers.indexOf(customer);
      
      if (customerAge >= customerIndex) {
        await db.transaction.create({
          data: {
            organizationId: org.id,
            amount: customer.mrr,
            currency: 'EUR',
            type: 'income',
            category: 'subscription',
            description: `Monthly subscription - ${customer.plan}`,
            customerId: customer.id,
            customerName: customer.name,
            date: date,
            source: 'stripe',
          },
        });
      }
    }

    // Costos (expenses) - más realistas
    const expenses = [
      { category: 'hosting', amount: 500, description: 'Railway hosting' },
      { category: 'api', amount: 300, description: 'Anthropic API' },
      { category: 'marketing', amount: 800, description: 'Google Ads' },
      { category: 'tools', amount: 200, description: 'Software tools' },
    ];

    for (const expense of expenses) {
      await db.transaction.create({
        data: {
          organizationId: org.id,
          amount: expense.amount,
          currency: 'EUR',
          type: 'expense',
          category: expense.category,
          description: expense.description,
          date: date,
          source: 'manual',
        },
      });
    }

    // Algunos one-time payments (aleatorios)
    if (Math.random() > 0.7) {
      await db.transaction.create({
        data: {
          organizationId: org.id,
          amount: Math.floor(Math.random() * 500) + 100,
          currency: 'EUR',
          type: 'income',
          category: 'one-time',
          description: 'Consulting service',
          date: date,
          source: 'stripe',
        },
      });
    }
  }

  console.log('✅ Transactions created');

  // Calcular métricas para cada mes
  console.log('📈 Calculating metrics...');

  const { MetricsCalculator } = await import('../../api/modules/finance/services/metrics-calculator');
  const calculator = new MetricsCalculator();
  
  await calculator.saveMetrics(org.id);

  console.log('✅ Metrics calculated');

  // Crear algunas acciones de ejemplo
  console.log('🤖 Creating sample actions...');

  await db.financeAction.createMany({
    data: [
      {
        organizationId: org.id,
        type: 'alert',
        status: 'executed',
        title: 'MRR target achieved',
        description: 'Monthly recurring revenue exceeded €10k target',
        severity: 'info',
        triggeredBy: 'system',
        executedAt: subMonths(new Date(), 1),
      },
      {
        organizationId: org.id,
        type: 'email',
        status: 'executed',
        title: 'Churn risk detected',
        description: 'Customer StartupXYZ showing decreased usage',
        severity: 'warning',
        triggeredBy: 'system',
        executedAt: subMonths(new Date(), 0),
      },
      {
        organizationId: org.id,
        type: 'slack',
        status: 'pending',
        title: 'Review pricing strategy',
        description: 'LTV/CAC ratio below optimal range',
        severity: 'warning',
        triggeredBy: 'agent',
      },
    ],
  });

  console.log('✅ Sample actions created');

  console.log('🎉 Finance seed data completed!');
  console.log(`   Organization: ${org.name}`);
  console.log(`   Transactions: ${customers.length * 12 + 48} created`);
  console.log(`   Metrics: Calculated for last 12 months`);
  console.log(`   Actions: 3 sample actions`);
}

seedFinanceData()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

