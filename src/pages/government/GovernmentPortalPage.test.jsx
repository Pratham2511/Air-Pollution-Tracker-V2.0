import { render, screen, within } from "@testing-library/react";
import { GovernmentPortalPage } from "./GovernmentPortalPage";

describe("GovernmentPortalPage", () => {
  it("renders navigation shell and key modules", () => {
    render(<GovernmentPortalPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /Government Analytics Command Center/i })
    ).toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: /Government portal navigation/i });
    expect(within(nav).getAllByRole("link")).toHaveLength(6);

    expect(screen.getByRole("heading", { level: 2, name: /Live AQI Situation Room/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /Historical Trend Analysis/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /Pollutant Intelligence Desk/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /Heatmap Visualization/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /Export & Reporting Center/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /Incident Management Desk/i })).toBeInTheDocument();
  });
});
