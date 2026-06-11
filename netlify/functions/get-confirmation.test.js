import { afterEach, describe, expect, it, vi } from "vitest";
import { handler } from "./get-confirmation";

describe("get-confirmation Netlify function", () => {
  afterEach(() => {
    delete process.env.CLAUDE_API_KEY;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    vi.unstubAllGlobals();
  });

  it("returns only the generated confirmation text", async () => {
    process.env.CLAUDE_API_KEY = "test-key";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key";

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: "user-1",
          email: "amelia@example.com",
          user_metadata: { full_name: "Amelia" },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          content: [
            {
              type: "text",
              text: "Cleared for takeoff, Amelia. We will see you at 01:00 PM – 04:00 PM! ✈️",
            },
          ],
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const response = await handler({
      httpMethod: "POST",
      headers: {
        authorization: "Bearer access-token",
      },
      body: JSON.stringify({
        name: "Amelia",
        time: "01:00 PM – 04:00 PM",
      }),
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.anthropic.com/v1/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-api-key": "test-key",
        }),
      }),
    );
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      message:
        "Cleared for takeoff, Amelia. We will see you at 01:00 PM – 04:00 PM! ✈️",
    });
  });

  it("rejects non-POST requests", async () => {
    process.env.CLAUDE_API_KEY = "test-key";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key";

    const response = await handler({ httpMethod: "GET" });

    expect(response.statusCode).toBe(405);
  });

  it("rejects unauthenticated requests", async () => {
    process.env.CLAUDE_API_KEY = "test-key";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key";

    const response = await handler({
      httpMethod: "POST",
      headers: {},
      body: JSON.stringify({
        name: "Amelia",
        time: "01:00 PM – 04:00 PM",
      }),
    });

    expect(response.statusCode).toBe(401);
  });

  it("rejects invalid flight times before calling Claude", async () => {
    process.env.CLAUDE_API_KEY = "test-key";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: "user-1",
        email: "amelia@example.com",
        user_metadata: { full_name: "Amelia" },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const response = await handler({
      httpMethod: "POST",
      headers: {
        authorization: "Bearer access-token",
      },
      body: JSON.stringify({
        name: "Amelia",
        time: "07:00 PM – 10:00 PM",
      }),
    });

    expect(response.statusCode).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});