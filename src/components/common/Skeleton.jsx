import clsx from 'clsx';
import PropTypes from 'prop-types';

export const Skeleton = ({ className, rounded = 'rounded-2xl', shimmer = true, children }) => (
  <div
    className={clsx(
      'relative isolate overflow-hidden bg-white/40 backdrop-blur-sm shadow-inner border border-white/40',
      rounded,
      className,
    )}
    aria-hidden
  >
    {shimmer && (
      <span className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    )}
    <span className="opacity-0">{children}</span>
  </div>
);

Skeleton.propTypes = {
  className: PropTypes.string,
  rounded: PropTypes.string,
  shimmer: PropTypes.bool,
  children: PropTypes.node,
};

Skeleton.defaultProps = {
  className: '',
  rounded: 'rounded-2xl',
  shimmer: true,
  children: null,
};

export default Skeleton;
