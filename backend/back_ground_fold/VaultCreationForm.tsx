import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ApiAdapter } from './api-adapter'

export const MetricsViewer: React.FC<{ api: ApiAdapter }> = ({ api }) => {
  const [metricsText, setMetricsText] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      const response = await fetch(api['baseUrl'] + '/metrics')
      const text = await response.text()
      setMetricsText(text)
    } catch (err) {
      console.error(err)
      setMetricsText('Error fetching metrics')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="space-y-4">
      <CardHeader>
        <CardTitle>Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={fetchMetrics} disabled={loading}>
          {loading ? 'Fetching...' : 'Load Metrics'}
        </Button>
        <pre className="mt-4 p-2 bg-[#111122] text-[#e0e0e0] overflow-auto h-64">
          {metricsText || 'No metrics loaded'}
        </pre>
      </CardContent>
    </Card>
  )
}
