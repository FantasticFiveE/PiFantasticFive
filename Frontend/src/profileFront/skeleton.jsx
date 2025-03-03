import PropTypes from 'prop-types'; // Don't forget to import PropTypes

const Skeleton = ({ className }) => {
  return <div className={`bg-gray-300 animate-pulse ${className}`}></div>;
};

Skeleton.propTypes = {
  className: PropTypes.string, // Adding className to propTypes validation
};

export { Skeleton };
