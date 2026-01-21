// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Solo inicializar Sentry en producción
if (process.env.NODE_ENV === 'production') {
	Sentry.init({
		dsn: "https://5a340cb68bc38f41a4233d16575ad592@o4510489231228928.ingest.de.sentry.io/4510489931743312",

		// Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
		tracesSampleRate: 1,

		// Enable logs to be sent to Sentry
		enableLogs: true,

		// Enable sending user PII (Personally Identifiable Information)
		// https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
		sendDefaultPii: true,
	});
}
