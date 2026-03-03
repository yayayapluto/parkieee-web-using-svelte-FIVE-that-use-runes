/// <reference types="vite/client" />

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "PUBLIC_",
  client: {
    PUBLIC_API_BASE_URL: z.url(),
    PUBLIC_POLL_INTERVAL_FAST: z.coerce.number().default(5_000),
    PUBLIC_POLL_INTERVAL_NORMAL: z.coerce.number().default(10_000),
    PUBLIC_POLL_INTERVAL_SLOW: z.coerce.number().default(30_000),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});
