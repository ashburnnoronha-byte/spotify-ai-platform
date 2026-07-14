import { FormEvent, useState } from 'react'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { getApiErrorMessage } from '../utils/api-error'
import { useChat } from '../hooks/useChat'
import type { ChatMessage } from '../types/chat'

const SUGGESTED_PROMPTS = [
  'What artists do I listen to most?',
  'What is my favorite genre?',
  'Show songs similar to Arctic Monkeys.',
  'Which tracks match my workout mood?',
  'Who was my most played artist this month?',
]

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-3xl rounded-2xl px-5 py-4 text-sm leading-6 ${
          isUser
            ? 'bg-spotify-green text-black'
            : 'border border-spotify-gray/40 bg-spotify-dark text-white'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}

export function ChatPage() {
  const [input, setInput] = useState('')
  const {
    messages,
    sendMessage,
    isSending,
    sendError,
    sources,
    usedLlm,
    indexedDocuments,
    indexSpotifyData,
    isIndexing,
    indexError,
    indexMessage,
  } = useChat()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    sendMessage(input)
    setInput('')
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] gap-6">
      <section className="flex flex-1 flex-col rounded-2xl border border-spotify-gray/40 bg-spotify-black">
        <div className="border-b border-spotify-gray/40 p-6">
          <h1 className="text-3xl font-bold text-white">AI Music Chat</h1>
          <p className="mt-2 text-sm text-spotify-light">
            Ask questions about your Spotify listening history using retrieval augmented generation.
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.map((message, index) => (
            <MessageBubble key={`${message.role}-${index}`} message={message} />
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-spotify-gray/40 bg-spotify-dark px-5 py-2">
                <LoadingSpinner size="sm" />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-spotify-gray/40 p-6">
          <div className="mb-4 flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setInput(prompt)}
                className="rounded-full border border-spotify-gray/60 px-3 py-1 text-xs text-spotify-light transition-colors hover:border-spotify-green hover:text-white"
              >
                {prompt}
              </button>
            ))}
          </div>

          {sendError && (
            <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {getApiErrorMessage(sendError, 'Failed to send message.')}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={2}
              placeholder="Ask about your artists, genres, tracks, or moods..."
              className="min-h-14 flex-1 resize-none rounded-xl border border-spotify-gray bg-spotify-dark px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-spotify-light focus:border-spotify-green"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="rounded-xl bg-spotify-green px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-[#1ed760] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </section>

      <aside className="w-80 space-y-4">
        <div className="rounded-2xl border border-spotify-gray/40 bg-spotify-dark p-5">
          <h2 className="font-semibold text-white">Spotify RAG Index</h2>
          <p className="mt-2 text-sm text-spotify-light">
            {indexedDocuments > 0
              ? `${indexedDocuments} listening-history documents indexed.`
              : 'Index your Spotify data before asking detailed questions.'}
          </p>
          {indexMessage && <p className="mt-2 text-xs text-spotify-green">{indexMessage}</p>}
          {indexError && (
            <p className="mt-2 text-xs text-red-400">
              {getApiErrorMessage(indexError, 'Failed to index Spotify data.')}
            </p>
          )}
          <button
            type="button"
            onClick={() => indexSpotifyData()}
            disabled={isIndexing}
            className="mt-4 w-full rounded-lg bg-spotify-gray px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-spotify-gray/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isIndexing ? 'Indexing...' : 'Index Spotify Data'}
          </button>
        </div>

        <div className="rounded-2xl border border-spotify-gray/40 bg-spotify-dark p-5">
          <h2 className="font-semibold text-white">Answer Mode</h2>
          <p className="mt-2 text-sm text-spotify-light">
            {usedLlm
              ? 'Using LangChain with the configured LLM and retrieved Spotify context.'
              : 'Using retrieved Spotify context. Add OPENAI_API_KEY for richer generated answers.'}
          </p>
        </div>

        {sources.length > 0 && (
          <div className="rounded-2xl border border-spotify-gray/40 bg-spotify-dark p-5">
            <h2 className="font-semibold text-white">Retrieved Sources</h2>
            <div className="mt-3 space-y-3">
              {sources.map((source, index) => (
                <div key={`${source.title}-${index}`} className="rounded-xl bg-spotify-black p-3">
                  <p className="text-sm font-medium text-white">{source.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-spotify-green">
                    {source.kind.replace('_', ' ')}
                  </p>
                  <p className="mt-2 line-clamp-4 text-xs leading-5 text-spotify-light">
                    {source.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
