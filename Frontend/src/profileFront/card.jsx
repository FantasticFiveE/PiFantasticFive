import PropTypes from 'prop-types';
import "./card.css";  // Assuming card.css has the styles you need

export const Card = ({ className = '', children }) => {
  return (
    <div className={`futuristic-card ${className}`}>
      {children}
    </div>
  );
};

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export const CardHeader = ({ className = '', children }) => {
  return (
    <div className={`futuristic-card-header ${className}`}>
      {children}
    </div>
  );
};

CardHeader.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export const CardContent = ({ className = '', children }) => {
  return (
    <div className={`futuristic-card-content ${className}`}>
      {children}
    </div>
  );
};

CardContent.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export const CardFooter = ({ className = '', children }) => {
  return (
    <div className={`futuristic-card-footer ${className}`}>
      {children}
    </div>
  );
};

CardFooter.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};
