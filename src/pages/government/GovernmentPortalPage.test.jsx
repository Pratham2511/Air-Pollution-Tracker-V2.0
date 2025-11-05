import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GovernmentPortalPage } from './GovernmentPortalPage';

const renderWithProviders = (ui) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, cacheTime: 0 },
      mutations: { retry: false },
    },
  });

  const result = render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);

  return {
    ...result,
    cleanup: () => {
      queryClient.clear();
      result.unmount();
    },
  };
};

describe("GovernmentPortalPage", () => {
  it('renders navigation shell and key modules', () => {
    const { cleanup } = renderWithProviders(<GovernmentPortalPage />);

    try {
      expect(
        screen.getByRole('heading', { level: 1, name: /Government Analytics Command Center/i }),
      ).toBeInTheDocument();

      const nav = screen.getByRole('navigation', { name: /Government portal navigation/i });
      expect(within(nav).getAllByRole('link')).toHaveLength(6);

      expect(screen.getByRole('heading', { level: 2, name: /Live AQI Situation Room/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: /Operational Telemetry & Alerts/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /Historical Trend Analysis/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /Pollutant Intelligence Desk/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /Heatmap Visualization/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /Export & Reporting Center/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /Incident Management Desk/i })).toBeInTheDocument();
    } finally {
      cleanup();
    }
  });

  it('exposes measurement upload controls and placeholders', () => {
    const { cleanup } = renderWithProviders(<GovernmentPortalPage />);

    try {
  expect(screen.getByText(/Upload CSV/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /Measurement Ingestion/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /Upload Activity/i })).toBeInTheDocument();
      expect(screen.getByText(/No uploads yet/i)).toBeInTheDocument();
      expect(screen.getByText(/Measurement uploads will appear here once processed/i)).toBeInTheDocument();
    } finally {
      cleanup();
    }
  });
});
