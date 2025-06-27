import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { ApiAdapter } from './api-adapter'

interface Role {
  id: string
  name: string
}

export const RoleManagementPanel: React.FC<{ api: ApiAdapter; vaultId: string }> = ({ api, vaultId }) => {
  const [roles, setRoles] = useState<Role[]>([])
  const [newRole, setNewRole] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchRoles = async () => {
    if (!vaultId) return
    setLoading(true)
    try {
      const res = await api.get<{ data: Role[] }>(`vaults/${vaultId}/roles`)
      setRoles(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const addRole = async () => {
    if (!vaultId || !newRole) return
    setLoading(true)
    try {
      await api.request<any>(`vaults/${vaultId}/roles`, {
        method: 'POST',
        body: JSON.stringify({ name: newRole })
      })
      setNewRole('')
      fetchRoles()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const removeRole = async (id: string) => {
    setLoading(true)
    try {
      await api.request<any>(`vaults/${vaultId}/roles/${id}`, { method: 'DELETE' })
      fetchRoles()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [vaultId])

  return (
    <Card className="space-y-4">
      <CardHeader>
        <CardTitle>Role Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Input
            placeholder="New role name"
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
          />
          <Button onClick={addRole} disabled={loading || !newRole || !vaultId}>
            Add Role
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role ID</TableHead>
              <TableHead>Role Name</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map(role => (
              <TableRow key={role.id}>
                <TableCell>{role.id}</TableCell>
                <TableCell>{role.name}</TableCell>
                <TableCell>
                  <Button size="sm" variant="destructive" onClick={() => removeRole(role.id)} disabled={loading}>
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}