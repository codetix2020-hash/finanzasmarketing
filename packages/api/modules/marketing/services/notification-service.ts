/**
 * Notification Service - Sistema centralizado de notificaciones
 * 
 * Envía alertas importantes vía:
 * - Slack (webhooks)
 * - Email (Resend API)
 * 
 * Tipos de notificaciones:
 * - Contenido publicado
 * - Guardias fallidas
 * - Alertas de performance de campañas
 * - Conversiones importantes
 * - Anomalías detectadas
 */

import { logger } from './logger';

export class NotificationService {
  private slackWebhookUrl: string | undefined;
  private resendApiKey: string | undefined;

  constructor() {
    this.slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    this.resendApiKey = process.env.RESEND_API_KEY;
  }

  /**
   * Envía notificación a Slack
   */
  async sendSlackNotification(message: string, metadata?: any): Promise<void> {
    if (!this.slackWebhookUrl) {
      logger.warning('Slack webhook URL not configured, skipping notification');
      return;
    }

    try {
      const response = await fetch(this.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: message,
          ...(metadata && { blocks: this.formatSlackBlocks(message, metadata) })
        })
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.statusText}`);
      }

      logger.debug('Slack notification sent', { message });
    } catch (error) {
      logger.error('Failed to send Slack notification', error, { message });
    }
  }

  /**
   * Envía notificación por email
   */
  async sendEmailNotification(params: {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
  }): Promise<void> {
    if (!this.resendApiKey) {
      logger.warning('Resend API key not configured, skipping email');
      return;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.resendApiKey}`
        },
        body: JSON.stringify({
          from: params.from || 'MarketingOS <alerts@marketingos.com>',
          to: Array.isArray(params.to) ? params.to : [params.to],
          subject: params.subject,
          html: params.html
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Resend API error: ${errorData}`);
      }

      logger.debug('Email notification sent', { to: params.to, subject: params.subject });
    } catch (error) {
      logger.error('Failed to send email notification', error, { to: params.to });
    }
  }

  /**
   * Notifica cuando se publica contenido automáticamente
   */
  async notifyContentPublished(content: {
    platform: string;
    text: string;
    id: string;
    scheduledTime?: Date;
  }): Promise<void> {
    const preview = content.text.substring(0, 100);
    const message = `✅ *Nuevo post publicado*
📱 Plataforma: ${content.platform}
📝 Contenido: ${preview}...
🆔 ID: ${content.id}
${content.scheduledTime ? `⏰ Programado para: ${content.scheduledTime.toLocaleString()}` : ''}`;

    await this.sendSlackNotification(message);
  }

  /**
   * Notifica cuando las guardias de contenido fallan
   */
  async notifyGuardFailed(content: {
    platform: string;
    score: number;
    issues: string[];
    id?: string;
  }): Promise<void> {
    const message = `⚠️ *Contenido bloqueado por guardias*
🎯 Score: ${content.score}/100 (mínimo requerido: 60)
📱 Plataforma: ${content.platform}
${content.id ? `🆔 ID: ${content.id}` : ''}

❌ Problemas detectados:
${content.issues.map(issue => `  • ${issue}`).join('\n')}

👉 Revisa y corrige antes de publicar.`;

    await this.sendSlackNotification(message);
  }

  /**
   * Notifica cuando una campaña tiene ROI bajo
   */
  async notifyLowROI(campaign: {
    name: string;
    platform: string;
    roi: number;
    spend: number;
    revenue: number;
  }): Promise<void> {
    const message = `📉 *Alerta: Campaña con ROI bajo*
📢 Campaña: "${campaign.name}"
🎯 Plataforma: ${campaign.platform}
💰 ROI: ${campaign.roi.toFixed(2)}x
💸 Gastado: €${campaign.spend}
💵 Revenue: €${campaign.revenue}

⚠️ Acción recomendada: Revisar segmentación, creatividades o pausar campaña.`;

    await this.sendSlackNotification(message);
  }

  /**
   * Notifica cuando se detecta una conversión importante
   */
  async notifyConversion(event: {
    value: number;
    source?: string;
    campaign?: string;
    userId?: string;
  }): Promise<void> {
    // Solo notificar conversiones > €500
    if (event.value < 500) return;

    const message = `🎉 *¡Nueva conversión importante!*
💰 Valor: €${event.value}
${event.source ? `📍 Fuente: ${event.source}` : ''}
${event.campaign ? `📢 Campaña: ${event.campaign}` : ''}
${event.userId ? `👤 Usuario: ${event.userId}` : ''}`;

    await this.sendSlackNotification(message);
  }

  /**
   * Notifica cuando se detecta una anomalía en métricas
   */
  async notifyAnomaly(anomaly: {
    metric: string;
    current: number;
    expected: number;
    change: number;
    severity: 'low' | 'medium' | 'high';
  }): Promise<void> {
    const emoji = anomaly.severity === 'high' ? '🚨' : anomaly.severity === 'medium' ? '⚠️' : 'ℹ️';
    const changeSymbol = anomaly.change > 0 ? '+' : '';
    
    const message = `${emoji} *Anomalía detectada en métricas*
📊 Métrica: ${anomaly.metric}
📈 Valor actual: ${anomaly.current}
📉 Valor esperado: ${anomaly.expected}
🔄 Cambio: ${changeSymbol}${anomaly.change.toFixed(1)}%
⚡ Severidad: ${anomaly.severity.toUpperCase()}

👉 Investiga la causa de este cambio inusual.`;

    await this.sendSlackNotification(message);
  }

  /**
   * Notifica cuando se completa el ciclo de marketing automático
   */
  async notifyMarketingCycleComplete(result: {
    productName: string;
    postsCreated: number;
    campaignsOptimized: number;
    healthScore: number;
  }): Promise<void> {
    const message = `🎉 *Ciclo de marketing completado*
🎯 Producto: ${result.productName}
📝 Posts programados: ${result.postsCreated}
🎯 Campañas optimizadas: ${result.campaignsOptimized}
💯 Health Score: ${result.healthScore}/100

✨ El sistema está funcionando en piloto automático.`;

    await this.sendSlackNotification(message);
  }

  /**
   * Formatea bloques enriquecidos para Slack
   */
  private formatSlackBlocks(message: string, metadata: any): any[] {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `_${new Date().toLocaleString()}_`
          }
        ]
      }
    ];
  }
}

export const notificationService = new NotificationService();
