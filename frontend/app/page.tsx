'use client'

import { useState } from 'react'
import QueryForm from '@/components/QueryForm'
import ForumStream from '@/components/ForumStream'
import ResultCards from '@/components/ResultCards'

export default function Home() {
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [result, setResult] = useState<any>(null)

  const resolveApiUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL
    }

    if (typeof window !== 'undefined') {
      return `${window.location.protocol}//${window.location.hostname}:8000`
    }

    return 'http://localhost:8000'
  }

  const handleDiscover = async (query: string) => {
    setIsDiscovering(true)
    setEvents([])
    setResult(null)

    const response = await fetch(`${resolveApiUrl()}/api/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })

    if (!response.ok || !response.body) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader!.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6))
          setEvents(prev => [...prev, data])
          
          if (data.type === 'result') {
            setResult(data.data)
          }
        }
      }
    }

    setIsDiscovering(false)
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">ZeroDegrees</h1>
          <p className="text-xl text-gray-600">Human discovery engine for the Six Degrees era</p>
        </header>

        <QueryForm onSubmit={handleDiscover} isLoading={isDiscovering} />

        {events.length > 0 && (
          <div className="mt-8">
            <ForumStream events={events} />
          </div>
        )}

        {result && (
          <div className="mt-8">
            <ResultCards result={result} />
          </div>
        )}
      </div>
    </main>
  )
}
