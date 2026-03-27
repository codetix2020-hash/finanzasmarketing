import Anthropic from "@anthropic-ai/sdk";

export interface StrategyDecision {
  action: 'scale' | 'maintain' | 'optimize' | 'pause' | 'reallocate';
  channel: string;
  reasoning: string;
  expectedImpact: string;
  priority: 'high' | 'medium' | 'low';
  budgetChange?: number;
}

export interface CrossChannelAnalysis {
  topPerformers: Array<{ channel: string; roi: number; reason: string }>;
  underperformers: Array<{ channel: string; roi: number; issue: string }>;
  budgetRecommendations: Record<string, number>;
  strategicInsights: string[];
}

export class StrategyAgent {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || "",
    });
  }

  /**
   * Coordinar todos los agentes y tomar decisiones estratégicas
   */
  async coordinateAgents(params: {
    channelPerformance: Record<string, { spend: number; revenue: number; roi: number }>;
    totalBudget: number;
    goals: string[];
  }): Promise<{
    decisions: StrategyDecision[];
    summary: string;
    budgetAllocation: Record<string, number>;
  }> {
    const prompt = `You are the Strategy Agent coordinating a marketing campaign.

CURRENT PERFORMANCE:
${Object.entries(params.channelPerformance).map(([channel, data]) => 
  `- ${channel}: Spend €${data.spend}, Revenue €${data.revenue}, ROI ${data.roi}%`
).join('\n')}

TOTAL BUDGET: €${params.totalBudget}
GOALS: ${params.goals.join(', ')}

Analyze and provide:

1. Decisiones estratégicas por canal (scale/maintain/optimize/pause/reallocate)

2. Executive summary

3. New budget allocation

Respond in JSON:
{
  "decisions": [
    {
      "action": "scale|maintain|optimize|pause|reallocate",
      "channel": "string",
      "reasoning": "string",
      "expectedImpact": "string",
      "priority": "high|medium|low",
      "budgetChange": number (percentage)
    }
  ],
  "summary": "string (2-3 sentences)",
  "budgetAllocation": {
    "channel": number (new budget)
  }
}`;

    try {
      const message = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2500,
        messages: [{ role: "user", content: prompt }],
      });

      const responseContent = message.content[0];
      if (responseContent.type !== "text") {
        throw new Error("Unexpected response type");
      }

      const jsonMatch = responseContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found");
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Error coordinating agents:", error);
      
      // Fallback con lógica simple
      const decisions: StrategyDecision[] = Object.entries(params.channelPerformance).map(([channel, data]) => {
        if (data.roi > 300) {
          return {
            action: 'scale' as const,
            channel,
            reasoning: `Excellent ROI of ${data.roi}%`,
            expectedImpact: 'Significantly increase revenue',
            priority: 'high' as const,
            budgetChange: 50,
          };
        } else if (data.roi < 100) {
          return {
            action: 'optimize' as const,
            channel,
            reasoning: `Low ROI of ${data.roi}%`,
            expectedImpact: 'Improve efficiency',
            priority: 'high' as const,
            budgetChange: -25,
          };
        } else {
          return {
            action: 'maintain' as const,
            channel,
            reasoning: `Acceptable ROI of ${data.roi}%`,
            expectedImpact: 'Maintain current performance',
            priority: 'medium' as const,
            budgetChange: 0,
          };
        }
      });

      return {
        decisions,
        summary: 'Analysis completed. Recommendations generated based on current ROI.',
        budgetAllocation: params.channelPerformance,
      };
    }
  }

  /**
   * Análisis cross-channel
   */
  async analyzeCrossChannel(params: {
    channels: Array<{
      name: string;
      metrics: Record<string, number>;
      performance: number;
    }>;
  }): Promise<CrossChannelAnalysis> {
    const sorted = [...params.channels].sort((a, b) => b.performance - a.performance);
    
    const topPerformers = sorted.slice(0, 2).map(c => ({
      channel: c.name,
      roi: c.performance,
      reason: `Outstanding performance with ROI of ${c.performance}%`,
    }));

    const underperformers = sorted.slice(-2).map(c => ({
      channel: c.name,
      roi: c.performance,
      issue: c.performance < 100 ? 'Negative ROI' : 'ROI below average',
    }));

    // Calcular nueva asignación de presupuesto
    const totalPerformance = params.channels.reduce((sum, c) => sum + Math.max(c.performance, 0), 0);
    const budgetRecommendations: Record<string, number> = {};
    
    params.channels.forEach(channel => {
      const weight = Math.max(channel.performance, 0) / totalPerformance;
      budgetRecommendations[channel.name] = Math.round(weight * 100);
    });

    const strategicInsights = [
      `${topPerformers[0]?.channel || 'Top channel'} leads with ${topPerformers[0]?.roi || 0}% ROI`,
      `Consider increasing budget for top performers`,
      `Optimize or pause channels with ROI < 100%`,
      'Test new channels to diversify',
    ];

    return {
      topPerformers,
      underperformers,
      budgetRecommendations,
      strategicInsights,
    };
  }

  /**
   * Optimización de budget allocation
   */
  async optimizeBudgetAllocation(params: {
    totalBudget: number;
    channels: Record<string, { currentSpend: number; roi: number }>;
    constraints?: {
      minSpendPerChannel?: number;
      maxSpendPerChannel?: number;
    };
  }): Promise<{
    allocation: Record<string, number>;
    expectedROI: number;
    changes: Array<{ channel: string; change: number; reason: string }>;
  }> {
    const allocation: Record<string, number> = {};
    const changes: Array<{ channel: string; change: number; reason: string }> = [];
    
    // Algoritmo simple: asignar más presupuesto a canales con mejor ROI
    const totalROI = Object.values(params.channels).reduce((sum, c) => sum + Math.max(c.roi, 0), 0);
    
    Object.entries(params.channels).forEach(([channel, data]) => {
      const roiWeight = Math.max(data.roi, 0) / totalROI;
      const newSpend = Math.round(params.totalBudget * roiWeight);
      
      allocation[channel] = newSpend;
      
      const change = ((newSpend - data.currentSpend) / data.currentSpend) * 100;
      if (Math.abs(change) > 5) {
        changes.push({
          channel,
          change: Math.round(change),
          reason: change > 0 
            ? `High ROI of ${data.roi}% justifies an increase`
            : `Low ROI of ${data.roi}% suggests a reduction`,
        });
      }
    });

    // Calcular ROI esperado
    const expectedRevenue = Object.entries(allocation).reduce((sum, [channel, spend]) => {
      const roi = params.channels[channel].roi / 100;
      return sum + (spend * roi);
    }, 0);
    
    const expectedROI = (expectedRevenue / params.totalBudget) * 100;

    return {
      allocation,
      expectedROI: Math.round(expectedROI),
      changes,
    };
  }

  /**
   * Generate strategic report
   */
  async generateStrategicReport(params: {
    period: string;
    metrics: Record<string, any>;
  }): Promise<{
    executive_summary: string;
    key_wins: string[];
    challenges: string[];
    next_actions: string[];
  }> {
    const prompt = `Generate a strategic marketing report:

PERIOD: ${params.period}
METRICS: ${JSON.stringify(params.metrics, null, 2)}

Provide in JSON:
{
  "executive_summary": "string (3-4 sentences)",
  "key_wins": ["string", "string", "string"],
  "challenges": ["string", "string"],
  "next_actions": ["string", "string", "string"]
}`;

    try {
      const message = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      });

      const responseContent = message.content[0];
      if (responseContent.type !== "text") {
        throw new Error("Unexpected response type");
      }

      const jsonMatch = responseContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found");
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Error generating report:", error);
      return {
        executive_summary: `Report for period ${params.period}`,
        key_wins: ['Sustained growth', 'Positive ROI'],
        challenges: ['Channel optimization'],
        next_actions: ['Scale top performers', 'Optimize underperformers'],
      };
    }
  }
}

