export const ROUTES = {
	home: "/",
	dashboard: "/dashboard",
	profile: "/profile",
	billing: "/billing",
	billingSuccess: "/billing/success",
	login: "/login",
	signup: "/signup",
	ssoCallback: "/sso-callback",
	verifyEmail: "/verify-email",
	loginContinue: "/login/continue",
	terms: "/terms",
	privacy: "/privacy",
} as const;

export type AppPath = (typeof ROUTES)[keyof typeof ROUTES];
