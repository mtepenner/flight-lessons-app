import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Auth from "./Auth";

describe("Auth", () => {
  it("submits sign-in credentials", async () => {
    const user = userEvent.setup();
    const onSignIn = vi.fn().mockResolvedValue(undefined);

    render(
      <Auth
        errorMessage=""
        noticeMessage=""
        onSignIn={onSignIn}
        onSignUp={vi.fn()}
      />,
    );

    await user.clear(screen.getByLabelText(/email/i));
    await user.type(screen.getByLabelText(/email/i), "pilot@example.com");
    await user.clear(screen.getByLabelText(/password/i));
    await user.type(screen.getByLabelText(/password/i), "super-secret");
    await user.click(screen.getByRole("button", { name: /enter the hangar/i }));

    expect(onSignIn).toHaveBeenCalledWith({
      email: "pilot@example.com",
      password: "super-secret",
    });
  });

  it("submits sign-up details with the pilot name", async () => {
    const user = userEvent.setup();
    const onSignUp = vi.fn().mockResolvedValue(undefined);

    render(
      <Auth
        errorMessage=""
        noticeMessage=""
        onSignIn={vi.fn()}
        onSignUp={onSignUp}
      />,
    );

    await user.click(screen.getByRole("button", { name: /create account/i }));
    await user.type(screen.getByLabelText(/pilot name/i), "Amelia Earhart");
    await user.clear(screen.getByLabelText(/email/i));
    await user.type(screen.getByLabelText(/email/i), "amelia@example.com");
    await user.clear(screen.getByLabelText(/password/i));
    await user.type(screen.getByLabelText(/password/i), "propeller123");
    await user.click(screen.getByRole("button", { name: /create pilot account/i }));

    expect(onSignUp).toHaveBeenCalledWith({
      name: "Amelia Earhart",
      email: "amelia@example.com",
      password: "propeller123",
    });
  });
});