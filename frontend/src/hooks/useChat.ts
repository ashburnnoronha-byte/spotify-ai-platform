import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { chatApi } from '../services/api'
import type { ChatMessage, ChatResponse, IndexResponse } from '../types/chat'

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    'Ask me about your listening history, favorite genres, top artists, similar songs, or music for a mood.',
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [lastResponse, setLastResponse] = useState<ChatResponse | null>(null)
  const [indexResult, setIndexResult] = useState<IndexResponse | null>(null)

  const sendMutation = useMutation({
    mutationFn: (message: string) =>
      chatApi.sendMessage({
        message,
        history: messages.filter((item) => item !== WELCOME_MESSAGE).slice(-8),
      }),
    onSuccess: (response) => {
      setLastResponse(response)
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: response.answer },
      ])
    },
  })

  const indexMutation = useMutation({
    mutationFn: () => chatApi.indexSpotifyData(),
    onSuccess: setIndexResult,
  })

  function sendMessage(message: string) {
    const trimmed = message.trim()
    if (!trimmed || sendMutation.isPending) return
    setMessages((current) => [...current, { role: 'user', content: trimmed }])
    sendMutation.mutate(trimmed)
  }

  return {
    messages,
    sendMessage,
    isSending: sendMutation.isPending,
    sendError: sendMutation.error,
    sources: lastResponse?.sources ?? [],
    usedLlm: lastResponse?.used_llm ?? false,
    indexedDocuments: lastResponse?.indexed_documents ?? indexResult?.indexed_documents ?? 0,
    indexSpotifyData: indexMutation.mutate,
    isIndexing: indexMutation.isPending,
    indexError: indexMutation.error,
    indexMessage: indexResult?.message,
  }
}
