import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ApiAdapter } from './api-adapter'

interface AuditLog {
  id: string
  timestamp: string
  action: string
  actor: string
  details?: string
}

export const AuditLogsViewer: React.FC<{ api: ApiAdapter; vaultId: string }> = ({ api, vaultId }) => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)

  const fetchLogs = async () => {
    if (!vaultId) return
    setLoading(true)
    try {
      const res = await api.get<{ data: AuditLog[] }>(`vaults/${vaultId}/logs`)
      setLogs(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [vaultId])

  return (
    <Card className="space-y-4">
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={fetchLogs} disabled={loading || !vaultId}>
          {loading ? 'Loading...' : 'Refresh Logs'}
        </Button>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map(log => (
              <TableRow key={log.id}>
                <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.actor}</TableCell>
                <TableCell>{log.details || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
