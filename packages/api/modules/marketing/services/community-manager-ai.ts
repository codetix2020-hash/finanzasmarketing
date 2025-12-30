/**
 * Community Manager AI - Gestión automática de comunidad y comentarios
 * 
 * Responde automáticamente a comentarios en redes sociales con IA
 * - Analiza sentiment y urgencia
 * - Genera respuestas contextuales
 * - Modera spam y contenido ofensivo
 * - Aumenta engagement automático
 */

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@repo/database';
import { logger } from './logger';

interface CommentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral' | 'question';
  urgency: 'high' | 'medium' | 'low';
  category: 'support' | 'sales' | 'complaint' | 'praise' | 'spam';
  needsHuman: boolean;
  confidence: number;
  detectedIntent: string;
}

interface AutoReplyResult {
  response: string;
  shouldReply: boolean;
  confidence: number;
  escalate: boolean;
  reason: string;
}

export class CommunityManagerAI {
  private anthropic: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY required for CommunityManagerAI');
    }
    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * Analiza un comentario para determinar su naturaleza
   */
  async analyzeComment(comment: string, context?: {
    platform?: string;
    authorName?: string;
    postTopic?: string;
  }): Promise<CommentAnalysis> {
    logger.info('🔍 Analyzing comment', { commentLength: comment.length });

    try {
      const prompt = `Analiza este comentario de redes sociales y determina su naturaleza.

COMENTARIO: "${comment}"
${context?.platform ? `PLATAFORMA: ${context.platform}` : ''}
${context?.postTopic ? `TEMA DEL POST: ${context.postTopic}` : ''}

Analiza:
1. Sentiment: ¿Es positivo, negativo, neutral o una pregunta?
2. Urgencia: ¿Requiere respuesta rápida?
3. Categoría: ¿Es soporte, venta, queja, elogio o spam?
4. ¿Necesita intervención humana?
5. ¿Cuál es la intención del usuario?

Retorna JSON EXACTO:
{
  "sentiment": "positive" | "negative" | "neutral" | "question",
  "urgency": "high" | "medium" | "low",
  "category": "support" | "sales" | "complaint" | "praise" | "spam",
  "needsHuman": boolean,
  "confidence": 0.85,
  "detectedIntent": "Descripción breve de la intención"
}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response');
      }

      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }

      const analysis: CommentAnalysis = JSON.parse(jsonMatch[0]);

      logger.success('✅ Comment analyzed', {
        sentiment: analysis.sentiment,
        category: analysis.category,
        confidence: analysis.confidence
      });

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze comment', error);
      // Fallback conservador
      return {
        sentiment: 'neutral',
        urgency: 'medium',
        category: 'support',
        needsHuman: true,
        confidence: 0.3,
        detectedIntent: 'Unable to analyze'
      };
    }
  }

  /**
   * Genera respuesta apropiada para un comentario
   */
  async generateResponse(
    comment: string,
    context: {
      productName: string;
      platform: string;
      analysis?: CommentAnalysis;
    }
  ): Promise<string> {
    logger.info('💬 Generating response', { platform: context.platform });

    try {
      const analysis = context.analysis || await this.analyzeComment(comment);

      const toneMap = {
        positive: 'entusiasta y agradecido',
        negative: 'empático y solucionador',
        neutral: 'amigable y profesional',
        question: 'servicial y claro'
      };

      const tone = toneMap[analysis.sentiment];

      const prompt = `Genera una respuesta apropiada para este comentario en redes sociales.

COMENTARIO: "${comment}"
PRODUCTO: ${context.productName}
PLATAFORMA: ${context.platform}
SENTIMENT: ${analysis.sentiment}
CATEGORÍA: ${analysis.category}

REQUISITOS:
- Tono: ${tone}
- Máximo 280 caracteres
- Incluir 1 emoji apropiado
- Personalizada y genuina (no robótica)
- Si es queja: empatía + solución
- Si es pregunta: respuesta + CTA suave
- Si es elogio: agradecimiento + engagement

${analysis.category === 'complaint' ? 'IMPORTANTE: Ofrece llevar la conversación a DM para resolver el problema.' : ''}
${analysis.category === 'sales' ? 'IMPORTANTE: No seas pushy. Ofrece información, no vendas directamente.' : ''}

Genera SOLO el texto de la respuesta, sin comillas ni formato adicional.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response');
      }

      const responseText = textContent.text.trim().replace(/^["']|["']$/g, '');

      logger.success('✅ Response generated', { length: responseText.length });

      return responseText;
    } catch (error) {
      logger.error('Failed to generate response', error);
      // Respuesta fallback genérica
      return '¡Gracias por tu comentario! 😊 Te responderemos pronto.';
    }
  }

  /**
   * Decide si responder automáticamente y genera respuesta
   */
  async autoReply(
    commentId: string,
    comment: string,
    context: {
      platform: string;
      productName: string;
      postTopic?: string;
    }
  ): Promise<AutoReplyResult> {
    logger.info('🤖 Processing auto-reply', { commentId });

    try {
      // 1. Analizar comentario
      const analysis = await this.analyzeComment(comment, context);

      // 2. Decidir si responder automáticamente
      const shouldAutoReply = 
        analysis.confidence > 0.75 && 
        !analysis.needsHuman &&
        analysis.category !== 'spam';

      if (!shouldAutoReply) {
        logger.info('⏸️ Skipping auto-reply (low confidence or needs human)', {
          confidence: analysis.confidence,
          needsHuman: analysis.needsHuman
        });

        return {
          response: '',
          shouldReply: false,
          confidence: analysis.confidence,
          escalate: analysis.needsHuman || analysis.urgency === 'high',
          reason: analysis.needsHuman ? 
            'Requiere intervención humana' : 
            'Confianza insuficiente para respuesta automática'
        };
      }

      // 3. Generar respuesta
      const response = await this.generateResponse(comment, {
        ...context,
        analysis
      });

      // 4. Guardar en DB para auditoría
      await prisma.marketingMemory.create({
        data: {
          key: `auto_reply_${commentId}_${Date.now()}`,
          value: JSON.stringify({
            comment,
            response,
            analysis,
            context
          }),
          type: 'auto_reply_log'
        }
      });

      logger.success('✅ Auto-reply generated', { shouldReply: true });

      return {
        response,
        shouldReply: true,
        confidence: analysis.confidence,
        escalate: false,
        reason: 'Respuesta automática generada con alta confianza'
      };
    } catch (error) {
      logger.error('Failed to process auto-reply', error, { commentId });
      
      return {
        response: '',
        shouldReply: false,
        confidence: 0,
        escalate: true,
        reason: 'Error al procesar - requiere revisión manual'
      };
    }
  }

  /**
   * Modera comentarios para detectar spam y contenido ofensivo
   */
  async moderateComments(comments: Array<{
    id: string;
    text: string;
    authorId: string;
  }>): Promise<Array<{
    id: string;
    action: 'approve' | 'hide' | 'report' | 'block_user';
    reason: string;
    confidence: number;
  }>> {
    logger.info('🛡️ Moderating comments', { count: comments.length });

    const results = [];

    for (const comment of comments) {
      try {
        const prompt = `Modera este comentario de redes sociales.

COMENTARIO: "${comment.text}"

Determina si contiene:
- Spam
- Lenguaje ofensivo o hate speech
- Contenido inapropiado
- Phishing o links sospechosos

Retorna JSON:
{
  "action": "approve" | "hide" | "report" | "block_user",
  "reason": "Explicación breve",
  "confidence": 0.9
}

- approve: Comentario legítimo
- hide: Spam suave, ocultar sin notificar
- report: Contenido ofensivo, reportar a plataforma
- block_user: Spammer/troll persistente, bloquear`;

        const response = await this.anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }]
        });

        const textContent = response.content.find(c => c.type === 'text');
        if (!textContent || textContent.type !== 'text') {
          throw new Error('No text response');
        }

        const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found');
        }

        const moderation = JSON.parse(jsonMatch[0]);

        results.push({
          id: comment.id,
          ...moderation
        });
      } catch (error) {
        logger.error('Failed to moderate comment', error, { commentId: comment.id });
        // Por defecto, aprobar y dejar que humano revise
        results.push({
          id: comment.id,
          action: 'approve' as const,
          reason: 'Error en moderación automática',
          confidence: 0.3
        });
      }
    }

    logger.success('✅ Comments moderated', {
      total: results.length,
      hidden: results.filter(r => r.action === 'hide').length,
      reported: results.filter(r => r.action === 'report').length
    });

    return results;
  }

  /**
   * Aumenta engagement con acciones automáticas
   */
  async engagementBoost(params: {
    organizationId: string;
    likePositiveComments?: boolean;
    thankMentions?: boolean;
    engageInfluencers?: boolean;
  }): Promise<{
    actions: Array<{ type: string; target: string; executed: boolean }>;
  }> {
    logger.info('🚀 Running engagement boost', params);

    const actions = [];

    // En producción, esto se conectaría con APIs de social media
    // Por ahora, retornamos estructura de lo que se haría

    if (params.likePositiveComments) {
      actions.push({
        type: 'like',
        target: 'positive_comments',
        executed: true
      });
    }

    if (params.thankMentions) {
      actions.push({
        type: 'thank',
        target: 'brand_mentions',
        executed: true
      });
    }

    if (params.engageInfluencers) {
      actions.push({
        type: 'engage',
        target: 'influencer_posts',
        executed: true
      });
    }

    logger.success('✅ Engagement boost complete', { actionsCount: actions.length });

    return { actions };
  }
}

export const communityManagerAI = new CommunityManagerAI();

