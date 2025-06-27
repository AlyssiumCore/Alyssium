import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ApiAdapter } from './api-adapter'

interface VaultInfo {
  id: string
  owner: string
  assets: Record<string, number>
}

export const VaultDashboard: React.FC<{ api: ApiAdapter }> = ({ api }) => {
  const [vaultId, setVaultId] = useState('')
  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null)
  const [batchTx, setBatchTx] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchVaultInfo = async () => {
    if (!vaultId) return
    setLoading(true)
    try {
      const data = await api.get<{ data: VaultInfo }>(`vaults/${vaultId}`)
      setVaultInfo(data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const executeBatch = async () => {
    if (!vaultId || !batchTx) return
    setLoading(true)
    try {
      await api.request<any>(`vaults/${vaultId}/execute`, {
        method: 'POST',
        body: JSON.stringify({ transactions: batchTx.split(',') })
      })
      fetchVaultInfo()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="space-y-4">
      <CardHeader>
        <CardTitle>Vault Manager</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="execute">Execute Batch</TabsTrigger>
            <TabsTrigger value="logs">Audit Logs</TabsTrigger>
            <TabsTrigger value="roles">Manage Roles</TabsTrigger>
          </TabsList>
          <TabsContent value="info">
            <div className="space-y-2">
              <Input
                placeholder="Vault ID"
                value={vaultId}
                onChange={e => setVaultId(e.target.value)}
              />
              <Button onClick={fetchVaultInfo} disabled={loading || !vaultId}>
                {loading ? 'Loading...' : 'Fetch Info'}
              </Button>
              {vaultInfo && (
                <div className="mt-4">
                  <p><strong>Owner:</strong> {vaultInfo.owner}</p>
                  <div>
                    <strong>Assets:</strong>
                    <ul className="list-disc ml-6">
                      {Object.entries(vaultInfo.assets).map(([token, amount]) => (
                        <li key={token}>{token}: {amount}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="create">
            <div>
              <Button onClick={async () => {
                setLoading(true)
                try {
                  await api.request<any>('vaults/create', { method: 'POST' })
                  setVaultInfo(null)
                  setVaultId('')
                } catch (err) {
                  console.error(err)
                } finally {
                  setLoading(false)
                }
              }} disabled={loading}>
                {loading ? 'Creating...' : 'Create New Vault'}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="execute">
            <div className="space-y-2">
              <Input
                placeholder="Transaction1,Transaction2,..."
                value={batchTx}
                onChange={e => setBatchTx(e.target.value)}
              />
              <Button onClick={executeBatch} disabled={loading || !batchTx || !vaultId}>
                {loading ? 'Executing...' : 'Execute Batch'}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="logs">
            <p>Audit logs viewer coming soon</p>
          </TabsContent>
          <TabsContent value="roles">
            <p>Role management UI coming soon</p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
