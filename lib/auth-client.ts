// The login system, browser side.
// The sign-in form uses this to talk to the server.

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();