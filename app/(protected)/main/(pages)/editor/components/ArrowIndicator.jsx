import React from 'react';
import './styles.css';

const ArrowIndicator = ({ visible }) => {
    return (
      <div
        className={`
          absolute -right-8 top-1/2 transform -translate-y-1/2
          transition-all duration-300 ease-in-out
          ${visible ? 'opacity-100' : 'opacity-0'}
        `}
      >
        <div className="flex items-center">
          <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-primary animate-flowRight"></div>
          <div className="text-primary animate-fadeInOut">
            <i className="pi pi-arrow-right text-lg"></i>
          </div>
        </div>
      </div>
    );
  };

  export default ArrowIndicator;
