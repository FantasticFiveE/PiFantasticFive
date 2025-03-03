import PropTypes from 'prop-types'; // Import PropTypes

export const Avatar = ({ src, alt, className }) => {
  return (
    <img
      src={src || "https://via.placeholder.com/150"}
      alt={alt || "Avatar"}
      className={`rounded-full object-cover ${className}`}
    />
  );
};

Avatar.propTypes = {
  src: PropTypes.string, // Validate the src prop as a string
  alt: PropTypes.string, // Validate the alt prop as a string
  className: PropTypes.string, // Validate the className prop as a string
};

Avatar.defaultProps = {
  src: "https://via.placeholder.com/150", // Default value for src
  alt: "Avatar", // Default value for alt
};
