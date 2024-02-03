import { AiFunction, Message } from '../assistant/types'
import { ChatCompletionEvent, decodeChatCompletion } from './decode-chat-completion'
import { decodeChatCompletionAsText } from './decode-chat-completion-as-text'
import { parseChatCompletion } from './parse-chat-completion'
import { DeputyApiConfig } from './standard-api-config'

export interface FetchChatCompletionParams {
  deputyConfig: DeputyApiConfig
  model?: string
  messages: Message[]
  functions?: AiFunction[]
  temperature?: number
  maxTokens?: number
  headers?: Record<string, string> | Headers
  body?: object
  signal?: AbortSignal
}

export async function fetchChatCompletion({
  deputyConfig,
  model,
  messages,
  functions,
  temperature,
  headers,
  body,
  signal,
}: FetchChatCompletionParams): Promise<Response> {
  temperature ||= 0.5
  functions ||= []

  // clean up any extra properties from messages
  const cleanedMessages = messages.map((message) => {
    const { content, role, name, function_call } = message
    return { content, role, name, function_call }
  })

  const response = await fetch(deputyConfig.chatApiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(headers ? { ...headers } : {}),
    },
    body: JSON.stringify({
      model,
      messages: cleanedMessages,
      stream: true,
      ...(functions.length ? { functions } : {}),
      ...(temperature ? { temperature } : {}),
      ...(functions.length != 0 ? { function_call: 'auto' } : {}),
      ...(body ? { ...body } : {}),
    }),
    signal,
  })

  return response
}

export interface DecodedChatCompletionResponse extends Response {
  events: ReadableStream<ChatCompletionEvent> | null
}

export async function fetchAndDecodeChatCompletion(
  params: FetchChatCompletionParams,
): Promise<DecodedChatCompletionResponse> {
  const response = await fetchChatCompletion(params)
  if (!response.ok || !response.body) {
    return { ...response, events: null }
  }
  const events = decodeChatCompletion(parseChatCompletion(response.body))
  return { ...response, events }
}

export interface DecodedChatCompletionResponseAsText extends Response {
  events: ReadableStream<string> | null
}

export async function fetchAndDecodeChatCompletionAsText(
  params: FetchChatCompletionParams,
): Promise<DecodedChatCompletionResponseAsText> {
  const response = await fetchChatCompletion(params)
  if (!response.ok || !response.body) {
    return { ...response, events: null }
  }
  const events = decodeChatCompletionAsText(
    decodeChatCompletion(parseChatCompletion(response.body)),
  )
  return { ...response, events }
}
