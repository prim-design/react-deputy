import { useMemo } from 'react'

import { UseChatOptions, useChat } from './useChat'
import { useDeputyContext } from '../DeputyProvider'
import { AiFunction, Message, SystemMessageFunction } from '../assistant/types'
import { nanoid } from 'nanoid'

export interface UseDeputyChatOptions extends UseChatOptions {
  makeSystemMessage?: SystemMessageFunction
  additionalInstructions?: string
}

export interface UseDeputyChatReturn {
  visibleMessages: Message[]
  append: (message: string) => Promise<void>
  reload: () => Promise<void>
  stop: () => void
  isLoading: boolean
}

export function useDeputyChat({
  makeSystemMessage,
  additionalInstructions,
  ...options
}: UseDeputyChatOptions): UseDeputyChatReturn {
  const {
    getContextString,
    getChatCompletionFunctionDescriptions,
    getFunctionCallHandler,
    deputyApiConfig,
  } = useDeputyContext()

  const systemMessage: Message = useMemo(() => {
    const systemMessageMaker = makeSystemMessage || defaultSystemMessage
    const contextString = getContextString([], ['global']) // TODO: make the context categories configurable

    return {
      id: 'system',
      content: systemMessageMaker(contextString, additionalInstructions),
      role: 'system',
    }
  }, [getContextString, makeSystemMessage])

  const functionDescriptions: AiFunction[] = useMemo(() => {
    return getChatCompletionFunctionDescriptions()
  }, [getChatCompletionFunctionDescriptions])

  const {
    messages,
    append: primitiveAppend,
    reload,
    stop,
    isLoading,
  } = useChat({
    ...options,
    deputyConfig: deputyApiConfig,
    id: options.id,
    initialMessages: [systemMessage].concat(options.initialMessages || []),
    functions: functionDescriptions,
    onFunctionCall: getFunctionCallHandler(),
    headers: { ...options.headers },
    body: {
      ...options.body,
    },
  })

  const visibleMessages = messages.filter(
    (message) => message.role === 'user' || message.role === 'assistant',
  )

  return {
    visibleMessages,
    append: (message: string) =>
      primitiveAppend({
        id: nanoid(),
        content: message,
        role: 'user',
      }),
    reload,
    stop,
    isLoading,
  }
}

export function defaultSystemMessage(
  contextString: string,
  additionalInstructions?: string,
): string {
  return (
    `
Please act as an efficient, competent, conscientious, and industrious professional assistant.

Help the user achieve their goals, and you do so in a way that is as efficient as possible, without unnecessary fluff, but also without sacrificing professionalism.
Always be polite and respectful, and prefer brevity over verbosity.

The user has provided you with the following context:
\`\`\`
${contextString}
\`\`\`

They have also provided you with functions you can call to initiate actions on their behalf, or functions you can call to receive more information.

Please assist them as best you can.

You can ask them for clarifying questions if needed, but don't be annoying about it. If you can reasonably 'fill in the blanks' yourself, do so.

If you would like to call a function, call it without saying anything else.
` + (additionalInstructions ? `\n\n${additionalInstructions}` : '')
  )
}
