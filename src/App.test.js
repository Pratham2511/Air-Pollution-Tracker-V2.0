import { render, screen } from '@testing-library/react';
import App from './App';

test('renders landing hero headline', () => {
  render(<App />);
  expect(screen.getByText(/Realtime air health intelligence/i)).toBeInTheDocument();
});
