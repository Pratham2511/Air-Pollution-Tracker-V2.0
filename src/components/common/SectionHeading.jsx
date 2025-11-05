import PropTypes from 'prop-types';

export const SectionHeading = ({ eyebrow, title, description, alignment = 'center', tone = 'light', size = 'default' }) => {
  const alignClass = alignment === 'left' ? 'items-start text-left' : 'items-center text-center';
  const isDarkTone = tone === 'dark';

  const eyebrowClass = isDarkTone
    ? 'text-xs uppercase tracking-[0.35em] text-cyan-200/80 font-semibold'
    : 'uppercase tracking-[0.35em] text-sm text-gov-accent font-semibold';

  const titleClass = (() => {
    if (isDarkTone) {
      return size === 'compact'
        ? 'text-xl sm:text-2xl font-display font-semibold text-white text-balance'
        : 'text-2xl sm:text-3xl font-display font-semibold text-white text-balance';
    }
    return size === 'compact'
      ? 'text-2xl sm:text-3xl font-display font-semibold text-slate-900 text-balance'
      : 'text-3xl sm:text-4xl lg:text-5xl font-display font-semibold text-slate-900 text-balance';
  })();

  const descriptionClass = isDarkTone
    ? 'text-sm sm:text-base text-slate-300 max-w-3xl text-balance'
    : 'text-base sm:text-lg text-slate-600 max-w-3xl text-balance';

  return (
    <div className={`flex flex-col gap-2 ${alignClass}`}>
      {eyebrow && (
        <span className={eyebrowClass}>
          {eyebrow}
        </span>
      )}
      <h2 className={titleClass}>
        {title}
      </h2>
      {description && (
        <p className={descriptionClass}>
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
  tone: PropTypes.oneOf(['light', 'dark']),
  size: PropTypes.oneOf(['default', 'compact']),
};
