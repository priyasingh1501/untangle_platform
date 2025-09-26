import React from 'react';

/**
 * SafeRender component to prevent objects from being rendered directly as React children
 * This component ensures that only safe values are rendered
 */
const SafeRender = ({ children, fallback = '' }) => {
  // Function to safely render any value
  const safeRender = (value) => {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return fallback;
    }
    
    // Handle arrays - render each item safely
    if (Array.isArray(value)) {
      return value.map((item, index) => (
        <React.Fragment key={index}>
          {safeRender(item)}
        </React.Fragment>
      ));
    }
    
    // Handle objects - convert to string or use fallback
    if (typeof value === 'object') {
      console.warn('Attempted to render object directly:', value);
      
      // If it has common display properties, try to extract them
      if (value.name) return String(value.name);
      if (value.title) return String(value.title);
      if (value.text) return String(value.text);
      if (value.content) return String(value.content);
      if (value.value) return String(value.value);
      
      // Otherwise return fallback
      return fallback;
    }
    
    // Handle functions
    if (typeof value === 'function') {
      console.warn('Attempted to render function directly:', value);
      return fallback;
    }
    
    // Handle symbols
    if (typeof value === 'symbol') {
      console.warn('Attempted to render symbol directly:', value);
      return fallback;
    }
    
    // Handle safe primitive values
    return String(value);
  };

  return safeRender(children);
};

export default SafeRender;
