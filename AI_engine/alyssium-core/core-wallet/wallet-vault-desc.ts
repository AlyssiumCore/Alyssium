export const WalletVaultDesc = {
  moduleId: 'core-wallet-vault',
  version: '1.0.0',
  author: 'Alyssium Team',
  description: `
    The Wallet Vault module manages vault-based operations for user assets.
    It provides secure storage, transaction batching, and automated management
    of vault holdings on Solana.
  `.trim(),
  features: [
    'Secure vault creation and configuration',
    'Batch transaction execution',
    'Automated asset rebalancing',
    'Role-based access control',
    'Vault activity auditing and reporting'
  ],
  endpoints: {
    createVault: '/vaults/create',
    getVaultInfo: '/vaults/:vaultId',
    executeBatch: '/vaults/:vaultId/execute',
    getAuditLogs: '/vaults/:vaultId/logs',
    manageRoles: '/vaults/:vaultId/roles'
  }
}
