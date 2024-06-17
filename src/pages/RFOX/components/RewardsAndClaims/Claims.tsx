import { Box, CardBody } from '@chakra-ui/react'
import type { AccountId, AssetId } from '@shapeshiftoss/caip'
import { fromAccountId } from '@shapeshiftoss/caip'
import dayjs from 'dayjs'
import { useCallback, useMemo } from 'react'
import { useTranslate } from 'react-polyglot'
import { fromBaseUnit } from 'lib/math'
import { useGetUnstakingRequestQuery } from 'pages/RFOX/hooks/useGetUnstakingRequestQuery'
import { selectAssetById } from 'state/slices/selectors'
import { useAppSelector } from 'state/store'

import { ClaimRow } from '../Claim/ClaimRow'
import { ClaimStatus } from '../Claim/types'

type ClaimsProps = {
  headerComponent: JSX.Element
  stakingAssetId: AssetId
  stakingAssetAccountId: AccountId | undefined
}

export const Claims = ({ headerComponent, stakingAssetId, stakingAssetAccountId }: ClaimsProps) => {
  const translate = useTranslate()
  const setConfirmedQuote = useCallback(() => {}, [])

  const stakingAsset = useAppSelector(state => selectAssetById(state, stakingAssetId))

  const stakingAssetAccountAddress = useMemo(
    () => (stakingAssetAccountId ? fromAccountId(stakingAssetAccountId).account : undefined),
    [stakingAssetAccountId],
  )

  const {
    data: unstakingRequestResponse,
    isSuccess: isUnstakingRequestSuccess,
    isLoading: isUnstakingRequestLoading,
  } = useGetUnstakingRequestQuery({ stakingAssetAccountAddress })

  if (!stakingAsset) return null

  return (
    <CardBody>
      {headerComponent}
      <Box>
        {(unstakingRequestResponse ?? []).map((unstakingRequest, index) => {
          const amountCryptoPrecision = fromBaseUnit(
            unstakingRequest.unstakingBalance.toString(),
            stakingAsset?.precision ?? 0,
          )
          const currentTimestampMs: number = Date.now()
          const unstakingTimestampMs: number = Number(unstakingRequest.cooldownExpiry) * 1000
          const isAvailable = currentTimestampMs >= unstakingTimestampMs
          const cooldownDeltaMs = unstakingTimestampMs - currentTimestampMs
          const cooldownPeriodHuman = dayjs(Date.now() + cooldownDeltaMs).fromNow()
          const status = isAvailable ? ClaimStatus.Available : ClaimStatus.CoolingDown
          return (
            <ClaimRow
              stakingAssetId={stakingAssetId}
              key={unstakingRequest.cooldownExpiry.toString()}
              amountCryptoPrecision={amountCryptoPrecision?.toString() ?? ''}
              status={status}
              setConfirmedQuote={setConfirmedQuote}
              cooldownPeriodHuman={cooldownPeriodHuman}
              index={index}
              actionDescription={translate('RFOX.unstakeFrom', {
                assetSymbol: stakingAsset.symbol,
              })}
            />
          )
        })}
      </Box>
    </CardBody>
  )
}
