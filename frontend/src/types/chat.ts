export interface ChatSource {
  title: string
  kind: string
  content: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  message: string
  history: ChatMessage[]
  rebuild_index?: boolean
}

export interface ChatResponse {
  answer: string
  sources: ChatSource[]
  used_llm: boolean
  indexed_documents: number
}

export interface IndexResponse {
  indexed_documents: number
  message: string
}
