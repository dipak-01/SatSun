import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

// Minimal tests to validate vitest + jsdom + RTL wiring

describe("frontend smoke", () => {
  it("math works", () => {
    expect(1 + 1).toBe(2);
  });

  it("renders a basic element", () => {
    render(<div data-testid="root">Hello</div>);
    expect(document.querySelector('[data-testid="root"]')).toHaveTextContent(
      "Hello"
    );
  });
});
