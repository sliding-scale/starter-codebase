export const ROUTES = {
	home: "/",
	dashboard: "/dashboard",
	settings: "/settings",
	login: "/login",
} as const;

export type AppPath = (typeof ROUTES)[keyof typeof ROUTES];
