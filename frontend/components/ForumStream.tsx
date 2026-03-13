'use client'

export default function ForumStream({ events }: { events: any[] }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Discussion</h2>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {events.map((event, i) => (
          <div key={i} className="border-l-4 border-blue-500 pl-4 py-2">
            {event.type === 'status' && (
              <p className="text-gray-600 italic">{event.data}</p>
            )}
            {event.type === 'context' && (
              <div className="text-sm">
                <p className="font-medium">Context Analyzed:</p>
                <p className="text-gray-700">{event.data.situation}</p>
              </div>
            )}
            {event.type === 'candidates' && (
              <p className="text-sm text-gray-700">
                Found {event.data.count} potential matches
              </p>
            )}
            {event.type === 'forum' && (
              <div className="text-sm">
                <span className="font-medium text-blue-600">{event.data.agent}:</span>
                <span className="text-gray-700 ml-2">{event.data.content}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
