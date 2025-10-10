import PropTypes from 'prop-types';

export const SectionHeading = ({ eyebrow, title, description, alignment = 'center' }) => {
  const alignClass = alignment === 'left' ? 'items-start text-left' : 'items-center text-center';

  return (
    <div className={`flex flex-col gap-2 ${alignClass}`}>
      {eyebrow && (
        <span className="uppercase tracking-[0.35em] text-sm text-gov-accent font-semibold">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold text-slate-900 text-balance">
        {title}
      </h2>
      {description && (
        <p className="text-base sm:text-lg text-slate-600 max-w-3xl text-balance">
          {description}
        </p>
      )}
    </div>
  );
};

SectionHeading.propTypes = {
  eyebrow: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  alignment: PropTypes.oneOf(['center', 'left']),
};
