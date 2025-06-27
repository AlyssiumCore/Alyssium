
export const WalletOperatorDesc = {
  moduleId: 'core-wallet-operator',
  version: '1.0.0',
  author: 'Alyssium Team',
  description: `
    The Wallet Operator module handles all user wallet interactions,
    providing streamlined access to balances, transaction history,
    and event subscriptions. It supports Solana wallets,
    multi-signature setups, and delegation features.
  `.trim(),
  features: [
    'Fetch wallet balance and assets',
    'Retrieve transaction history with pagination',
    'Real-time event subscriptions via WebSockets',
    'Support for multi-signature wallets',
    'Delegation and key management utilities'
  ],
  endpoints: {
    getBalance: '/wallets/:address/balance',
    getTransactions: '/wallets/:address/transactions',
    subscribeEvents: '/wallets/:address/events',
    multisigStatus: '/wallets/:address/multisig',
    delegationInfo: '/wallets/:address/delegation'
  }
}
