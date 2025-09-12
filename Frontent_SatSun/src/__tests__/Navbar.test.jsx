import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import Navbar from "../components/Navbar";

describe("Navbar", () => {
  const setup = () =>
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

  it("renders banner and brand link", () => {
    setup();
    // Header landmark
    expect(screen.getByRole("banner")).toBeInTheDocument();
    // Brand link (uses aria-label)
    expect(
      screen.getByRole("link", { name: /SatSun home/i })
    ).toBeInTheDocument();
  });

  it("has primary navigation links", () => {
    setup();
    expect(screen.getByRole("link", { name: /Weekend/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Planner/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Activities/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Calendar/i })).toBeInTheDocument();
  });

  it("shows theme selector control", () => {
    setup();
    expect(
      screen.getByRole("button", { name: /Theme selector/i })
    ).toBeInTheDocument();
  });
});
