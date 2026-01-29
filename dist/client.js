// src/client.ts
import { atom as atom3 } from "nanostores";

// node_modules/better-auth/dist/client/broadcast-channel.mjs
var kBroadcastChannel = Symbol.for("better-auth:broadcast-channel");

// node_modules/better-auth/dist/client/focus-manager.mjs
var kFocusManager = Symbol.for("better-auth:focus-manager");

// node_modules/better-auth/dist/client/online-manager.mjs
var kOnlineManager = Symbol.for("better-auth:online-manager");
var WindowOnlineManager = class {
  listeners = /* @__PURE__ */ new Set;
  isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  setOnline(online) {
    this.isOnline = online;
    this.listeners.forEach((listener) => listener(online));
  }
  setup() {
    if (typeof window === "undefined" || typeof window.addEventListener === "undefined")
      return () => {};
    const onOnline = () => this.setOnline(true);
    const onOffline = () => this.setOnline(false);
    window.addEventListener("online", onOnline, false);
    window.addEventListener("offline", onOffline, false);
    return () => {
      window.removeEventListener("online", onOnline, false);
      window.removeEventListener("offline", onOffline, false);
    };
  }
};

// node_modules/better-auth/dist/client/query.mjs
import { atom, onMount } from "nanostores";
var isServer = () => typeof window === "undefined";
var useAuthQuery = (initializedAtom, path, $fetch, options) => {
  const value = atom({
    data: null,
    error: null,
    isPending: true,
    isRefetching: false,
    refetch: (queryParams) => fn(queryParams)
  });
  const fn = async (queryParams) => {
    return new Promise((resolve) => {
      const opts = typeof options === "function" ? options({
        data: value.get().data,
        error: value.get().error,
        isPending: value.get().isPending
      }) : options;
      $fetch(path, {
        ...opts,
        query: {
          ...opts?.query,
          ...queryParams?.query
        },
        async onSuccess(context) {
          value.set({
            data: context.data,
            error: null,
            isPending: false,
            isRefetching: false,
            refetch: value.value.refetch
          });
          await opts?.onSuccess?.(context);
        },
        async onError(context) {
          const { request } = context;
          const retryAttempts = typeof request.retry === "number" ? request.retry : request.retry?.attempts;
          const retryAttempt = request.retryAttempt || 0;
          if (retryAttempts && retryAttempt < retryAttempts)
            return;
          value.set({
            error: context.error,
            data: null,
            isPending: false,
            isRefetching: false,
            refetch: value.value.refetch
          });
          await opts?.onError?.(context);
        },
        async onRequest(context) {
          const currentValue = value.get();
          value.set({
            isPending: currentValue.data === null,
            data: currentValue.data,
            error: null,
            isRefetching: true,
            refetch: value.value.refetch
          });
          await opts?.onRequest?.(context);
        }
      }).catch((error) => {
        value.set({
          error,
          data: null,
          isPending: false,
          isRefetching: false,
          refetch: value.value.refetch
        });
      }).finally(() => {
        resolve(undefined);
      });
    });
  };
  initializedAtom = Array.isArray(initializedAtom) ? initializedAtom : [initializedAtom];
  let isMounted = false;
  for (const initAtom of initializedAtom)
    initAtom.subscribe(async () => {
      if (isServer())
        return;
      if (isMounted)
        await fn();
      else
        onMount(value, () => {
          const timeoutId = setTimeout(async () => {
            if (!isMounted) {
              await fn();
              isMounted = true;
            }
          }, 0);
          return () => {
            value.off();
            initAtom.off();
            clearTimeout(timeoutId);
          };
        });
    });
  return value;
};

// node_modules/@better-auth/core/dist/env-DbssmzoK.mjs
var _envShim = Object.create(null);
var _getEnv = (useShim) => globalThis.process?.env || globalThis.Deno?.env.toObject() || globalThis.__env__ || (useShim ? _envShim : globalThis);
var env = new Proxy(_envShim, {
  get(_, prop) {
    return _getEnv()[prop] ?? _envShim[prop];
  },
  has(_, prop) {
    return prop in _getEnv() || prop in _envShim;
  },
  set(_, prop, value) {
    const env$1 = _getEnv(true);
    env$1[prop] = value;
    return true;
  },
  deleteProperty(_, prop) {
    if (!prop)
      return false;
    const env$1 = _getEnv(true);
    delete env$1[prop];
    return true;
  },
  ownKeys() {
    const env$1 = _getEnv(true);
    return Object.keys(env$1);
  }
});
var nodeENV = typeof process !== "undefined" && process.env && "development" || "";
function getEnvVar(key, fallback) {
  if (typeof process !== "undefined" && process.env)
    return process.env[key] ?? fallback;
  if (typeof Deno !== "undefined")
    return Deno.env.get(key) ?? fallback;
  if (typeof Bun !== "undefined")
    return Bun.env[key] ?? fallback;
  return fallback;
}
var ENV = Object.freeze({
  get BETTER_AUTH_SECRET() {
    return getEnvVar("BETTER_AUTH_SECRET");
  },
  get AUTH_SECRET() {
    return getEnvVar("AUTH_SECRET");
  },
  get BETTER_AUTH_TELEMETRY() {
    return getEnvVar("BETTER_AUTH_TELEMETRY");
  },
  get BETTER_AUTH_TELEMETRY_ID() {
    return getEnvVar("BETTER_AUTH_TELEMETRY_ID");
  },
  get NODE_ENV() {
    return getEnvVar("NODE_ENV", "development");
  },
  get PACKAGE_VERSION() {
    return getEnvVar("PACKAGE_VERSION", "0.0.0");
  },
  get BETTER_AUTH_TELEMETRY_ENDPOINT() {
    return getEnvVar("BETTER_AUTH_TELEMETRY_ENDPOINT", "https://telemetry.better-auth.com/v1/track");
  }
});
var COLORS_2 = 1;
var COLORS_16 = 4;
var COLORS_256 = 8;
var COLORS_16m = 24;
var TERM_ENVS = {
  eterm: COLORS_16,
  cons25: COLORS_16,
  console: COLORS_16,
  cygwin: COLORS_16,
  dtterm: COLORS_16,
  gnome: COLORS_16,
  hurd: COLORS_16,
  jfbterm: COLORS_16,
  konsole: COLORS_16,
  kterm: COLORS_16,
  mlterm: COLORS_16,
  mosh: COLORS_16m,
  putty: COLORS_16,
  st: COLORS_16,
  "rxvt-unicode-24bit": COLORS_16m,
  terminator: COLORS_16m,
  "xterm-kitty": COLORS_16m
};
var CI_ENVS_MAP = new Map(Object.entries({
  APPVEYOR: COLORS_256,
  BUILDKITE: COLORS_256,
  CIRCLECI: COLORS_16m,
  DRONE: COLORS_256,
  GITEA_ACTIONS: COLORS_16m,
  GITHUB_ACTIONS: COLORS_16m,
  GITLAB_CI: COLORS_256,
  TRAVIS: COLORS_256
}));
var TERM_ENVS_REG_EXP = [
  /ansi/,
  /color/,
  /linux/,
  /direct/,
  /^con[0-9]*x[0-9]/,
  /^rxvt/,
  /^screen/,
  /^xterm/,
  /^vt100/,
  /^vt220/
];
function getColorDepth() {
  if (getEnvVar("FORCE_COLOR") !== undefined)
    switch (getEnvVar("FORCE_COLOR")) {
      case "":
      case "1":
      case "true":
        return COLORS_16;
      case "2":
        return COLORS_256;
      case "3":
        return COLORS_16m;
      default:
        return COLORS_2;
    }
  if (getEnvVar("NODE_DISABLE_COLORS") !== undefined && getEnvVar("NODE_DISABLE_COLORS") !== "" || getEnvVar("NO_COLOR") !== undefined && getEnvVar("NO_COLOR") !== "" || getEnvVar("TERM") === "dumb")
    return COLORS_2;
  if (getEnvVar("TMUX"))
    return COLORS_16m;
  if ("TF_BUILD" in env && "AGENT_NAME" in env)
    return COLORS_16;
  if ("CI" in env) {
    for (const { 0: envName, 1: colors } of CI_ENVS_MAP)
      if (envName in env)
        return colors;
    if (getEnvVar("CI_NAME") === "codeship")
      return COLORS_256;
    return COLORS_2;
  }
  if ("TEAMCITY_VERSION" in env)
    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.exec(getEnvVar("TEAMCITY_VERSION")) !== null ? COLORS_16 : COLORS_2;
  switch (getEnvVar("TERM_PROGRAM")) {
    case "iTerm.app":
      if (!getEnvVar("TERM_PROGRAM_VERSION") || /^[0-2]\./.exec(getEnvVar("TERM_PROGRAM_VERSION")) !== null)
        return COLORS_256;
      return COLORS_16m;
    case "HyperTerm":
    case "MacTerm":
      return COLORS_16m;
    case "Apple_Terminal":
      return COLORS_256;
  }
  if (getEnvVar("COLORTERM") === "truecolor" || getEnvVar("COLORTERM") === "24bit")
    return COLORS_16m;
  if (getEnvVar("TERM")) {
    if (/truecolor/.exec(getEnvVar("TERM")) !== null)
      return COLORS_16m;
    if (/^xterm-256/.exec(getEnvVar("TERM")) !== null)
      return COLORS_256;
    const termEnv = getEnvVar("TERM").toLowerCase();
    if (TERM_ENVS[termEnv])
      return TERM_ENVS[termEnv];
    if (TERM_ENVS_REG_EXP.some((term) => term.exec(termEnv) !== null))
      return COLORS_16;
  }
  if (getEnvVar("COLORTERM"))
    return COLORS_16;
  return COLORS_2;
}
var TTY_COLORS = {
  reset: "\x1B[0m",
  bright: "\x1B[1m",
  dim: "\x1B[2m",
  undim: "\x1B[22m",
  underscore: "\x1B[4m",
  blink: "\x1B[5m",
  reverse: "\x1B[7m",
  hidden: "\x1B[8m",
  fg: {
    black: "\x1B[30m",
    red: "\x1B[31m",
    green: "\x1B[32m",
    yellow: "\x1B[33m",
    blue: "\x1B[34m",
    magenta: "\x1B[35m",
    cyan: "\x1B[36m",
    white: "\x1B[37m"
  },
  bg: {
    black: "\x1B[40m",
    red: "\x1B[41m",
    green: "\x1B[42m",
    yellow: "\x1B[43m",
    blue: "\x1B[44m",
    magenta: "\x1B[45m",
    cyan: "\x1B[46m",
    white: "\x1B[47m"
  }
};
var levels = [
  "debug",
  "info",
  "success",
  "warn",
  "error"
];
function shouldPublishLog(currentLogLevel, logLevel) {
  return levels.indexOf(logLevel) >= levels.indexOf(currentLogLevel);
}
var levelColors = {
  info: TTY_COLORS.fg.blue,
  success: TTY_COLORS.fg.green,
  warn: TTY_COLORS.fg.yellow,
  error: TTY_COLORS.fg.red,
  debug: TTY_COLORS.fg.magenta
};
var formatMessage = (level, message, colorsEnabled) => {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  if (colorsEnabled)
    return `${TTY_COLORS.dim}${timestamp}${TTY_COLORS.reset} ${levelColors[level]}${level.toUpperCase()}${TTY_COLORS.reset} ${TTY_COLORS.bright}[Better Auth]:${TTY_COLORS.reset} ${message}`;
  return `${timestamp} ${level.toUpperCase()} [Better Auth]: ${message}`;
};
var createLogger = (options) => {
  const enabled = options?.disabled !== true;
  const logLevel = options?.level ?? "error";
  const colorsEnabled = options?.disableColors !== undefined ? !options.disableColors : getColorDepth() !== 1;
  const LogFunc = (level, message, args = []) => {
    if (!enabled || !shouldPublishLog(logLevel, level))
      return;
    const formattedMessage = formatMessage(level, message, colorsEnabled);
    if (!options || typeof options.log !== "function") {
      if (level === "error")
        console.error(formattedMessage, ...args);
      else if (level === "warn")
        console.warn(formattedMessage, ...args);
      else
        console.log(formattedMessage, ...args);
      return;
    }
    options.log(level === "success" ? "info" : level, message, ...args);
  };
  return {
    ...Object.fromEntries(levels.map((level) => [level, (...[message, ...args]) => LogFunc(level, message, args)])),
    get level() {
      return logLevel;
    }
  };
};
var logger = createLogger();

// node_modules/@better-auth/core/dist/utils-U2L7n92V.mjs
function defineErrorCodes(codes) {
  return codes;
}

// node_modules/@better-auth/core/dist/error-DP1xOn7P.mjs
var BASE_ERROR_CODES = defineErrorCodes({
  USER_NOT_FOUND: "User not found",
  FAILED_TO_CREATE_USER: "Failed to create user",
  FAILED_TO_CREATE_SESSION: "Failed to create session",
  FAILED_TO_UPDATE_USER: "Failed to update user",
  FAILED_TO_GET_SESSION: "Failed to get session",
  INVALID_PASSWORD: "Invalid password",
  INVALID_EMAIL: "Invalid email",
  INVALID_EMAIL_OR_PASSWORD: "Invalid email or password",
  SOCIAL_ACCOUNT_ALREADY_LINKED: "Social account already linked",
  PROVIDER_NOT_FOUND: "Provider not found",
  INVALID_TOKEN: "Invalid token",
  ID_TOKEN_NOT_SUPPORTED: "id_token not supported",
  FAILED_TO_GET_USER_INFO: "Failed to get user info",
  USER_EMAIL_NOT_FOUND: "User email not found",
  EMAIL_NOT_VERIFIED: "Email not verified",
  PASSWORD_TOO_SHORT: "Password too short",
  PASSWORD_TOO_LONG: "Password too long",
  USER_ALREADY_EXISTS: "User already exists.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "User already exists. Use another email.",
  EMAIL_CAN_NOT_BE_UPDATED: "Email can not be updated",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "Credential account not found",
  SESSION_EXPIRED: "Session expired. Re-authenticate to perform this action.",
  FAILED_TO_UNLINK_LAST_ACCOUNT: "You can't unlink your last account",
  ACCOUNT_NOT_FOUND: "Account not found",
  USER_ALREADY_HAS_PASSWORD: "User already has a password. Provide that to delete the account.",
  CROSS_SITE_NAVIGATION_LOGIN_BLOCKED: "Cross-site navigation login blocked. This request appears to be a CSRF attack.",
  VERIFICATION_EMAIL_NOT_ENABLED: "Verification email isn't enabled",
  EMAIL_ALREADY_VERIFIED: "Email is already verified",
  EMAIL_MISMATCH: "Email mismatch",
  SESSION_NOT_FRESH: "Session is not fresh",
  LINKED_ACCOUNT_ALREADY_EXISTS: "Linked account already exists",
  INVALID_ORIGIN: "Invalid origin",
  INVALID_CALLBACK_URL: "Invalid callbackURL",
  INVALID_REDIRECT_URL: "Invalid redirectURL",
  INVALID_ERROR_CALLBACK_URL: "Invalid errorCallbackURL",
  INVALID_NEW_USER_CALLBACK_URL: "Invalid newUserCallbackURL",
  MISSING_OR_NULL_ORIGIN: "Missing or null Origin",
  CALLBACK_URL_REQUIRED: "callbackURL is required",
  FAILED_TO_CREATE_VERIFICATION: "Unable to create verification",
  FIELD_NOT_ALLOWED: "Field not allowed to be set",
  ASYNC_VALIDATION_NOT_SUPPORTED: "Async validation is not supported",
  VALIDATION_ERROR: "Validation Error",
  MISSING_FIELD: "Field is required"
});

// node_modules/better-auth/dist/client/parser.mjs
var SPECIAL_VALUES = {
  true: true,
  false: false,
  null: null,
  undefined: undefined,
  nan: NaN,
  infinity: Number.POSITIVE_INFINITY,
  "-infinity": Number.NEGATIVE_INFINITY
};

// node_modules/better-auth/dist/client/session-atom.mjs
import { atom as atom2, onMount as onMount2 } from "nanostores";

// src/client.ts
var paymongoClient = () => {
  const $configSignal = atom3(false);
  const $subscriptionSignal = atom3(false);
  return {
    id: "paymongo",
    $InferServerPlugin: {},
    getAtoms: ($fetch) => {
      const config = useAuthQuery($configSignal, "/paymongo/config", $fetch, { method: "GET" });
      const subscription = useAuthQuery($subscriptionSignal, "/paymongo/get-subscription", $fetch, { method: "GET" });
      return {
        $configSignal,
        $subscriptionSignal,
        config,
        subscription
      };
    },
    getActions: ($fetch) => ({
      createPaymentIntent: async (options, fetchOptions) => {
        return $fetch(`/paymongo/create-payment-intent`, {
          method: "POST",
          body: options,
          ...fetchOptions
        });
      },
      createSubscription: async (options, fetchOptions) => {
        return $fetch(`/paymongo/create-subscription`, {
          method: "POST",
          body: options,
          ...fetchOptions
        });
      },
      verifySubscription: async (options, fetchOptions) => {
        const query = options?.organizationId ? `?organizationId=${options.organizationId}` : "";
        return $fetch(`/paymongo/verify-subscription${query}`, {
          method: "GET",
          ...fetchOptions
        });
      },
      cancelSubscription: async (options, fetchOptions) => {
        return $fetch(`/paymongo/cancel-subscription`, {
          method: "POST",
          body: options ?? {},
          ...fetchOptions
        });
      },
      getPlan: async (options, fetchOptions) => {
        const query = options?.organizationId ? `?organizationId=${options.organizationId}` : "";
        const res = await $fetch(`/paymongo/get-subscription${query}`, {
          method: "GET",
          ...fetchOptions
        });
        return {
          data: res.data?.planId ?? null,
          error: res.error
        };
      },
      getSubscription: async (options, fetchOptions) => {
        const query = options?.organizationId ? `?organizationId=${options.organizationId}` : "";
        return $fetch(`/paymongo/get-subscription${query}`, {
          method: "GET",
          ...fetchOptions
        });
      },
      hasActiveSubscription: async (options, fetchOptions) => {
        const query = options?.organizationId ? `?organizationId=${options.organizationId}` : "";
        const res = await $fetch(`/paymongo/get-subscription${query}`, {
          method: "GET",
          ...fetchOptions
        });
        const isActive = res.data?.status === "active" || res.data?.status === "trialing";
        return {
          data: isActive,
          error: res.error
        };
      },
      convertTrial: async (options, fetchOptions) => {
        return $fetch(`/paymongo/convert-trial`, {
          method: "POST",
          body: options,
          ...fetchOptions
        });
      },
      updatePayment: async (options, fetchOptions) => {
        return $fetch(`/paymongo/update-payment`, {
          method: "POST",
          body: options,
          ...fetchOptions
        });
      },
      switchPlan: async (options, fetchOptions) => {
        return $fetch(`/paymongo/switch-plan`, {
          method: "POST",
          body: options,
          ...fetchOptions
        });
      },
      addAddon: async (options, fetchOptions) => {
        return $fetch(`/paymongo/add-addon`, {
          method: "POST",
          body: { quantity: 1, ...options },
          ...fetchOptions
        });
      },
      checkUsage: async (options, fetchOptions) => {
        const params = new URLSearchParams({ limitKey: options.limitKey });
        if (options.organizationId)
          params.set("organizationId", options.organizationId);
        return $fetch(`/paymongo/check-usage?${params}`, {
          method: "GET",
          ...fetchOptions
        });
      },
      incrementUsage: async (options, fetchOptions) => {
        return $fetch(`/paymongo/increment-usage`, {
          method: "POST",
          body: { quantity: 1, ...options },
          ...fetchOptions
        });
      }
    }),
    pathMethods: {
      "/paymongo/config": "GET",
      "/paymongo/get-subscription": "GET",
      "/paymongo/verify-subscription": "GET",
      "/paymongo/check-usage": "GET"
    },
    atomListeners: [
      {
        matcher(path) {
          return path === "/paymongo/config";
        },
        signal: "$configSignal"
      },
      {
        matcher(path) {
          return path.startsWith("/paymongo/") && (path.includes("subscription") || path.includes("switch-plan") || path.includes("convert-trial") || path.includes("cancel") || path.includes("add-addon"));
        },
        signal: "$subscriptionSignal"
      }
    ]
  };
};
export {
  paymongoClient
};

//# debugId=15551F559757304664756E2164756E21
