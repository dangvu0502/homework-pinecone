import React from 'react';

interface UploadProgressProps {
  progress: number;
  filename: string;
  status: 'uploading' | 'uploaded' | 'processing' | 'ready' | 'error';
  error?: string;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  filename,
  status,
  error,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-500';
      case 'uploaded':
      case 'processing':
        return 'bg-yellow-500';
      case 'ready':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return `Uploading... ${progress}%`;
      case 'uploaded':
        return 'Uploaded successfully';
      case 'processing':
        return 'Processing document...';
      case 'ready':
        return 'Ready for use';
      case 'error':
        return error || 'Upload failed';
      default:
        return 'Unknown status';
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700 truncate">
          {filename}
        </span>
        <span className="text-xs text-gray-500">
          {getStatusText()}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
          style={{ width: `${status === 'error' ? 100 : progress}%` }}
        />
      </div>
      
      {status === 'error' && error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};