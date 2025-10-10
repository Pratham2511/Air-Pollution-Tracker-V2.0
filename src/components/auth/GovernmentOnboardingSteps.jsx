import PropTypes from 'prop-types';
import clsx from 'clsx';

const STEPS = [
  {
    id: 'register',
    title: 'Submit Credentials',
    description: 'Provide verified identity, department, and jurisdiction.',
  },
  {
    id: 'verify',
    title: 'Validate Access',
    description: 'Approve the OTP within five minutes to unlock secure tools.',
  },
  {
    id: 'access',
    title: 'Command Center',
    description: 'Redirect into the government command center with verified clearance.',
  },
];

const resolveActiveIndex = (activeStep) => {
  if (activeStep === 'signin') return 2;
  const index = STEPS.findIndex((step) => step.id === activeStep);
  return index === -1 ? 0 : index;
};

export const GovernmentOnboardingSteps = ({ activeStep }) => {
  const activeIndex = resolveActiveIndex(activeStep);

  return (
    <ol className="grid gap-4 sm:grid-cols-3">
      {STEPS.map((step, index) => {
        const isComplete = index < activeIndex;
        const isActive = index === activeIndex;
        const status = isActive ? 'current' : isComplete ? 'done' : 'upcoming';

        return (
          <li
            key={step.id}
            className={clsx(
              'rounded-xl border px-4 py-3 transition shadow-sm',
              status === 'current' && 'border-gov-primary bg-gov-accent/10 text-gov-primary shadow-lg',
              status === 'done' && 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm',
              status === 'upcoming' && 'border-slate-200 bg-white text-slate-500'
            )}
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
              <span>{index + 1}</span>
              <span>
                {status === 'current' && 'In Progress'}
                {status === 'done' && 'Completed'}
                {status === 'upcoming' && 'Next'}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-700">{step.title}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{step.description}</p>
          </li>
        );
      })}
    </ol>
  );
};

GovernmentOnboardingSteps.propTypes = {
  activeStep: PropTypes.oneOf(['register', 'verify', 'signin']).isRequired,
};

export default GovernmentOnboardingSteps;
