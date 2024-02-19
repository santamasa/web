import { ArrowBackIcon } from '@chakra-ui/icons'
import type { ResponsiveValue } from '@chakra-ui/react'
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Container,
  Flex,
  Heading,
  IconButton,
  Stack,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react'
import type { AccountId } from '@shapeshiftoss/caip'
import { thorchainAssetId } from '@shapeshiftoss/caip'
import { useQuery } from '@tanstack/react-query'
import type { Property } from 'csstype'
import type { PropsWithChildren } from 'react'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslate } from 'react-polyglot'
import { reactQueries } from 'react-queries'
import { matchPath, useHistory, useParams, useRouteMatch } from 'react-router'
import { Amount } from 'components/Amount/Amount'
import { AssetIcon } from 'components/AssetIcon'
import { DynamicComponent } from 'components/DynamicComponent'
import { Main } from 'components/Layout/Main'
import { RawText, Text } from 'components/Text'
import { bnOrZero } from 'lib/bignumber/bignumber'
import { assetIdToPoolAssetId } from 'lib/swapper/swappers/ThorchainSwapper/utils/poolAssetHelpers/poolAssetHelpers'
import {
  calculateEarnings,
  calculateTVL,
  get24hSwapChangePercentage,
  getFees,
  getVolume,
} from 'lib/utils/thorchain/lp'
import { selectMarketDataById } from 'state/slices/marketDataSlice/selectors'
import { selectAssetById } from 'state/slices/selectors'
import { useAppSelector } from 'state/store'

import { AddLiquidity } from '../components/AddLiquitity/AddLiquidity'
import { Faq } from '../components/Faq'
import { PoolIcon } from '../components/PoolIcon'
import { PoolInfo } from '../components/PoolInfo'
import { RemoveLiquidity } from '../components/RemoveLiquidity/RemoveLiquidity'
import { usePools } from '../queries/hooks/usePools'
import { useUserLpData } from '../queries/hooks/useUserLpData'

type MatchParams = {
  poolAccountId?: AccountId
  poolOpportunityId?: string
}

const containerPadding = { base: 6, '2xl': 8 }
const maxWidth = { base: '100%', md: '450px' }
const responsiveFlex = { base: 'auto', lg: 1 }

const PoolHeader = () => {
  const translate = useTranslate()
  const history = useHistory()
  const { path } = useRouteMatch()
  const handleBack = useCallback(() => {
    const isPoolPage = matchPath('/pools/positions/:poolAssetId', path)
    const isPoolAccountPage = matchPath('/pools/poolAccount/:poolAccountId/:poolAssetId', path)

    if (isPoolAccountPage) {
      history.push('/pools/positions')
    } else if (isPoolPage) {
      history.push('/pools')
    }
  }, [history, path])
  const backIcon = useMemo(() => <ArrowBackIcon />, [])
  return (
    <Container maxWidth='container.4xl' px={containerPadding} pt={8} pb={4}>
      <Flex gap={4} alignItems='center'>
        <IconButton icon={backIcon} aria-label={translate('pools.pools')} onClick={handleBack} />
        <Heading>{translate('pools.pools')}</Heading>
      </Flex>
    </Container>
  )
}

type FormHeaderProps = {
  setStepIndex: (index: number) => void
  activeIndex: number
}
type FormHeaderTabProps = {
  index: number
  onClick: (index: number) => void
  isActive?: boolean
} & PropsWithChildren

const activeStyle = { color: 'text.base' }

const FormHeaderTab: React.FC<FormHeaderTabProps> = ({ index, onClick, isActive, children }) => {
  const handleClick = useCallback(() => {
    onClick(index)
  }, [index, onClick])
  return (
    <Button
      onClick={handleClick}
      isActive={isActive}
      variant='unstyled'
      color='text.subtle'
      _active={activeStyle}
    >
      {children}
    </Button>
  )
}

const FormHeader: React.FC<FormHeaderProps> = ({ setStepIndex, activeIndex }) => {
  const translate = useTranslate()
  const handleClick = useCallback(
    (index: number) => {
      setStepIndex(index)
    },
    [setStepIndex],
  )
  return (
    <Flex px={6} py={4} gap={4}>
      <FormHeaderTab index={0} onClick={handleClick} isActive={activeIndex === 0}>
        {translate('pools.addLiquidity')}
      </FormHeaderTab>
      <FormHeaderTab index={1} onClick={handleClick} isActive={activeIndex === 1}>
        {translate('pools.removeLiquidity')}
      </FormHeaderTab>
    </Flex>
  )
}

const flexDirPool: ResponsiveValue<Property.FlexDirection> = { base: 'column-reverse', lg: 'row' }

export const Position = () => {
  const params = useParams<MatchParams>()

  const { data: parsedPools } = usePools()

  const foundPool = useMemo(() => {
    if (!parsedPools) return undefined
    const routeOpportunityId = decodeURIComponent(params.poolOpportunityId ?? '')

    return parsedPools.find(pool => pool.opportunityId === routeOpportunityId)
  }, [params, parsedPools])

  const { data: userData } = useUserLpData({ assetId: foundPool?.assetId ?? '' })

  const foundUserData = useMemo(() => {
    if (!userData) return undefined

    // TODO(gomes): when routed from the "Your positions" page, we will want to handle multi-account and narrow by AccountId
    // TODO(gomes): when supporting multi account for this, we will want to either handle default, highest balance account as default,
    // or, probably better from an architectural standpoint, have each account position be its separate row
    return userData?.find(data => data.opportunityId === foundPool?.opportunityId)
  }, [foundPool?.opportunityId, userData])

  const [stepIndex, setStepIndex] = useState<number>(0)

  const headerComponent = useMemo(() => <PoolHeader />, [])

  const poolAssetIds = useMemo(() => {
    if (!foundPool) return []

    return [foundPool.assetId, thorchainAssetId]
  }, [foundPool])

  const runeAsset = useAppSelector(state => selectAssetById(state, thorchainAssetId))
  const asset = useAppSelector(state => selectAssetById(state, foundPool?.assetId ?? ''))

  const runeMarketData = useAppSelector(state => selectMarketDataById(state, thorchainAssetId))
  const assetMarketData = useAppSelector(state =>
    selectMarketDataById(state, foundPool?.assetId ?? ''),
  )

  const { data: swapDataPrevious24h } = useQuery({
    ...reactQueries.midgard.swapsData(foundPool?.assetId, 'previous24h'),
    // @lukemorales/query-key-factory only returns queryFn and queryKey - all others will be ignored in the returned object
    staleTime: Infinity,
    enabled: !!foundPool?.assetId,
  })

  const { data: swapData24h } = useQuery({
    ...reactQueries.midgard.swapsData(foundPool?.assetId, '24h'),
    // @lukemorales/query-key-factory only returns queryFn and queryKey - all others will be ignored in the returned object
    staleTime: Infinity,
    enabled: !!foundPool?.assetId,
  })

  const fees24h = useMemo(() => {
    if (!swapData24h) return undefined

    return getFees(runeMarketData.price, assetMarketData.price, swapData24h)
  }, [assetMarketData.price, runeMarketData.price, swapData24h])

  const { data: volume24h } = useQuery({
    ...reactQueries.midgard.swapsData(foundPool?.assetId, '24h'),
    select: data => getVolume(runeMarketData.price, data),
    // @lukemorales/query-key-factory only returns queryFn and queryKey - all others will be ignored in the returned object
    staleTime: Infinity,
    enabled: !!foundPool?.assetId,
  })

  const swap24hChange = useMemo(() => {
    if (!foundPool || !swapData24h || !swapDataPrevious24h) return null

    return get24hSwapChangePercentage(
      runeMarketData.price,
      assetMarketData.price,
      swapData24h,
      swapDataPrevious24h,
    )
  }, [foundPool, swapData24h, swapDataPrevious24h, runeMarketData, assetMarketData])

  const { data: tvl24hChange } = useQuery({
    ...reactQueries.thorchainLp.tvl24hChange(foundPool?.assetId),
    enabled: !!foundPool?.assetId,
  })

  const { data: allTimeVolume } = useQuery({
    ...reactQueries.thorchainLp.allTimeVolume(foundPool?.assetId, runeMarketData.price),
    enabled: Boolean(!!foundPool?.assetId && !!bnOrZero(runeMarketData.price).gt(0)),
  })

  const { data: thornodePoolData } = useQuery({
    ...reactQueries.thornode.poolData(foundPool?.assetId),
  })

  const { data: earnings } = useQuery({
    ...reactQueries.thorchainLp.earnings(foundUserData?.dateFirstAdded),
    enabled: Boolean(foundUserData && thornodePoolData),
    select: data => {
      if (!data || !foundUserData || !thornodePoolData) return null
      const poolAssetId = assetIdToPoolAssetId({ assetId: foundUserData.assetId })
      const foundHistoryPool = data.meta.pools.find(pool => pool.pool === poolAssetId)
      if (!foundHistoryPool) return null

      return calculateEarnings(
        foundHistoryPool.assetLiquidityFees,
        foundHistoryPool.runeLiquidityFees,
        foundUserData.poolShare,
        runeMarketData.price,
        assetMarketData.price,
      )
    },
  })

  const liquidityValueComponent = useMemo(
    () => <Amount.Fiat value={foundUserData?.totalValueFiatUserCurrency ?? '0'} fontSize='2xl' />,
    [foundUserData?.totalValueFiatUserCurrency],
  )

  const unclaimedFeesComponent = useMemo(
    () => <Amount.Fiat value={earnings?.totalEarningsFiatUserCurrency ?? '0'} fontSize='2xl' />,
    [earnings?.totalEarningsFiatUserCurrency],
  )

  const tvl = useMemo(() => {
    if (!foundPool)
      return { tvl: '0', assetAmountCrytoPrecision: '0', runeAmountCryptoPrecision: '0' }

    return calculateTVL(foundPool.assetDepth, foundPool.runeDepth, runeMarketData.price)
  }, [foundPool, runeMarketData.price])

  const TabHeader = useMemo(
    () => <FormHeader setStepIndex={setStepIndex} activeIndex={stepIndex} />,
    [stepIndex],
  )

  if (!foundPool) return null

  return (
    <Main headerComponent={headerComponent}>
      <Flex gap={4} flexDir={flexDirPool}>
        <Stack gap={6} flex={1}>
          <Card>
            <CardHeader px={8} py={8}>
              <Flex gap={4} alignItems='center'>
                <PoolIcon assetIds={poolAssetIds} size='md' />
                <Heading as='h3'>{foundPool.name}</Heading>
              </Flex>
            </CardHeader>
            <CardBody gap={6} display='flex' flexDir='column' px={8} pb={8} pt={0}>
              <Text translation='pools.yourPosition' fontWeight='medium' />
              <Flex gap={12} flexWrap='wrap'>
                <Stack flex={1}>
                  <DynamicComponent
                    label='pools.liquidityValue'
                    component={liquidityValueComponent}
                    flex={responsiveFlex}
                    flexDirection='column-reverse'
                  />
                  <Card borderRadius='lg'>
                    <Stack px={4} py={2} spacing={4}>
                      <Flex
                        fontSize='sm'
                        justifyContent='space-between'
                        alignItems='center'
                        fontWeight='medium'
                      >
                        <Flex alignItems='center' gap={2}>
                          <AssetIcon size='xs' assetId={poolAssetIds[0]} />
                          <RawText>{asset?.symbol ?? ''}</RawText>
                        </Flex>
                        <Amount.Crypto
                          value={foundUserData?.underlyingAssetAmountCryptoPrecision ?? '0'}
                          symbol={asset?.symbol ?? ''}
                        />
                      </Flex>
                      <Flex
                        fontSize='sm'
                        justifyContent='space-between'
                        alignItems='center'
                        fontWeight='medium'
                      >
                        <Flex alignItems='center' gap={2}>
                          <AssetIcon size='xs' assetId={poolAssetIds[1]} />
                          <RawText>{runeAsset?.symbol ?? ''}</RawText>
                        </Flex>
                        <Amount.Crypto
                          value={foundUserData?.underlyingRuneAmountCryptoPrecision ?? '0'}
                          symbol={runeAsset?.symbol ?? ''}
                        />
                      </Flex>
                    </Stack>
                  </Card>
                </Stack>
                <Stack flex={1}>
                  <DynamicComponent
                    label='pools.unclaimedFees'
                    component={unclaimedFeesComponent}
                    flex={responsiveFlex}
                    flexDirection='column-reverse'
                  />
                  <Card borderRadius='lg'>
                    <Stack px={4} py={2} spacing={4}>
                      <Flex
                        fontSize='sm'
                        justifyContent='space-between'
                        alignItems='center'
                        fontWeight='medium'
                      >
                        <Flex alignItems='center' gap={2}>
                          <AssetIcon size='xs' assetId={poolAssetIds[0]} />
                          <RawText>{asset?.symbol ?? ''}</RawText>
                        </Flex>
                        <Amount.Crypto
                          value={earnings?.assetEarnings ?? '0'}
                          symbol={asset?.symbol ?? ''}
                        />
                      </Flex>
                      <Flex
                        fontSize='sm'
                        justifyContent='space-between'
                        alignItems='center'
                        fontWeight='medium'
                      >
                        <Flex alignItems='center' gap={2}>
                          <AssetIcon size='xs' assetId={poolAssetIds[1]} />
                          <RawText>{runeAsset?.symbol ?? ''}</RawText>
                        </Flex>
                        <Amount.Crypto
                          value={earnings?.runeEarnings ?? '0'}
                          symbol={runeAsset?.symbol ?? ''}
                        />
                      </Flex>
                    </Stack>
                  </Card>
                </Stack>
              </Flex>
            </CardBody>
            <CardFooter
              gap={6}
              display='flex'
              flexDir='column'
              px={8}
              py={8}
              borderTopWidth={1}
              borderColor='border.base'
            >
              <PoolInfo
                volume24h={volume24h}
                volume24hChange={swap24hChange?.volumeChangePercentage}
                fee24hChange={swap24hChange?.feeChangePercentage}
                fees24h={fees24h}
                allTimeVolume={allTimeVolume}
                apy={foundPool.poolAPY}
                tvl={tvl.tvl}
                tvl24hChange={tvl24hChange ?? 0}
                assetIds={poolAssetIds}
              />
            </CardFooter>
          </Card>
          <Faq />
        </Stack>
        <Stack flex={1} maxWidth={maxWidth}>
          <Card>
            <Tabs onChange={setStepIndex} variant='unstyled' index={stepIndex}>
              <TabPanels>
                <TabPanel px={0} py={0}>
                  <AddLiquidity
                    headerComponent={TabHeader}
                    opportunityId={foundPool.opportunityId}
                  />
                </TabPanel>
                <TabPanel px={0} py={0}>
                  <RemoveLiquidity
                    headerComponent={TabHeader}
                    opportunityId={foundPool.opportunityId}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Card>
        </Stack>
      </Flex>
    </Main>
  )
}