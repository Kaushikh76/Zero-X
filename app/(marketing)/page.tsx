'use client'

import {
  Box,
  ButtonGroup,
  Container,
  Flex,
  HStack,
  Heading,
  Icon,
  IconButton,
  Stack,
  Tag,
  Text,
  VStack,
  Wrap,
  useClipboard,
} from '@chakra-ui/react'
import { Br, Link } from '@saas-ui/react'
import type { Metadata, NextPage } from 'next'
import Image from 'next/image'
import {
  FiArrowRight,
  FiBox,
  FiCheck,
  FiCode,
  FiCopy,
  FiFlag,
  FiGrid,
  FiLock,
  FiSearch,
  FiSliders,
  FiSmile,
  FiTerminal,
  FiThumbsUp,
  FiToggleLeft,
  FiTrendingUp,
  FiUserPlus,
} from 'react-icons/fi'

import * as React from 'react'

import { ButtonLink } from '#components/button-link/button-link'
import { Faq } from '#components/faq'
import { Features } from '#components/features'
import { BackgroundGradient } from '#components/gradients/background-gradient'
import { Hero } from '#components/hero'
import {
  Highlights,
  HighlightsItem,
  HighlightsTestimonialItem,
} from '#components/highlights'
import { ChakraLogo, NextjsLogo } from '#components/logos'
import { FallInPlace } from '#components/motion/fall-in-place'
import { Pricing } from '#components/pricing/pricing'
import { Testimonial, Testimonials } from '#components/testimonials'
import { Em } from '#components/typography'
import faq from '#data/faq'
import pricing from '#data/pricing'
import testimonials from '#data/testimonials'

export const meta: Metadata = {
  title: 'Zero-X',
  description: 'AI-Agent for crypto marketing',
}

const Home: NextPage = () => {
  return (
    <Box>
      <HeroSection />


    </Box>
  )
}

const HeroSection: React.FC = () => {
  return (
    <Box position="relative" overflow="hidden">
      <BackgroundGradient height="100%" zIndex="-1" />
      <Container maxW="container.xl" pt={{ base: 40, lg: 60 }} pb="40">
        <Stack direction={{ base: 'column', lg: 'row' }} alignItems="center">
          <Hero
            id="home"
            justifyContent="flex-start"
            px="0"
            title={
              <FallInPlace>
                Convince Zero-X  
                <Br /> If You Can
              </FallInPlace>
            }
            description={
              <FallInPlace delay={0.4} fontWeight="medium">
                ZeroX is a hard-to-impress <Em> AI Influencer </Em>
                <Br /> that demands you prove your project isn't just another rugpull.
                Convince Zero-X your memecoin or dapp is actually bussin and it'll transform into your most savage marketing ally.
              </FallInPlace>
            }
          >
            <FallInPlace delay={0.8}>
              <br></br>
              <ButtonGroup spacing={4} alignItems="center">
                <ButtonLink colorScheme="primary" size="lg" href="/chat">
                  Good Luck
                </ButtonLink>
                <ButtonLink
                  size="lg"
                  href=""
                  variant="outline"
                  rightIcon={
                    <Icon
                      as={FiArrowRight}
                      sx={{
                        transitionProperty: 'common',
                        transitionDuration: 'normal',
                        '.chakra-button:hover &': {
                          transform: 'translate(5px)',
                        },
                      }}
                    />
                  }
                >
                  View demo
                </ButtonLink>
              </ButtonGroup>
            </FallInPlace>
          </Hero>
          <Box
            height="600px"
            position="absolute"
            display={{ base: 'none', lg: 'block' }}
            left={{ lg: '60%', xl: '55%' }}
            width="80vw"
            maxW="1100px"
            margin="0 auto"
          >
            <FallInPlace delay={1}>
              <Box overflow="hidden" height="100%">
                <Image
                  src="/static/screenshots/list.png"
                  width={1200}
                  height={762}
                  alt="MemeCoins"
                  quality="75"
                  priority
                />
              </Box>
            </FallInPlace>
          </Box>
        </Stack>
      </Container>

      <Features
        id="benefits"
        columns={[1, 2, 4]}
        iconSize={4}
        innerWidth="container.xl"
        pt="20"
        features={[
          {
            title: 'Vibe Check',
            icon: FiSmile,
            description: " With the power of Dexscreener and other tools, ZeroX provides real-time market data, security audits, and trend analysis to validate your project's potential.",
            iconPosition: 'left',
            delay: 0.6,
          },
          {
            title: 'No Rugs Allowed',
            icon: FiSliders,
            description:
              'Advanced risk assessment algorithms scan for honeypots, rugpulls, and suspicious patterns, ensuring only legitimate projects earn ZeroX\'s approval',
            iconPosition: 'left',
            delay: 0.8,
          },
          {
            title: 'Smart Analysis',
            icon: FiGrid,
            description:
              'Dynamic evaluation system that analyzes trading patterns, liquidity depth, and holder distribution to determine if a project is worth promoting.',
            iconPosition: 'left',
            delay: 1,
          },
          {
            title: 'Trust Me Bro Score',
            icon: FiThumbsUp,
            description:
              'All-in-one verification system that\'s basically your project\'s credit score but for crypto. Pass this check and you\'re officially that guy.',
            iconPosition: 'left',
            delay: 1.1,
          },
        ]}
        reveal={FallInPlace}
      />
    </Box>
  )
}


export default Home
