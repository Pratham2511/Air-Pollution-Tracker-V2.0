import { act, fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { ToastProvider, useToast } from '../ToastProvider';

const TestHarness = () => {
  const { addToast } = useToast();
  return (
    <button
      type="button"
      onClick={() => addToast({ title: 'Test toast', description: 'Toast body', duration: Infinity })}
    >
      Notify
    </button>
  );
};

describe('ToastProvider', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders toast content when triggered', () => {
    render(
      <ToastProvider>
        <TestHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /notify/i }));

    expect(screen.getByText('Test toast')).toBeInTheDocument();
    expect(screen.getByText('Toast body')).toBeInTheDocument();
  });

  it('auto dismisses toast after duration', async () => {
    const AutoDismissHarness = () => {
      const { addToast } = useToast();
      return (
        <button type="button" onClick={() => addToast({ title: 'Auto dismiss', duration: 50 })}>
          Trigger
        </button>
      );
    };

    render(
      <ToastProvider>
        <AutoDismissHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /trigger/i }));
    expect(screen.getByText('Auto dismiss')).toBeInTheDocument();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    await waitForElementToBeRemoved(() => screen.queryByText('Auto dismiss'));
  });
});
