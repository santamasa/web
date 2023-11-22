import { CheckCircleIcon } from '@chakra-ui/icons'
import { Box, Button, Card, Center, Icon, Link, Switch, Tooltip, VStack } from '@chakra-ui/react'
import { TxStatus } from '@shapeshiftoss/unchained-client'
import { useCallback, useMemo } from 'react'
import { FaInfoCircle, FaThumbsUp } from 'react-icons/fa'
import { useTranslate } from 'react-polyglot'
import { MiddleEllipsis } from 'components/MiddleEllipsis/MiddleEllipsis'
import { Row } from 'components/Row/Row'
import { Text } from 'components/Text'
import { useLocaleFormatter } from 'hooks/useLocaleFormatter/useLocaleFormatter'
import { useToggle } from 'hooks/useToggle/useToggle'
import { getTxLink } from 'lib/getTxLink'
import { fromBaseUnit } from 'lib/math'
import type { TradeQuoteStep } from 'lib/swapper/types'
import { selectFeeAssetById } from 'state/slices/selectors'
import { tradeQuoteSlice } from 'state/slices/tradeQuoteSlice/tradeQuoteSlice'
import { HOP_EXECUTION_STATE_ORDERED, HopExecutionState } from 'state/slices/tradeQuoteSlice/types'
import { store, useAppDispatch } from 'state/store'

import { useMockAllowanceApproval } from '../hooks/mockHooks'
import { StatusIcon } from './StatusIcon'
import { StepperStep } from './StepperStep'

export type ApprovalStepProps = {
  tradeQuoteStep: TradeQuoteStep
  isActive: boolean
  hopExecutionState: HopExecutionState
  isLastStep?: boolean
  isLoading?: boolean
}

export const ApprovalStep = ({
  tradeQuoteStep,
  isActive,
  hopExecutionState,
  isLastStep,
  isLoading,
}: ApprovalStepProps) => {
  const {
    number: { toCrypto },
  } = useLocaleFormatter()
  const dispatch = useAppDispatch()
  const [isExactAllowance, toggleIsExactAllowance] = useToggle(false)

  // TODO: use `isApprovalNeeded === undefined` here to display placeholder loading during initial approval check
  const {
    // isApprovalNeeded,
    executeAllowanceApproval,
    approvalTxId: txHash,
    approvalTxStatus: _approvalTxStatus,
    approvalNetworkFeeCryptoBaseUnit,
  } = useMockAllowanceApproval(tradeQuoteStep, true, isExactAllowance) // TODO: use the real hook here

  const handleSignAllowanceApproval = useCallback(async () => {
    // next state
    dispatch(tradeQuoteSlice.actions.incrementTradeExecutionState())

    // execute the allowance approval
    await executeAllowanceApproval()

    // next state
    dispatch(tradeQuoteSlice.actions.incrementTradeExecutionState())
  }, [dispatch, executeAllowanceApproval])

  const feeAsset = selectFeeAssetById(store.getState(), tradeQuoteStep.sellAsset.assetId)
  const approvalNetworkFeeCryptoFormatted =
    feeAsset && approvalNetworkFeeCryptoBaseUnit
      ? toCrypto(
          fromBaseUnit(approvalNetworkFeeCryptoBaseUnit, feeAsset.precision),
          feeAsset.symbol,
        )
      : ''

  // the txStatus needs to be undefined before the tx is executed to handle "ready" but not "executing" status
  const txStatus =
    hopExecutionState === HopExecutionState.Complete
      ? TxStatus.Confirmed
      : HOP_EXECUTION_STATE_ORDERED.indexOf(hopExecutionState) >=
        HOP_EXECUTION_STATE_ORDERED.indexOf(HopExecutionState.AwaitingApprovalExecution)
      ? _approvalTxStatus
      : undefined

  const stepIndicator = useMemo(
    () =>
      txStatus !== undefined ? (
        <StatusIcon txStatus={txStatus} />
      ) : (
        <Center fontSize='sm'>
          <FaThumbsUp />
        </Center>
      ),
    [txStatus],
  )

  const translate = useTranslate()

  const description = useMemo(() => {
    if (!txHash) {
      return translate('trade.approvalGasFee', { fee: approvalNetworkFeeCryptoFormatted })
    }

    const href = getTxLink({
      name: tradeQuoteStep.source,
      defaultExplorerBaseUrl: tradeQuoteStep.sellAsset.explorerTxLink,
      tradeId: txHash,
    })

    return (
      <Link isExternal href={href} color='text.link'>
        <MiddleEllipsis value={txHash} />
      </Link>
    )
  }, [
    approvalNetworkFeeCryptoFormatted,
    tradeQuoteStep.sellAsset.explorerTxLink,
    tradeQuoteStep.source,
    translate,
    txHash,
  ])

  const leftIcon = useMemo(() => <CheckCircleIcon />, [])

  const content = useMemo(
    () =>
      txHash ? (
        <></>
      ) : (
        <Card p='2' width='full'>
          <VStack width='full'>
            <Row px={2}>
              <Row.Label display='flex' alignItems='center'>
                <Text color='text.subtle' translation='trade.allowance' />
                <Tooltip label={translate('trade.allowanceTooltip')}>
                  <Box ml={1}>
                    <Icon as={FaInfoCircle} color='text.subtle' fontSize='0.7em' />
                  </Box>
                </Tooltip>
              </Row.Label>
              <Row.Value textAlign='right' display='flex' alignItems='center'>
                <Text
                  color={isExactAllowance ? 'text.subtle' : 'white'}
                  translation='trade.unlimited'
                  fontWeight='bold'
                />
                <Switch
                  size='sm'
                  mx={2}
                  isChecked={isExactAllowance}
                  onChange={toggleIsExactAllowance}
                />
                <Text
                  color={isExactAllowance ? 'white' : 'text.subtle'}
                  translation='trade.exact'
                  fontWeight='bold'
                />
              </Row.Value>
            </Row>
            <Button
              width='full'
              size='sm'
              leftIcon={leftIcon}
              colorScheme='blue'
              isLoading={hopExecutionState === HopExecutionState.AwaitingApprovalExecution}
              onClick={handleSignAllowanceApproval}
            >
              {translate('common.approve')}
            </Button>
          </VStack>
        </Card>
      ),
    [
      handleSignAllowanceApproval,
      hopExecutionState,
      isExactAllowance,
      leftIcon,
      toggleIsExactAllowance,
      translate,
      txHash,
    ],
  )

  return (
    <StepperStep
      title='Token allowance approval'
      description={description}
      stepIndicator={stepIndicator}
      content={content}
      isActive={isActive}
      isLastStep={isLastStep}
      isLoading={isLoading}
    />
  )
}
