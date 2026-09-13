import { Project, QuizQuestion, PlayerTelemetryEvent } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:9000').replace(/\/+$/, '');

export const api = {
  async getProject(id: string): Promise<Project> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn(`[PlayerAPI] Project ${id} not found on server, using fallback/seed demo.`);
      return getDemoProject(id);
    }
  },

  async getActiveQuizzes(): Promise<QuizQuestion[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/engagements/quizzes`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.quizzes || [];
    } catch (e) {
      return [
        {
          id: 'quiz_demo_1',
          questionText: 'What is the benchmark submission latency of the Opportunity OS Autofill Engine?',
          options: ['10 milliseconds', '45 seconds', '5 minutes', '24 hours'],
          correctIndex: 0,
          bonusTokens: 25,
          explanation: 'Opportunity OS utilizes an edge-compiled Rust injector to populate ATS portals in sub-10ms.',
        },
      ];
    }
  },

  async submitQuizAnswer(quizId: string, selectedIndex: number, userId = 'viewer_anonymous'): Promise<{ success: boolean; earnedTokens?: number; explanation?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/engagements/verify-quiz-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId, selectedIndex, userId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      // Offline fallback verification
      const isCorrect = selectedIndex === 0;
      return {
        success: isCorrect,
        earnedTokens: isCorrect ? 25 : 0,
        explanation: 'Opportunity OS edge engine achieves sub-10ms form completion.',
      };
    }
  },

  async createCheckout(basketId: string, items: Array<{ id: string; quantity: number }>): Promise<{ checkoutUrl: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stripe/create-basket-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basketId, selectedItems: items }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('[PlayerAPI] Stripe backend simulated checkout link.');
      return { checkoutUrl: 'https://checkout.stripe.com/pay/cs_test_simulated_digitpop' };
    }
  },

  async sendTelemetry(event: PlayerTelemetryEvent): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (e) {
      // Silent telemetry catch
    }
  },
};

function getDemoProject(id: string): Project {
  return {
    id: id || 'demo-project-1',
    name: 'AI-Native Livestream & Shoppable Showcase',
    description: 'Interactive demonstration with Cloudflare R2 VOD, live overlays, and 1-click Stripe checkout.',
    masterVodUrl: 'https://pub-2af6e082fcb44c58add86361dad9d14b.r2.dev/vods/demo_presentation.mp4',
    hlsManifestUrl: 'http://localhost:8080/live/jeff_speedrun.m3u8',
    durationSeconds: 120,
    productGroups: [
      {
        id: 'pg_1',
        name: 'AI-Native Physics Collection',
        timestampSeconds: 5,
        endTimestampSeconds: 45,
        viewingMode: 'SIDE_PANEL',
        hotspotX: 75,
        hotspotY: 35,
        bundleDiscountPercent: 15,
        products: [
          {
            id: 'prod_book_1',
            title: 'AI-Native Software Engineering',
            price: 9.99,
            currency: 'USD',
            description: 'The New Physics of Software Velocity by Jeffrey Boggs. Kindle & Paperback edition.',
            imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
            externalUrl: 'https://www.amazon.com/dp/B0GN3G2HTQ',
            stripePriceId: 'price_1TY6NwL8bMWhBHQJ_book',
          },
          {
            id: 'prod_pass_1',
            title: 'Opportunity OS Pro Pass',
            price: 49.00,
            currency: 'USD',
            description: '1-Click 10ms Profile Autofill Engine for ATS job applications.',
            imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
            externalUrl: 'https://app.opportunityos.com/checkout/pro',
            stripePriceId: 'price_1TY6NwL8bMWhBHQJ_pass',
          },
        ],
      },
    ],
  };
}
