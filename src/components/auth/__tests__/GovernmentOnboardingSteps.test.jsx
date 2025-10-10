import { render, screen } from '@testing-library/react';
import { GovernmentOnboardingSteps } from '../GovernmentOnboardingSteps';

describe('GovernmentOnboardingSteps', () => {
  it('marks the current step and shows metadata for verify phase', () => {
    render(<GovernmentOnboardingSteps activeStep="verify" />);

    expect(screen.getByText(/In Progress/i)).toBeInTheDocument();
    expect(screen.getByText(/Validate Access/i)).toBeInTheDocument();
    expect(screen.getByText(/Completed/i)).toBeInTheDocument();
  });

  it('defaults to register when step is unknown', () => {
    render(<GovernmentOnboardingSteps activeStep="register" />);

    expect(screen.getByText(/Submit Credentials/i)).toBeInTheDocument();
  });
});
