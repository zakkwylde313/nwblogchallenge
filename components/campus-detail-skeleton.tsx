export default function CampusDetailSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8 animate-pulse">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
        </div>
      </div>

      <div className="p-4">
        <div className="h-10 bg-gray-100 mb-4"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 mb-2 rounded"></div>
        ))}
      </div>
    </div>
  )
}
