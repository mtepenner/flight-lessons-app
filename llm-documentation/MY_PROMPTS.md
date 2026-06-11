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
