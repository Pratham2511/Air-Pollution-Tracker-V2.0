import { render, screen } from '@testing-library/react';
import App from './App';

test('renders landing hero headline', async () => {
  render(<App />);
  const heroHeading = await screen.findByText(/Realtime air health intelligence/i, undefined, {
    timeout: 5000,
  });
  expect(heroHeading).toBeInTheDocument();
});
