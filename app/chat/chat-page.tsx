'use client'

import { useState, useEffect } from 'react'
import { Box, Container, VStack, Input, Button, Text, useToast, Flex } from '@chakra-ui/react'
import { FiSend } from 'react-icons/fi'
import { BackgroundGradient } from '#components/gradients/background-gradient'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string>('')
  const toast = useToast()

  useEffect(() => {
    // Initialize with first API call
    const initializeChat = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_CHAT_API_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(`${process.env.NEXT_PUBLIC_CHAT_API_USERNAME}:${process.env.NEXT_PUBLIC_CHAT_API_PASSWORD}`)
          },
          body: JSON.stringify({ 
            message: "Hello",
            conversation_id: null // First message to initialize conversation
          })
        })

        if (!response.ok) {
          throw new Error('Failed to initialize chat')
        }

        const data = await response.json()
        setConversationId(data.conversation_id)
        
        // Add initial interaction to messages
        setMessages([
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: data.response }
        ])
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to initialize chat. Please refresh the page.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
    }

    initializeChat()
  }, [toast])

  const sendMessage = async () => {
    if (!input.trim()) return

    try {
      setIsLoading(true)
      const newUserMessage = { role: 'user' as const, content: input }
      setMessages(prev => [...prev, newUserMessage])
      setInput('')

      const response = await fetch(`${process.env.NEXT_PUBLIC_CHAT_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(`${process.env.NEXT_PUBLIC_CHAT_API_USERNAME}:${process.env.NEXT_PUBLIC_CHAT_API_PASSWORD}`)
        },
        body: JSON.stringify({ 
          message: input,
          conversation_id: conversationId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      const newBotMessage = { role: 'assistant' as const, content: data.response }
      setMessages(prev => [...prev, newBotMessage])
      
      // Update conversation ID if it changes
      if (data.conversation_id) {
        setConversationId(data.conversation_id)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <Box position="relative" minH="100vh">
      <BackgroundGradient height="100%" zIndex="-1" />
      <Container maxW="container.md" pt={{ base: 20, lg: 40 }} pb="20">
        <VStack spacing="8" align="stretch">
          <Box 
            bg="whiteAlpha.100" 
            backdropFilter="blur(10px)"
            borderRadius="lg"
            p="6"
            minH="60vh"
            border="1px"
            borderColor="whiteAlpha.200"
          >
            <VStack spacing="4" align="stretch" maxH="50vh" overflowY="auto">
              {messages.map((message, index) => (
                <Box
                  key={index}
                  alignSelf={message.role === 'user' ? 'flex-end' : 'flex-start'}
                  maxW="80%"
                  p="3"
                  borderRadius="lg"
                  bg={message.role === 'user' ? 'primary.500' : 'whiteAlpha.200'}
                >
                  <Text color={message.role === 'user' ? 'white' : 'inherit'}>
                    {message.content}
                  </Text>
                </Box>
              ))}
            </VStack>
          </Box>
          
          <Flex gap="2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              size="lg"
              bg="whiteAlpha.100"
              border="1px"
              borderColor="whiteAlpha.200"
              _hover={{ borderColor: 'whiteAlpha.300' }}
              _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
            />
            <Button
              leftIcon={<FiSend />}
              onClick={sendMessage}
              isLoading={isLoading}
              colorScheme="primary"
              size="lg"
            >
              Send
            </Button>
          </Flex>
        </VStack>
      </Container>
    </Box>
  )
}