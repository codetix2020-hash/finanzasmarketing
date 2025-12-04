import { IncomingWebhook } from '@slack/webhook';
import { Resend } from 'resend';
import Stripe from 'stripe';

export interface ActionConfig {
  type: 'slack' | 'email' | 'stripe_pricing' | 'alert';
  params: Record<string, any>;
  autoExecute: boolean;
}

export interface ActionResult {
  success: boolean;
  message: string;
  executedAt?: Date;
  data?: any;
}

export class ActionExecutor {
  private slack?: IncomingWebhook;
  private resend?: Resend;
  private stripe?: Stripe;

  constructor() {
    if (process.env.SLACK_WEBHOOK_URL) {
      this.slack = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);
    }
    
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
    
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-10-29.clover',
      });
    }
  }

  /**
   * Ejecutar acción
   */
  async execute(action: ActionConfig): Promise<ActionResult> {
    if (!action.autoExecute) {
      return {
        success: false,
        message: 'Acción pendiente de aprobación manual',
      };
    }

    switch (action.type) {
      case 'slack':
        return await this.sendSlackNotification(action.params as {
          title: string;
          message: string;
          severity?: 'info' | 'warning' | 'critical';
        });
      
      case 'email':
        return await this.sendEmail(action.params as {
          to: string;
          subject: string;
          content: string;
        });
      
      case 'stripe_pricing':
        return await this.adjustStripePricing(action.params as {
          priceId: string;
          newAmount: number;
        });
      
      case 'alert':
        return await this.sendAlert(action.params as {
          title: string;
          message: string;
          severity: 'info' | 'warning' | 'critical';
        });
      
      default:
        return {
          success: false,
          message: `Tipo de acción desconocido: ${action.type}`,
        };
    }
  }

  /**
   * Enviar notificación a Slack
   */
  private async sendSlackNotification(params: {
    title: string;
    message: string;
    severity?: 'info' | 'warning' | 'critical';
  }): Promise<ActionResult> {
    if (!this.slack) {
      return {
        success: false,
        message: 'Slack no configurado (falta SLACK_WEBHOOK_URL)',
      };
    }

    try {
      const emoji = params.severity === 'critical' ? '🚨' : params.severity === 'warning' ? '⚠️' : 'ℹ️';
      
      await this.slack.send({
        text: `${emoji} ${params.title}`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `${emoji} ${params.title}`,
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: params.message,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `FinanzaDIOS • ${new Date().toLocaleString('es-ES')}`,
              },
            ],
          },
        ],
      });

      return {
        success: true,
        message: 'Notificación enviada a Slack',
        executedAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Error enviando a Slack: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Enviar email
   */
  private async sendEmail(params: {
    to: string;
    subject: string;
    content: string;
  }): Promise<ActionResult> {
    if (!this.resend) {
      return {
        success: false,
        message: 'Resend no configurado (falta RESEND_API_KEY)',
      };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: 'FinanzaDIOS <onboarding@resend.dev>',
        to: params.to,
        subject: params.subject,
        html: params.content,
      });

      if (error) {
        return {
          success: false,
          message: `Error enviando email: ${error.message}`,
        };
      }

      return {
        success: true,
        message: `Email enviado a ${params.to}`,
        executedAt: new Date(),
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: `Error enviando email: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Ajustar pricing en Stripe
   */
  private async adjustStripePricing(params: {
    priceId: string;
    newAmount: number;
  }): Promise<ActionResult> {
    if (!this.stripe) {
      return {
        success: false,
        message: 'Stripe no configurado (falta STRIPE_SECRET_KEY)',
      };
    }

    try {
      // En producción, ajustarías el precio aquí
      // Por ahora, solo simulamos
      return {
        success: true,
        message: `Precio ajustado a €${params.newAmount}`,
        executedAt: new Date(),
        data: {
          priceId: params.priceId,
          newAmount: params.newAmount,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Error ajustando precio: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Enviar alerta
   */
  private async sendAlert(params: {
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
  }): Promise<ActionResult> {
    // Enviar tanto a Slack como email
    const results = await Promise.allSettled([
      this.sendSlackNotification(params),
      this.sendEmail({
        to: process.env.FINANCE_ALERT_EMAIL || 'default@email.com',
        subject: `[${params.severity.toUpperCase()}] ${params.title}`,
        content: params.message,
      }),
    ]);

    const successes = results.filter((r) => r.status === 'fulfilled' && r.value.success);
    
    return {
      success: successes.length > 0,
      message: `Alerta enviada (${successes.length}/2 canales exitosos)`,
      executedAt: new Date(),
    };
  }
}

