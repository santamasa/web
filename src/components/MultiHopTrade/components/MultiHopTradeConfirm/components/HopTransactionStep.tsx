import { CheckCircleIcon } from '@chakra-ui/icons'
import { Button, Card, CardBody, Link, VStack } from '@chakra-ui/react'
import type { KnownChainIds } from '@shapeshiftoss/types'
import { TxStatus } from '@shapeshiftoss/unchained-client'
import { useCallback, useEffect, useMemo } from 'react'
import { useTranslate } from 'react-polyglot'
import { MiddleEllipsis } from 'components/MiddleEllipsis/MiddleEllipsis'
import { RawText } from 'components/Text'
import { getChainAdapterManager } from 'context/PluginProvider/chainAdapterSingleton'
import { useLocaleFormatter } from 'hooks/useLocaleFormatter/useLocaleFormatter'
import { getTxLink } from 'lib/getTxLink'
import { fromBaseUnit } from 'lib/math'
import type { SwapperName, TradeQuoteStep } from 'lib/swapper/types'
import { tradeQuoteSlice } from 'state/slices/tradeQuoteSlice/tradeQuoteSlice'
import { HOP_EXECUTION_STATE_ORDERED, HopExecutionState } from 'state/slices/tradeQuoteSlice/types'
import { useAppDispatch } from 'state/store'

import { SwapperIcon } from '../../TradeInput/components/SwapperIcon/SwapperIcon'
import { useMockTradeExecution } from '../hooks/mockHooks'
import { TradeType } from '../types'
import { getChainShortName } from '../utils/getChainShortName'
import { StatusIcon } from './StatusIcon'
import { StepperStep } from './StepperStep'

export type HopTransactionStepProps = {
  swapperName: SwapperName
  tradeQuoteStep: TradeQuoteStep
  isActive: boolean
  hopExecutionState: HopExecutionState
  isLastStep?: boolean
  onTxStatusChange: (txStatus?: TxStatus) => void
}

export const HopTransactionStep = ({
  swapperName,
  tradeQuoteStep,
  isActive,
  hopExecutionState,
  isLastStep,
  onTxStatusChange,
}: HopTransactionStepProps) => {
  const {
    number: { toCrypto },
  } = useLocaleFormatter()
  const dispatch = useAppDispatch()
  const translate = useTranslate()

  const {
    // TODO: use the message to better ux
    // message,
    buyTxHash,
    sellTxHash,
    tradeStatus,
    executeTrade,
  } = useMockTradeExecution() // TODO: use the real hook here

  const handleSignTx = useCallback(async () => {
    // next state
    dispatch(tradeQuoteSlice.actions.incrementTradeExecutionState())

    // execute the transaction for the current hop
    await executeTrade()

    // next state
    dispatch(tradeQuoteSlice.actions.incrementTradeExecutionState())
  }, [dispatch, executeTrade])

  const { txLink, txHash } = useMemo(() => {
    if (buyTxHash)
      return {
        txLink: getTxLink({
          name: tradeQuoteStep.source,
          defaultExplorerBaseUrl: tradeQuoteStep.sellAsset.explorerTxLink,
          tradeId: buyTxHash,
        }),
        txHash: buyTxHash,
      }
    if (sellTxHash)
      return {
        txLink: getTxLink({
          name: tradeQuoteStep.source,
          defaultExplorerBaseUrl: tradeQuoteStep.sellAsset.explorerTxLink,
          tradeId: sellTxHash,
        }),
        txHash: sellTxHash,
      }

    return {}
  }, [buyTxHash, tradeQuoteStep.source, tradeQuoteStep.sellAsset.explorerTxLink, sellTxHash])

  // the txStatus needs to be undefined before the tx is executed to handle "ready" but not "executing" status
  const txStatus =
    hopExecutionState === HopExecutionState.Complete
      ? TxStatus.Confirmed
      : HOP_EXECUTION_STATE_ORDERED.indexOf(hopExecutionState) >=
        HOP_EXECUTION_STATE_ORDERED.indexOf(HopExecutionState.AwaitingTradeExecution)
      ? tradeStatus
      : undefined

  useEffect(() => onTxStatusChange(txStatus), [onTxStatusChange, txStatus])

  const stepIndicator = useMemo(
    () =>
      txStatus !== undefined ? (
        <StatusIcon txStatus={txStatus} />
      ) : (
        <SwapperIcon swapperName={swapperName} />
      ),
    [swapperName, txStatus],
  )

  const signIcon = useMemo(() => <CheckCircleIcon />, [])

  const content = useMemo(
    () =>
      txStatus === undefined ? (
        <Card width='full'>
          <CardBody px={2} py={2}>
            <Button colorScheme='blue' size='sm' leftIcon={signIcon} onClick={handleSignTx}>
              {translate('common.signMessage')}
            </Button>
          </CardBody>
        </Card>
      ) : (
        <></>
      ),
    [handleSignTx, signIcon, translate, txStatus],
  )

  const description = useMemo(() => {
    const sellChainSymbol = getChainShortName(tradeQuoteStep.sellAsset.chainId as KnownChainIds)
    const buyChainSymbol = getChainShortName(tradeQuoteStep.buyAsset.chainId as KnownChainIds)

    const sellAmountCryptoPrecision = fromBaseUnit(
      tradeQuoteStep.sellAmountIncludingProtocolFeesCryptoBaseUnit,
      tradeQuoteStep.sellAsset.precision,
    )
    const buyAmountCryptoPrecision = fromBaseUnit(
      tradeQuoteStep.buyAmountBeforeFeesCryptoBaseUnit,
      tradeQuoteStep.buyAsset.precision,
    )
    const sellAmountCryptoFormatted = toCrypto(
      sellAmountCryptoPrecision,
      tradeQuoteStep.sellAsset.symbol,
    )
    const buyAmountCryptoFormatted = toCrypto(
      buyAmountCryptoPrecision,
      tradeQuoteStep.buyAsset.symbol,
    )

    return (
      <VStack alignItems='flex-start'>
        <RawText>
          {`${sellAmountCryptoFormatted}.${sellChainSymbol} -> ${buyAmountCryptoFormatted}.${buyChainSymbol}`}
        </RawText>
        {txLink && (
          <Link isExternal color='text.link' href={txLink}>
            <MiddleEllipsis value={txHash} />
          </Link>
        )}
      </VStack>
    )
  }, [
    toCrypto,
    tradeQuoteStep.buyAmountBeforeFeesCryptoBaseUnit,
    tradeQuoteStep.buyAsset.chainId,
    tradeQuoteStep.buyAsset.precision,
    tradeQuoteStep.buyAsset.symbol,
    tradeQuoteStep.sellAmountIncludingProtocolFeesCryptoBaseUnit,
    tradeQuoteStep.sellAsset.chainId,
    tradeQuoteStep.sellAsset.precision,
    tradeQuoteStep.sellAsset.symbol,
    txHash,
    txLink,
  ])

  const title = useMemo(() => {
    const tradeType =
      tradeQuoteStep.buyAsset.chainId === tradeQuoteStep.sellAsset.chainId
        ? TradeType.Swap
        : TradeType.Bridge

    const chainAdapterManager = getChainAdapterManager()
    const sellChainName = chainAdapterManager
      .get(tradeQuoteStep.sellAsset.chainId)
      ?.getDisplayName()
    const buyChainName = chainAdapterManager.get(tradeQuoteStep.buyAsset.chainId)?.getDisplayName()

    return tradeType === TradeType.Swap
      ? `${tradeType} on ${sellChainName} via ${swapperName}`
      : `${tradeType} from ${sellChainName} to ${buyChainName} via ${swapperName}`
  }, [swapperName, tradeQuoteStep.buyAsset.chainId, tradeQuoteStep.sellAsset.chainId])

  return (
    <StepperStep
      title={title}
      description={description}
      stepIndicator={stepIndicator}
      content={content}
      isActive={isActive}
      isLastStep={isLastStep}
    />
  )
}