import PropTypes from 'prop-types';

export const Card = ({ className = '', children }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      {children}
    </div>
  );
};

Card.propTypes = {
  className: PropTypes.string,  // className is optional
  children: PropTypes.node.isRequired,  // Children are required and should be a valid React node
};

export const CardContent = ({ className = '', children }) => {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
};

CardContent.propTypes = {
  className: PropTypes.string,  // className is optional
  children: PropTypes.node.isRequired,  // Children are required and should be a valid React node
};

// Ajout du composant CardHeader
export const CardHeader = ({ className = '', children }) => {
  return (
    <div className={`bg-gray-200 rounded-t-lg p-4 ${className}`}>
      {children}
    </div>
  );
};

CardHeader.propTypes = {
  className: PropTypes.string,  // className is optional
  children: PropTypes.node.isRequired,  // Children are required and should be a valid React node
};
