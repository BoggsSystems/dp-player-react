import { Project, QuizQuestion, PlayerTelemetryEvent } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:9000').replace(/\/+$/, '');

export const api = {
  async getProject(id: string): Promise<Project> {
    // 1. Fetch from backend API if available
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${id}`);
      if (res.ok) {
        const project = await res.json();
        if (project && project.id) return project;
      }
    } catch (e) {}

    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const project = await res.json();
        if (project && project.id) return project;
      }
    } catch (e) {}

    // 2. Check Studio's active or saved projects in localStorage
    try {
      const studioProjectsRaw = localStorage.getItem('digitpop_studio_projects');
      if (studioProjectsRaw) {
        const studioProjects: Project[] = JSON.parse(studioProjectsRaw);
        const match = studioProjects.find((p) => p.id === id);
        if (match) return match;
      }
      const activeProjectRaw = localStorage.getItem('digitpop_studio_project');
      if (activeProjectRaw) {
        const activeProject: Project = JSON.parse(activeProjectRaw);
        if (activeProject.id === id) return activeProject;
      }
    } catch (e) {}

    console.warn(`[PlayerAPI] Project ${id} not found on server or localStorage, using rich demo fallback.`);
    return getDemoProject(id);
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

  async createCheckout(
    basketOrGroupId: string,
    items: Array<{ id: string; title: string; price: number; imageUrl?: string; quantity: number }>,
    projectId?: string
  ): Promise<{ checkoutUrl: string; sessionId?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stripe/create-basket-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basketId: basketOrGroupId,
          selectedItems: items,
          items,
          projectId,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return {
        checkoutUrl: data.checkoutUrl || data.checkoutSession?.checkoutUrl || data.url || 'https://checkout.stripe.com/pay/cs_test_simulated_digitpop',
        sessionId: data.sessionId || data.checkoutSession?.id,
      };
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

export const TEST_BAVARIA_PROJECT: Project = {
  id: 'proj_bavaria_luxury_001',
  name: 'Bavaria Alpine Luxury & Lifestyle Showcase',
  description: 'Interactive 4K alpine lifestyle showcase with 1 product group featuring 6 handcrafted luxury products.',
  masterVodUrl: '/videos/test_showcase.mp4',
  durationSeconds: 24.0,
  productGroups: [
    {
      id: 'pg_alpine_luxury',
      title: 'Alpine Winter Essentials & Luxury Collection',
      name: 'Alpine Winter Essentials & Luxury Collection',
      subtitle: 'Curated 6-piece luxury ensemble for the Bavarian Alps',
      description: 'Handcrafted full-grain leather, Swiss mechanical horology, fine merino wool, and mountain lifestyle essentials.',
      timestampSeconds: 3.5,
      endTimestampSeconds: 24.0,
      viewingMode: 'PAUSE_INSPECT',
      hotspotX: 68,
      hotspotY: 38,
      bundleDiscountPercent: 15,
      products: [
        {
          id: 'prod_bav_duffle',
          title: 'Bavarian Full-Grain Leather Duffle',
          price: 349.00,
          currency: 'USD',
          description: 'Vegetable-tanned Bavarian cowhide with solid brass YKK zippers and reinforced waterproof lining.',
          imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
          imageUrls: [
            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=600&auto=format&fit=crop&q=80',
          ],
          externalUrl: 'https://shop.example.com/bavarian-duffle',
          stripePriceId: 'price_bav_duffle',
        },
        {
          id: 'prod_bav_watch',
          title: 'Chronos Obsidian Automatic Watch',
          price: 289.00,
          currency: 'USD',
          description: 'Automatic self-winding Swiss mechanical movement with sapphire crystal and 100m water resistance.',
          imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
          imageUrls: [
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
          ],
          externalUrl: 'https://shop.example.com/chronos-watch',
          stripePriceId: 'price_bav_watch',
        },
        {
          id: 'prod_bav_sweater',
          title: 'Thermal Merino Wool Alpine Crew',
          price: 125.00,
          currency: 'USD',
          description: '100% ultrafine New Zealand Merino wool with breathable ribbed cuffs and odor-resistant weave.',
          imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&auto=format&fit=crop&q=80',
          imageUrls: [
            'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80',
          ],
          externalUrl: 'https://shop.example.com/merino-sweater',
          stripePriceId: 'price_bav_sweater',
        },
        {
          id: 'prod_bav_shades',
          title: 'Alpine Glacier Polarized Sunglasses',
          price: 165.00,
          currency: 'USD',
          description: 'Ultralight aerospace titanium frame with category-3 polarized anti-glare lenses for high altitude.',
          imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80',
          imageUrls: [
            'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&auto=format&fit=crop&q=80',
          ],
          externalUrl: 'https://shop.example.com/glacier-shades',
          stripePriceId: 'price_bav_shades',
        },
        {
          id: 'prod_bav_flask',
          title: 'Ceramic-Lined Alpine Thermal Flask',
          price: 48.00,
          currency: 'USD',
          description: 'Double-wall vacuum insulation keeps liquids steaming hot for 24 hours. Pure ceramic interior lining.',
          imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',
          imageUrls: [
            'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80',
          ],
          externalUrl: 'https://shop.example.com/thermal-flask',
          stripePriceId: 'price_bav_flask',
        },
        {
          id: 'prod_bav_boots',
          title: 'Vibram-Sole Trailblazer Mountain Boots',
          price: 240.00,
          currency: 'USD',
          description: 'Gore-Tex breathable waterproof membrane paired with Vibram Megagrip lugged outsoles for alpine mountain terrain.',
          imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
          imageUrls: [
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600&auto=format&fit=crop&q=80',
          ],
          externalUrl: 'https://shop.example.com/trailblazer-boots',
          stripePriceId: 'price_bav_boots',
        },
      ],
    },
  ],
};

export const OPPORTUNITY_OS_ABOUT_PROJECT: Project = {
  id: 'ba3087e7-bb6b-420f-bbb2-2a8fc7dda9df',
  name: 'AI-Native Software Engineering & Opportunity OS',
  description: 'Keynote speedrun and architectural overview by Jeffrey Boggs, author of AI-Native Software Engineering.',
  masterVodUrl: '/videos/opportunity-os-about.mp4',
  durationSeconds: 636.27,
  productGroups: [
    {
      id: 'pg_book_spotlight',
      title: 'AI-Native Software Engineering',
      name: 'AI-Native Software Engineering',
      subtitle: 'By Jeffrey Boggs — Founder, Boggs Systems Corporation',
      description: 'The definitive blueprint on autonomous multi-agent loops, context window economics, and closed-loop verification sandboxes.',
      timestampSeconds: 0.0,
      endTimestampSeconds: 636.27,
      viewingMode: 'SIDE_PANEL',
      hotspotX: 78,
      hotspotY: 35,
      bundleDiscountPercent: 0,
      products: [
        {
          id: 'prod_book_ai_native',
          title: 'AI-Native Software Engineering: The New Physics of Software Velocity',
          brand: 'Jeffrey Boggs',
          price: 9.99,
          currency: 'USD',
          description: 'AI-Native Software Engineering explores a fundamental shift in how software is built now that execution has become cheap and abundant. Drawing from real end-to-end systems, Jeff Boggs demonstrates how modern software development is moving away from role-based execution toward system-level thinking, orchestration, and intent.',
          bullets: [
            'The Software Orchestrator Paradigm: Moving from manual syntax drafting to systems-level autonomous multi-agent loops.',
            'Context Window Economics: Precise bounded context and deterministic execution gates.',
            'Closed-Loop Verification: Building sandboxes where agents test, heal, and verify PRs automatically.',
            'Multi-Agent Cognitive Routing: Parallelizing architectural tasks with specialized subagents.',
            'Deterministic Production Gates: Eliminating nondeterministic regressions in autonomous loops.',
          ],
          specs: [
            { name: 'Publisher', value: 'Boggs Systems' },
            { name: 'Publication Date', value: 'September 2026' },
            { name: 'Language', value: 'English' },
            { name: 'Print Length', value: '284 pages' },
          ],
          rating: 4.9,
          ratingsCount: 312,
          isPrime: true,
          imageUrl: '/images/ai-native-software-engineering-cover.jpg',
          imageUrls: ['/images/ai-native-software-engineering-cover.jpg'],
          externalUrl: 'https://www.amazon.com/dp/B0GN3G2HTQ',
          checkoutType: 'AMAZON',
          buttonTextOverride: 'Buy on Amazon ($9.99 / $24.95)',
        },
      ],
    },
  ],
};

export const OPPORTUNITY_OS_JOB_APPLICATION_PROJECT: Project = {
  id: '2cc6c64d-a3c6-4de1-9596-2b39df9d3155',
  name: 'Opportunity OS Live Job Application Speedrun & Studio Setup',
  description: 'Live job application session featuring Opportunity OS automations, AI-Native Software Engineering book discussion, and studio setup.',
  masterVodUrl: '/videos/opportunity-os-job-application.mp4',
  thumbnailUrl: '/thumbnails/opportunity-os-job-application.jpg',
  durationSeconds: 398.97,
  productGroups: [
    {
      id: 'pg_speedrun_gear',
      title: 'Featured in Video & Studio Setup',
      name: 'Featured in Video & Studio Setup',
      subtitle: 'Opportunity OS Platform, AI-Native Engineering Book & Studio Lighting',
      description: 'Complete toolkit, literature, and studio gear shown throughout this live application session.',
      timestampSeconds: 0.0,
      endTimestampSeconds: 398.97,
      viewingMode: 'SIDE_PANEL',
      hotspotX: 82,
      hotspotY: 40,
      bundleDiscountPercent: 0,
      products: [
        {
          id: 'prod_opp_os_app',
          title: 'Opportunity OS — AI Job Search & Application Assistant',
          brand: 'Opportunity OS',
          price: 59.00,
          currency: 'USD',
          description: 'Autonomous AI job search, ATS portal autofill in 10ms, customized cover letter generation, and real-time candidate proof-of-work telemetry.',
          bullets: [
            'Instant ATS Form Autofill with 10ms Zero-Latency Field Injection',
            'Automated Role Discovery & Keyword Matching across 500+ job boards',
            'Tailored Multi-Agent Resume & Cover Letter Customization',
            'Real-Time Application Pipeline Tracking & Analytics',
            'Enterprise-Grade Security with Local Credential Storage',
          ],
          specs: [
            { name: 'Platform', value: 'Web App & Chrome Extension' },
            { name: 'Integration', value: 'Workday, Greenhouse, Lever' },
            { name: 'License', value: 'Active Operator Plan' },
          ],
          rating: 5.0,
          ratingsCount: 1850,
          isPrime: false,
          imageUrl: '/thumbnails/opportunity-os-job-application.jpg',
          imageUrls: ['/thumbnails/opportunity-os-job-application.jpg'],
          externalUrl: 'https://opportunity-system.com/#/plans',
          checkoutType: 'EXTERNAL_LINK',
          buttonTextOverride: 'Choose Plan on Opportunity OS',
        },
        {
          id: 'prod_book_ai_native_speedrun',
          title: 'AI-Native Software Engineering: The New Physics of Software Velocity',
          brand: 'Jeffrey Boggs',
          price: 9.99,
          currency: 'USD',
          description: 'The definitive manifesto on why autocomplete and chat prompts hit a hard velocity wall, and how autonomous agent loops rewrite software economics.',
          bullets: [
            'The Software Orchestrator Paradigm: Moving from manual syntax drafting to systems-level autonomous multi-agent loops.',
            'Context Window Economics: Precise bounded context and deterministic execution gates.',
            'Closed-Loop Verification: Building sandboxes where agents test, heal, and verify PRs automatically.',
          ],
          specs: [
            { name: 'Publisher', value: 'Boggs Systems' },
            { name: 'Publication Date', value: 'September 2026' },
            { name: 'Language', value: 'English' },
          ],
          rating: 4.9,
          ratingsCount: 312,
          isPrime: true,
          imageUrl: '/images/ai-native-software-engineering-cover.jpg',
          imageUrls: ['/images/ai-native-software-engineering-cover.jpg'],
          externalUrl: 'https://www.amazon.com/dp/B0GN3G2HTQ',
          checkoutType: 'AMAZON',
          buttonTextOverride: 'Buy on Amazon ($9.99 / $24.95)',
        },
        {
          id: 'prod_miortior_lamp',
          title: 'Miortior Smart RGB LED Corner Floor Lamp',
          brand: 'Miortior',
          price: 39.99,
          currency: 'USD',
          description: 'Modern minimalist RGB corner lamp featured in studio background. App & remote control, music sync, 16 million colors.',
          bullets: [
            '16 Million RGB Colors & 300+ Dynamic Lighting Modes',
            'Built-in High Sensitivity Mic for Real-time Music Sync',
            'Smart App Control via Bluetooth & 360° RF Remote Control',
            'Space-Saving Minimalist Aluminum Corner Design (56" Height)',
            'Timer Schedule & Sleep Automation Settings',
          ],
          specs: [
            { name: 'Height', value: '56 inches' },
            { name: 'Connectivity', value: 'Bluetooth & RF Remote' },
            { name: 'Power', value: '12W / 12V Adapter' },
            { name: 'Material', value: 'Aluminum & Acrylic' },
            { name: 'Voltage', value: '12 Volts' },
          ],
          rating: 4.6,
          ratingsCount: 2480,
          isPrime: true,
          imageUrl: '/images/miortior-corner-floor-lamp.jpg',
          imageUrls: [
            '/images/miortior-corner-floor-lamp.jpg',
            '/api/images/proxy?url=' + encodeURIComponent('https://m.media-amazon.com/images/I/71il0HKYM8L._AC_SL1500_.jpg'),
            '/api/images/proxy?url=' + encodeURIComponent('https://m.media-amazon.com/images/I/71h+c7PD3LL._AC_SL1500_.jpg'),
            '/api/images/proxy?url=' + encodeURIComponent('https://m.media-amazon.com/images/I/71IY0A1ILaL._AC_SL1500_.jpg'),
            '/api/images/proxy?url=' + encodeURIComponent('https://m.media-amazon.com/images/I/71QKZitCZ9L._AC_SL1500_.jpg'),
            '/api/images/proxy?url=' + encodeURIComponent('https://m.media-amazon.com/images/I/61VhqH0QFwL._AC_SL1500_.jpg'),
          ],
          externalUrl: 'https://www.amazon.com/dp/B0C2HDKZD7',
          checkoutType: 'AMAZON',
          buttonTextOverride: 'Buy on Amazon ($39.99)',
        },
      ],
    },
  ],
};

function getDemoProject(id: string): Project {
  if (
    id === '2cc6c64d-a3c6-4de1-9596-2b39df9d3155' ||
    id === 'opportunity_os_job_application' ||
    id === 'job_application' ||
    id === 'speedrun'
  ) {
    return OPPORTUNITY_OS_JOB_APPLICATION_PROJECT;
  }
  if (
    id === 'ba3087e7-bb6b-420f-bbb2-2a8fc7dda9df' ||
    id === 'opportunity_os_about' ||
    id === 'proj_opportunity_os_about' ||
    id === 'opp_about' ||
    id === 'about'
  ) {
    return OPPORTUNITY_OS_ABOUT_PROJECT;
  }
  if (!id || id === 'proj_bavaria_luxury_001' || id === 'test' || id === 'demo_6_products') {
    return TEST_BAVARIA_PROJECT;
  }
  return {
    ...OPPORTUNITY_OS_ABOUT_PROJECT,
    id,
  };
}
