import type { AccountId, AssetId } from '@shapeshiftoss/caip'
import { AnimatePresence } from 'framer-motion'
import { lazy, memo, Suspense, useCallback, useState } from 'react'
import { MemoryRouter, Route, Switch, useLocation } from 'react-router'
import { useRouteAssetId } from 'hooks/useRouteAssetId/useRouteAssetId'
import type { Asset } from 'lib/asset-service'

import { RepayRoutePaths } from './types'

const RepayEntries = [RepayRoutePaths.Input, RepayRoutePaths.Confirm]

type RepayProps = {
  collateralAccountId: AccountId
  repaymentAccountId: AccountId
  onCollateralAccountIdChange: (accountId: AccountId) => void
  onRepaymentAccountIdChange: (accountId: AccountId) => void
}

export const Repay = ({
  collateralAccountId,
  repaymentAccountId: borrowAccountId,
  onCollateralAccountIdChange: handleCollateralAccountIdChange,
  onRepaymentAccountIdChange: handleRepaymentAccountIdChange,
}: RepayProps) => {
  const [repaymentPercent, setRepaymentPercent] = useState<number>(100)

  const collateralAssetId = useRouteAssetId()

  const handleDepositAmountChange = useCallback((value: number) => {
    setRepaymentPercent(value)
  }, [])

  return (
    <MemoryRouter initialEntries={RepayEntries} initialIndex={0}>
      <RepayRoutes
        collateralAssetId={collateralAssetId}
        repaymentPercent={repaymentPercent}
        onRepaymentPercentChange={handleDepositAmountChange}
        collateralAccountId={collateralAccountId}
        repaymentAccountId={borrowAccountId}
        onCollateralAccountIdChange={handleCollateralAccountIdChange}
        onRepaymentAccountIdChange={handleRepaymentAccountIdChange}
      />
    </MemoryRouter>
  )
}

type RepayRoutesProps = {
  collateralAssetId: AssetId
  repaymentPercent: number
  onRepaymentPercentChange: (value: number) => void
  collateralAccountId: AccountId
  repaymentAccountId: AccountId
  onCollateralAccountIdChange: (accountId: AccountId) => void
  onRepaymentAccountIdChange: (accountId: AccountId) => void
}

const RepayInput = lazy(() =>
  import('./RepayInput').then(({ RepayInput }) => ({
    default: RepayInput,
  })),
)
const RepayConfirm = lazy(() =>
  import('./RepayConfirm').then(({ RepayConfirm }) => ({
    default: RepayConfirm,
  })),
)

const suspenseFallback = <div>Loading...</div>

const RepayRoutes = memo(
  ({
    collateralAssetId,
    repaymentPercent,
    onRepaymentPercentChange,
    collateralAccountId,
    repaymentAccountId,
    onCollateralAccountIdChange: handleCollateralAccountIdChange,
    onRepaymentAccountIdChange: handleRepaymentAccountIdChange,
  }: RepayRoutesProps) => {
    const location = useLocation()
    const [repaymentAsset, setRepaymentAsset] = useState<Asset | null>(null)

    const renderRepayInput = useCallback(
      () => (
        <RepayInput
          collateralAssetId={collateralAssetId}
          repaymentPercent={repaymentPercent}
          collateralAccountId={collateralAccountId}
          repaymentAccountId={repaymentAccountId}
          onCollateralAccountIdChange={handleCollateralAccountIdChange}
          onRepaymentAccountIdChange={handleRepaymentAccountIdChange}
          onRepaymentPercentChange={onRepaymentPercentChange}
          repaymentAsset={repaymentAsset}
          setRepaymentAsset={setRepaymentAsset}
        />
      ),
      [
        collateralAssetId,
        repaymentPercent,
        collateralAccountId,
        repaymentAccountId,
        handleCollateralAccountIdChange,
        handleRepaymentAccountIdChange,
        onRepaymentPercentChange,
        repaymentAsset,
        setRepaymentAsset,
      ],
    )

    const renderRepayConfirm = useCallback(
      () => (
        <RepayConfirm
          collateralAssetId={collateralAssetId}
          repaymentPercent={repaymentPercent}
          collateralAccountId={collateralAccountId}
          repaymentAccountId={repaymentAccountId}
          repaymentAsset={repaymentAsset}
        />
      ),
      [
        collateralAssetId,
        repaymentPercent,
        collateralAccountId,
        repaymentAccountId,
        repaymentAsset,
      ],
    )

    return (
      <AnimatePresence exitBeforeEnter initial={false}>
        <Switch location={location}>
          <Suspense fallback={suspenseFallback}>
            <Route
              key={RepayRoutePaths.Input}
              path={RepayRoutePaths.Input}
              render={renderRepayInput}
            />
            <Route
              key={RepayRoutePaths.Confirm}
              path={RepayRoutePaths.Confirm}
              render={renderRepayConfirm}
            />
          </Suspense>
        </Switch>
      </AnimatePresence>
    )
  },
)