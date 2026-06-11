# The Prompts I Used When Conversing with GitHub Copilot

## Model Settings

- Model used: GPT-5.4
- Thinking effort setting: Xhigh

## 1. Initial Build Request

Read over the flight-lessons-app documentation carefully and implement and test each phase of it.

## 2. Deployment and Security Request

Upload to the `main` branch of the GitHub repository and ensure Claude works; also every security measure. It is critical that double booking does not happen in this application.

## 3. Supabase Instructions I Pasted

### 3.1 Install Packages

Run this command to install the required dependencies.

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 3.2 Add Files

Add environment variables, create Supabase client helpers, and set up middleware to keep sessions refreshed.

#### `.env.local`

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://mfktfkcybahqdjhntxal.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_q2mn5-vZYqBxNpuVdPGc6g_QHodXp5V
```

#### `page.tsx`

```tsx
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos } = await supabase.from('todos').select()

  return (
    <ul>
      {todos?.map((todo) => (
        <li key={todo.id}>{todo.name}</li>
      ))}
    </ul>
  )
}
```

#### `utils/supabase/server.ts`

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  return createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
};
```

#### `utils/supabase/client.ts`

```ts
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = () => createBrowserClient(supabaseUrl!, supabaseKey!);
```

#### `utils/supabase/middleware.ts`

```ts
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  return supabaseResponse;
};
```

### 3.3 Install Agent Skills (Optional)

Agent Skills give AI coding tools ready-made instructions, scripts, and resources for working with Supabase more accurately and efficiently.

```bash
npx skills add supabase/agent-skills
```

## 4. Claude API Key Request

Help me get the Claude API key.

## 5. Netlify Deploy Error Prompt

The Netlify deploy errored, with the following guidance provided:

### Diagnosis

- Relevant log lines show the deploy failed because a serverless function name is invalid: see line 87 and the Netlify rule about allowed characters in function names at line 88. The build was then cancelled (line 83, line 84).
- Error type: invalid Netlify Functions name (serverless function filename contains an illegal character).
- Cause: a function named `get-confirmation.test` is being picked up by Netlify as a function. Netlify function names may only contain alphanumeric characters, hyphens or underscores. Dots are not allowed.

### Solution

1. Locate the offending function file in your repo.

```bash
git ls-files | grep -i "get-confirmation"
# or
rg "get-confirmation" || grep -R "get-confirmation" .
```

1. Fix by renaming (preferred) or moving the file.

If this is a real function you want deployed, rename it to remove the dot. Example:

```bash
git mv netlify/functions/get-confirmation.test.js netlify/functions/get-confirmation-test.js
git commit -m "Rename function to valid Netlify name: get-confirmation-test"
git push
```

If the file is a test file and should not be deployed, move it out of the functions directory or change its name so it is not detected as a function. Example:

```bash
git mv netlify/functions/get-confirmation.test.js tests/get-confirmation.test.js
git commit -m "Move function test out of functions folder"
git push
```

1. If the filename is generated by your build process, update the build or config so generated function names do not include dots.

1. Re-trigger the Netlify build after pushing the change.

### Notes and Checks

- After renaming or moving, verify the file is committed and pushed to the repo before retrying the deploy.
- The key requirement: ensure no deployed function file has a dot in its name.

### Relevant Error Logs

```text
Line 0: build-image version: ac6eb13fbf000e5c09ad677efd8b7c3c2d0142b6 (noble-new-builds)
Line 1: buildbot version: 24ab26d65f817590ea807b86ec0d98d4dcebe8f9
Line 2: Fetching cached dependencies
Line 3: Failed to fetch cache, continuing with build
Line 4: Starting to prepare the repo for build
Line 5: No cached dependencies found. Cloning fresh repo
Line 6: git clone --filter=blob:none https://github.com/mtepenner/flight-lessons-app
Line 7: Preparing Git Reference refs/heads/main
Line 8: Installing dependencies
Line 9: mise ~/.config/mise/config.toml tools: python@3.14.3
Line 10: mise ~/.config/mise/config.toml tools: ruby@3.4.8
Line 11: mise ~/.config/mise/config.toml tools: go@1.26.2
Line 12: Downloading and installing node v22.22.3...
Line 13: Downloading https://nodejs.org/dist/v22.22.3/node-v22.22.3-linux-x64.tar.xz...
Line 74:
Line 75:
Line 76: (Functions bundling completed in 1.4s)
Line 77:
Line 78: Deploy site
Line 79: ────────────────────────────────────────────────────────────────
Line 80:
Line 81: Starting to deploy site from 'dist'
Line 82: Calculating files to upload
Line 83: Execution cancelled
Line 84: Failing build: Failed to build site
Line 85: Finished processing build request in 15.7s
Line 86: ** ERROR **
Line 87: The following serverless functions failed to deploy: get-confirmation.test
Line 88: To deploy these functions successfully, change the function names to contain only alphanumeric characters, hyphens or underscore
Line 89: Failed during stage 'building site': Command was cancelled
```
