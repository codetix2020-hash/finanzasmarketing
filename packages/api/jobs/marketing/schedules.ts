/**
 * Schedule configuration for MarketingOS jobs
 * Use with Trigger.dev or cron jobs
 */

export const MARKETING_SCHEDULES = {
  // Main orchestration - every 6 hours
  orchestration: {
    name: 'marketing-orchestration',
    cron: '0 */6 * * *', // Every 6 hours
    description: 'Orchestrates marketing strategy for all products'
  },
  
  // Job processing - every 5 minutes
  jobProcessor: {
    name: 'marketing-job-processor',
    cron: '*/5 * * * *', // Every 5 minutes
    description: 'Processes content, image, email jobs, etc.'
  },
  
  // Guard checks - every 30 minutes
  guardsCheck: {
    name: 'marketing-guards-check',
    cron: '*/30 * * * *', // Every 30 minutes
    description: 'Checks financial, reputational, and legal guards'
  },
  
  // Competitor analysis - weekly
  competitorAnalysis: {
    name: 'marketing-competitor-analysis',
    cron: '0 8 * * 1', // Monday at 8:00
    description: 'Analyzes competitors and updates insights'
  },
  
  // Weekly report - Sundays
  weeklyReport: {
    name: 'marketing-weekly-report',
    cron: '0 18 * * 0', // Sunday at 18:00
    description: 'Generates weekly marketing report'
  },
  
  // Ad metrics sync - every hour
  adMetricsSync: {
    name: 'marketing-ad-metrics-sync',
    cron: '0 * * * *', // Every hour
    description: 'Syncs Facebook/Google Ads metrics'
  }
}

// Helper to run jobs manually
export async function runScheduledJob(jobName: keyof typeof MARKETING_SCHEDULES) {
  const schedule = MARKETING_SCHEDULES[jobName]
  console.log(`🕐 Running job: ${schedule.name}`)
  console.log(`   ${schedule.description}`)
  
  switch (jobName) {
    case 'orchestration':
      const { runOrchestrationCycle } = await import('./orchestration-cycle')
      return runOrchestrationCycle()
      
    case 'jobProcessor':
      const { processContentJobs } = await import('./content-job-processor')
      return processContentJobs()
      
    case 'guardsCheck':
      const { guardsCheckJob } = await import('./guards-check')
      return guardsCheckJob()
      
    default:
      console.log(`⚠️ Job ${jobName} not implemented yet`)
      return { message: `Job ${jobName} implementation pending` }
  }
}

// Export for Trigger.dev usage
export default MARKETING_SCHEDULES

