import { InfoIcon } from '@chakra-ui/icons'
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Heading,
  HStack,
  Link,
  Stack,
} from '@chakra-ui/react'
import { SwapperName } from '@shapeshiftoss/swapper'
import { useCallback } from 'react'
import { useTranslate } from 'react-polyglot'
import { useHistory } from 'react-router'
import { Amount } from 'components/Amount/Amount'
import { AssetToAssetCard } from 'components/AssetToAssetCard/AssetToAssetCard'
import { Row } from 'components/Row/Row'
import { SlideTransition } from 'components/SlideTransition'
import { RawText, Text } from 'components/Text'
import { TransactionDate } from 'components/TransactionHistoryRows/TransactionDate'
import {
  selectActiveQuote,
  selectActiveQuoteBuyAmountCryptoPrecision,
  selectActiveQuoteBuyAmountUserCurrency,
  selectActiveQuoteBuyAsset,
  selectActiveQuoteSellAmountCryptoPrecision,
  selectActiveQuoteSellAmountUserCurrency,
  selectActiveQuoteSellAsset,
} from 'state/slices/limitOrderSlice/selectors'
import { useAppSelector } from 'state/store'

import { SwapperIcon } from '../../TradeInput/components/SwapperIcon/SwapperIcon'
import { WithBackButton } from '../../WithBackButton'
import { LimitOrderRoutePaths } from '../types'

const cardBorderRadius = { base: '2xl' }

// TODO: Populate this!
const learnMoreUrl = ''

export const LimitOrderConfirm = () => {
  const history = useHistory()
  const translate = useTranslate()

  const handleBack = useCallback(() => {
    history.push(LimitOrderRoutePaths.Input)
  }, [history])

  const handleConfirm = useCallback(() => {
    history.push(LimitOrderRoutePaths.Status)
  }, [history])

  const activeQuote = useAppSelector(selectActiveQuote)
  const sellAsset = useAppSelector(selectActiveQuoteSellAsset)
  const buyAsset = useAppSelector(selectActiveQuoteBuyAsset)
  const sellAmountCryptoPrecision = useAppSelector(selectActiveQuoteSellAmountCryptoPrecision)
  const buyAmountCryptoPrecision = useAppSelector(selectActiveQuoteBuyAmountCryptoPrecision)
  const sellAmountUserCurrency = useAppSelector(selectActiveQuoteSellAmountUserCurrency)
  const buyAmountUserCurrency = useAppSelector(selectActiveQuoteBuyAmountUserCurrency)

  if (!activeQuote) {
    console.error('Attempted to submit an undefined limit order')
    history.push(LimitOrderRoutePaths.Input)
    return null
  }

  return (
    <SlideTransition>
      <Card
        flex={1}
        borderRadius={cardBorderRadius}
        width='full'
        variant='dashboard'
        maxWidth='500px'
        borderColor='border.base'
        bg='background.surface.raised.base'
      >
        <CardHeader px={6} pt={4} borderWidth={0}>
          <WithBackButton onBack={handleBack}>
            <Heading textAlign='center' fontSize='lg'>
              <Text translation='limitOrder.confirm' />
            </Heading>
          </WithBackButton>
        </CardHeader>

        <CardBody px={6} pt={0} pb={6}>
          <AssetToAssetCard
            sellAsset={sellAsset}
            buyAsset={buyAsset}
            sellAmountCryptoPrecision={sellAmountCryptoPrecision}
            sellAmountUserCurrency={sellAmountUserCurrency}
            buyAmountCryptoPrecision={buyAmountCryptoPrecision}
            buyAmountUserCurrency={buyAmountUserCurrency}
          />
        </CardBody>
        <CardFooter
          flexDir='column'
          gap={2}
          px={4}
          borderTopWidth={0}
          bg='background.surface.raised.accent'
          fontSize='sm'
          borderBottomRadius={cardBorderRadius}
        >
          <Stack spacing={4}>
            <Row px={2}>
              <Row.Label>
                <Text translation='limitOrder.limitPrice' />
              </Row.Label>
              <Row.Value textAlign='right'>
                <HStack>
                  {/* TODO: Wire up limit price based on appdata in the quote */}
                  <Amount.Crypto value={'0.002134'} symbol={'WETH'} />
                  <RawText>=</RawText>
                  <Amount.Fiat fiatType='USD' value={'1'} />
                </HStack>
              </Row.Value>
            </Row>
            <Row px={2}>
              <Row.Label>
                <Text translation='limitOrder.provider' />
              </Row.Label>
              <Row.Value textAlign='right'>
                <HStack>
                  <SwapperIcon swapperName={SwapperName.CowSwap} />
                  <RawText>{SwapperName.CowSwap}</RawText>
                </HStack>
              </Row.Value>
            </Row>
            <Row px={2}>
              <Row.Label>
                <Text translation='limitOrder.expiration' />
              </Row.Label>
              <TransactionDate blockTime={Date.now() / 1000} />
            </Row>
            <Row px={2}>
              <Row.Label>
                <Text translation='limitOrder.networkFee' />
              </Row.Label>
              <Amount.Crypto value={'0.0'} symbol={'ETH'} />
            </Row>
            <Card bg='background.surface.raised.pressed' borderRadius={6} p={4}>
              <HStack>
                <InfoIcon boxSize='1.3em' color='text.info' />
                <RawText>
                  {translate('limitOrder.confirmInfo')}{' '}
                  <Button
                    as={Link}
                    href={learnMoreUrl}
                    variant='link'
                    colorScheme='blue'
                    isExternal
                    fontWeight='normal'
                    height='auto'
                    padding={0}
                    verticalAlign='baseline'
                  >
                    <Text as='span' translation='limitOrder.learnMore' />
                  </Button>
                </RawText>
              </HStack>
            </Card>
            <Button
              colorScheme={'blue'}
              size='lg'
              width='full'
              onClick={handleConfirm}
              isLoading={false}
            >
              <Text translation={'limitOrder.placeOrder'} />
            </Button>
          </Stack>
        </CardFooter>
      </Card>
    </SlideTransition>
  )
}
