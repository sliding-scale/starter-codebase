/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as email_actions from "../email/actions.js";
import type * as email_client from "../email/client.js";
import type * as email_publicActions from "../email/publicActions.js";
import type * as email_templates from "../email/templates.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as privateData from "../privateData.js";
import type * as stripe_actionHelpers from "../stripe/actionHelpers.js";
import type * as stripe_actions from "../stripe/actions.js";
import type * as stripe_client from "../stripe/client.js";
import type * as stripe_mutations from "../stripe/mutations.js";
import type * as stripe_queries from "../stripe/queries.js";
import type * as stripe_seed from "../stripe/seed.js";
import type * as stripe_webhook from "../stripe/webhook.js";
import type * as stripe_webhookProcessor from "../stripe/webhookProcessor.js";
import type * as user_actionHelpers from "../user/actionHelpers.js";
import type * as user_actions from "../user/actions.js";
import type * as user_mutations from "../user/mutations.js";
import type * as user_queries from "../user/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "email/actions": typeof email_actions;
  "email/client": typeof email_client;
  "email/publicActions": typeof email_publicActions;
  "email/templates": typeof email_templates;
  healthCheck: typeof healthCheck;
  http: typeof http;
  privateData: typeof privateData;
  "stripe/actionHelpers": typeof stripe_actionHelpers;
  "stripe/actions": typeof stripe_actions;
  "stripe/client": typeof stripe_client;
  "stripe/mutations": typeof stripe_mutations;
  "stripe/queries": typeof stripe_queries;
  "stripe/seed": typeof stripe_seed;
  "stripe/webhook": typeof stripe_webhook;
  "stripe/webhookProcessor": typeof stripe_webhookProcessor;
  "user/actionHelpers": typeof user_actionHelpers;
  "user/actions": typeof user_actions;
  "user/mutations": typeof user_mutations;
  "user/queries": typeof user_queries;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
