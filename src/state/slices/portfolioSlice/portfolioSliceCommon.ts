import type { AccountId, AssetId, ChainId } from '@shapeshiftoss/caip'
import type { AccountMetadataById, PartialRecord } from '@shapeshiftoss/types'
import type { Nominal } from 'types/common'

import type { AssetMetadata } from '../assetsSlice/assetsSlice'

export type PortfolioAccount = {
  /** The asset ids belonging to an account */
  assetIds: AssetId[]
  hasActivity?: boolean
}

export type PortfolioAccounts = {
  byId: {
    [k: AccountId]: PortfolioAccount
  }
  // a list of accounts in this portfolio
  ids: AccountId[]
}

// aggregated balances across all accounts in a portfolio for the same asset
// balance in base units of asset
export type AssetBalancesById = PartialRecord<AssetId, string>

export type PortfolioAccountBalancesById = {
  [k: AccountId]: AssetBalancesById
}

export type PortfolioAccountBalances = {
  byId: PortfolioAccountBalancesById
  ids: AccountId[]
}

export type PortfolioAccountMetadata = {
  byId: AccountMetadataById
  ids: AccountId[]
}

export type WalletId = Nominal<string, 'WalletId'>

export type PortfolioWallet = {
  /**
   * a 1:many mapping of a unique wallet id -> multiple account ids
   */
  byId: PartialRecord<WalletId, AccountId[]>
  ids: WalletId[]
}

export type ConnectWallet = {
  /**
   * the currently connected wallet id, used to determine which accounts to index into
   */
  id: WalletId
  name: string
  supportedChainIds: ChainId[]
}

export type Portfolio = {
  // portfolio assets we found which are unsupported by our platform - stored separately here to prevent mass selector reflow
  unsupportedFungiblePortfolioAssets: AssetMetadata
  /**
   * lookup of accountId -> accountMetadata
   */
  accountMetadata: PortfolioAccountMetadata
  accounts: PortfolioAccounts
  accountBalances: PortfolioAccountBalances
  /**
   * 1:many mapping of a unique wallet id -> multiple account ids
   */
  wallet: PortfolioWallet
  connectedWallet?: ConnectWallet
}

export const initialState: Portfolio = {
  unsupportedFungiblePortfolioAssets: {
    byId: {},
    ids: [],
  },
  accounts: {
    byId: {},
    ids: [],
  },
  accountMetadata: {
    byId: {},
    ids: [],
  },
  accountBalances: {
    byId: {},
    ids: [],
  },
  wallet: {
    byId: {},
    ids: [],
  },
}

export enum AssetEquityType {
  Account = 'Account',
  Staking = 'Staking',
  LP = 'LP',
  Reward = 'Reward',
}

export type AssetEquityItem = {
  id: string
  type: AssetEquityType
  fiatAmount: string
  amountCryptoPrecision: string
  provider: string
  color?: string
  underlyingAssetId?: AssetId
}

export type AssetEquityBalance = {
  fiatAmount: string
  amountCryptoPrecision: string
}
