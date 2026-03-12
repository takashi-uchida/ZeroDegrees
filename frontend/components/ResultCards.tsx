'use client'

const roleLabels = {
  future_self: { title: 'Future Self', color: 'bg-green-100 border-green-500', icon: '🚀' },
  comrade: { title: 'Comrade', color: 'bg-blue-100 border-blue-500', icon: '🤝' },
  guide: { title: 'Guide', color: 'bg-purple-100 border-purple-500', icon: '🧭' },
}

export default function ResultCards({ result }: { result: any }) {
  const people = [
    { ...result.future_self, role: 'future_self' },
    { ...result.comrade, role: 'comrade' },
    { ...result.guide, role: 'guide' },
  ]

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-center">Your Matches</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {people.map((person: any) => {
          const style = roleLabels[person.role as keyof typeof roleLabels]
          return (
            <div
              key={person.person_id}
              className={`${style.color} border-l-4 rounded-lg p-6 shadow-lg`}
            >
              <div className="text-3xl mb-2">{style.icon}</div>
              <h3 className="text-xl font-bold mb-1">{style.title}</h3>
              <h4 className="text-lg font-semibold mb-2">{person.name}</h4>
              <p className="text-sm text-gray-700 mb-3">{person.bio}</p>
              <div className="text-sm">
                <p className="font-medium mb-1">Why this match:</p>
                <p className="text-gray-600">{person.reasoning}</p>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Match score: {(person.similarity_score * 100).toFixed(0)}%
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
