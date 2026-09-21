import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.POSTHOG_API_KEY || process.env.VITE_POSTHOG_KEY;
const host = process.env.POSTHOG_HOST || process.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

let posthogClient = null;

if (apiKey) {
  try {
    const { PostHog } = await import('posthog-node').catch(() => ({ PostHog: null }));
    if (PostHog) {
      posthogClient = new PostHog(apiKey, {
        host: host,
        flushAt: 1, // Flush events immediately in serverless/backend env
        flushInterval: 0
      });
      console.log('[PostHog Backend] Initialized successfully');
    }
  } catch (err) {
    console.warn('[PostHog Backend] Optional posthog-node failed to initialize:', err.message);
  }
} else {
  console.log('[PostHog Backend] POSTHOG_API_KEY / VITE_POSTHOG_KEY missing. Event tracking disabled on server.');
}

/**
 * Safely track a server-side event
 */
export const trackServerEvent = (distinctId, eventName, properties = {}) => {
  if (!posthogClient) return;
  try {
    posthogClient.capture({
      distinctId: distinctId || 'system_anonymous',
      event: eventName,
      properties: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        ...properties
      }
    });
  } catch (err) {
    console.error(`[PostHog Backend] Error tracking ${eventName}:`, err.message);
  }
};

/**
 * Helper to shutdown posthog gracefully on process exit
 */
export const shutdownPostHog = async () => {
  if (posthogClient) {
    await posthogClient.shutdown();
  }
};

export default posthogClient;
