// The front door for login.
// Every request to /api/auth/... (sign up, sign in, sign out) lands here
// and is passed to Better Auth.

import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "../../../../lib/auth";

export const { GET, POST } = toNextJsHandler(auth);