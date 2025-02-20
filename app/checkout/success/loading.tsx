export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="animate-pulse space-y-6">
          {/* Loading icon placeholder */}
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto"></div>
          
          {/* Title placeholder */}
          <div className="h-8 bg-gray-200 rounded-lg w-3/4 mx-auto"></div>
          
          {/* Description placeholder */}
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6 mx-auto"></div>
          </div>
          
          {/* Reference number placeholder */}
          <div className="h-4 bg-gray-200 rounded w-2/4 mx-auto"></div>
          
          {/* Additional info placeholders */}
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6 mx-auto"></div>
          </div>
          
          {/* Button placeholder */}
          <div className="h-12 bg-gray-200 rounded-lg w-48 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}
