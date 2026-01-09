import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ChartFooter } from "./ChartFooter";

describe("ChartFooter", () => {
  it("should render legend items", () => {
    const { getByText } = render(<ChartFooter />);

    expect(getByText("Regular Usage")).toBeInTheDocument();
    expect(getByText("Over Usage")).toBeInTheDocument();
  });

  it("should render timezone indicator", () => {
    const { getByText } = render(<ChartFooter />);

    expect(getByText("Dates are displayed in UTC")).toBeInTheDocument();
  });

  it("should render legend color indicators", () => {
    const { container } = render(<ChartFooter />);

    // Check for colored dot elements
    const dots = container.querySelectorAll(".rounded-full");
    expect(dots.length).toBe(2);
  });
});