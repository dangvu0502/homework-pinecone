import React from 'react';

interface ErrorAlertProps {
  errors: string[];
  onClose: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ errors, onClose }) => {
  if (errors.length === 0) return null;

  return (
    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg 
            className="w-5 h-5 text-red-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {errors.length === 1 ? 'File Upload Error' : `${errors.length} File Upload Errors`}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            {errors.length === 1 ? (
              <p>{errors[0]}</p>
            ) : (
              <ul className="space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
              aria-label="Close error alert"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};