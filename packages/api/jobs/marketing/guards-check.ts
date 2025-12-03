import { prisma } from '@repo/database'
import { runAllGuards } from '../../modules/marketing/services/guard-service'

// Ejecutar cada 30 minutos
// Este job puede ser llamado desde un cron externo o sistema de scheduling
export async function guardsCheckJob() {
  console.log('🛡️ Ejecutando chequeo de guardias programado...')

  // Obtener organizaciones con marketing activo
  const organizations = await prisma.organization.findMany({
    where: {
      saasProducts: {
        some: {
          marketingEnabled: true
        }
      }
    },
    select: { id: true, name: true }
  })

  console.log(`📋 Organizaciones a verificar: ${organizations.length}`)

  const results = []

  for (const org of organizations) {
    try {
      const result = await runAllGuards(org.id)
      results.push({
        organizationId: org.id,
        name: org.name,
        ...result
      })
    } catch (error) {
      console.error(`Error en org ${org.id}:`, error)
      results.push({
        organizationId: org.id,
        name: org.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const totalAlerts = results.reduce((sum, r) => sum + (r.totalAlerts || 0), 0)

  console.log(`✅ Guardias ejecutadas. Total alertas: ${totalAlerts}`)

  return {
    organizationsChecked: organizations.length,
    totalAlerts,
    results
  }
}

