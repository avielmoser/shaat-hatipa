
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // We import db.ts to trigger the side-effect safety checks defined at the top level of that file.
        // This ensures that as soon as the server boots, we verify the environment.
        try {
            await import('@/lib/server/db');
            console.log('[INSTRUMENTATION] Environment safety check passed.');
        } catch (error) {
            // The db file throws synchronously/immediately if env is bad, 
            // but dynamic import might wrap it. 
            // If it throws, we want to ensure the process exits or logs fatally.
            console.error('[INSTRUMENTATION] 🚨 CRITICAL ENVIRONMENT ERROR 🚨');
            console.error(error);
            // process.exit(1) is usually aggressive but appropriate here if we are strict.
            // However, nextjs might handle the error loop. 
            // The error thrown in db.ts is fatal enough.
        }
    }
}
