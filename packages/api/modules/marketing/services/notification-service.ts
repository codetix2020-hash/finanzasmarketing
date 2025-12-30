/**
 * Notification Service
 * 
 * Envía notificaciones vía Slack y Email
 */

interface SlackMessage {
  text: string;
  blocks?: any[];
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class NotificationService {
  private slackWebhookUrl?: string;
  private resendApiKey?: string;

  constructor() {
    this.slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    this.resendApiKey = process.env.RESEND_API_KEY;
  }

  /**
   * Enviar notificación a Slack
   */
  async sendSlackNotification(message: string, details?: any): Promise<boolean> {
    if (!this.slackWebhookUrl) {
      console.warn("⚠️ SLACK_WEBHOOK_URL not configured. Skipping Slack notification.");
      return false;
    }

    try {
      const payload: SlackMessage = {
        text: message,
        blocks: details
          ? [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: message,
                },
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `\`\`\`${JSON.stringify(details, null, 2)}\`\`\``,
                },
              },
            ]
          : undefined,
      };

      const response = await fetch(this.slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error("❌ Slack notification failed:", await response.text());
        return false;
      }

      console.log("✅ Slack notification sent");
      return true;
    } catch (error: any) {
      console.error("❌ Error sending Slack notification:", error.message);
      return false;
    }
  }

  /**
   * Enviar email con Resend
   */
  async sendEmailNotification(options: EmailOptions): Promise<boolean> {
    if (!this.resendApiKey) {
      console.warn("⚠️ RESEND_API_KEY not configured. Skipping email notification.");
      return false;
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.resendApiKey}`,
        },
        body: JSON.stringify({
          from: "MarketingOS <notifications@yourdomain.com>",
          to: options.to,
          subject: options.subject,
          html: options.html,
        }),
      });

      if (!response.ok) {
        console.error("❌ Email notification failed:", await response.text());
        return false;
      }

      console.log("✅ Email notification sent");
      return true;
    } catch (error: any) {
      console.error("❌ Error sending email notification:", error.message);
      return false;
    }
  }

  /**
   * Notificaciones específicas del sistema
   */

  // 1. Cuando guardia falla
  async notifyGuardFailed(contentId: string, score: number, issues: string[]) {
    const message = `⚠️ *Contenido bloqueado*\nID: ${contentId}\nScore: ${score}/100 (mínimo 60)\nProblemas: ${issues.join(", ")}`;
    await this.sendSlackNotification(message);
  }

  // 2. Cuando se auto-publica
  async notifyContentPublished(platform: string, handle: string, contentId: string) {
    const message = `✅ *Nuevo post publicado*\nPlataforma: ${platform}\nCuenta: ${handle}\nID: ${contentId}`;
    await this.sendSlackNotification(message);
  }

  // 3. Cuando campaña alcanza presupuesto
  async notifyBudgetReached(campaignName: string, dailyBudget: number) {
    const message = `💰 *Presupuesto alcanzado*\nCampaña: ${campaignName}\nPresupuesto diario: €${dailyBudget}`;
    await this.sendSlackNotification(message);
  }

  // 4. Cuando ROI baja mucho
  async notifyLowROI(campaignName: string, roi: number) {
    const message = `📉 *Alerta de ROI*\nCampaña: ${campaignName}\nROI: ${roi}% (negativo)`;
    await this.sendSlackNotification(message);
  }

  // 5. Conversión importante
  async notifyHighValueConversion(amount: number, campaign: string, details?: any) {
    const message = `🎉 *Nueva conversión de alto valor*\nMonto: €${amount}\nCampaña: ${campaign}`;
    await this.sendSlackNotification(message, details);
  }

  // 6. Error crítico
  async notifyCriticalError(service: string, error: string, details?: any) {
    const message = `🚨 *Error crítico*\nServicio: ${service}\nError: ${error}`;
    
    // Enviar a Slack
    await this.sendSlackNotification(message, details);

    // Enviar email si es muy crítico
    if (process.env.ADMIN_EMAIL) {
      await this.sendEmailNotification({
        to: process.env.ADMIN_EMAIL,
        subject: `🚨 Error Crítico en ${service}`,
        html: `
          <h2>Error Crítico Detectado</h2>
          <p><strong>Servicio:</strong> ${service}</p>
          <p><strong>Error:</strong> ${error}</p>
          <pre>${JSON.stringify(details, null, 2)}</pre>
        `,
      });
    }
  }

  // 7. Resumen diario
  async sendDailySummary(stats: {
    postsGenerated: number;
    postsPublished: number;
    revenue: number;
    conversions: number;
  }) {
    const message = `📊 *Resumen Diario*\n• Posts generados: ${stats.postsGenerated}\n• Posts publicados: ${stats.postsPublished}\n• Revenue: €${stats.revenue}\n• Conversiones: ${stats.conversions}`;
    await this.sendSlackNotification(message);
  }
}

// Exportar instancia singleton
export const notificationService = new NotificationService();

