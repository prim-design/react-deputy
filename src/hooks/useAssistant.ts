import { AssistantConfig, Message, RunApiProps } from '../types'
import { useState, useCallback } from 'react'
import { v4 as uuid } from 'uuid'
import { processMessageStream } from '../utils'
import { useAssistantContext } from './useAssistantContext'

export function useAssistant(config: AssistantConfig) {
  let threadId = config.thread_id
  const [isPending, setIsPending] = useState(false)
  const [currentRunId, setCurrentRunId] = useState<string | undefined>()
  const [runningTools, setRunningTools] = useState<string[]>([])
  const [messages, setMessages] = useState<Message[]>(config.initialMessages ?? [])
  const context = useAssistantContext()

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  const submitAndRun = useCallback(
    async ({ content, file_ids = [] }: RunApiProps) => {
      setIsPending(true)

      const userMessage = createUserMessage(content, file_ids)
      const assistantPlaceholder = createAssistantPlaceholder()

      setMessages((prevMessages) => [assistantPlaceholder, userMessage, ...prevMessages])

      const additonalInstructions = context?.contextMap
        ? Array.from(context.contextMap)
            .map(([, value]) => `${value.label} ${value.value}`)
            .join('\n\n')
        : undefined

      const { createThreadApi, assistant_id, tools, builtInTools, runApi, onThreadCreated } = config

      if (!threadId && createThreadApi) {
        const thread = await createThreadApi({ assistant_id })
        threadId = thread.id
        onThreadCreated?.(thread)
      }

      const toolsArray = [
        ...(tools?.tools || []),
        ...(builtInTools?.map((type) => ({ type })) || []),
      ]
      const toolsToUse = toolsArray.length > 0 ? toolsArray : undefined

      const response = await runApi({
        content,
        thread_id: threadId,
        file_ids,
        assistant_id,
        tools: toolsToUse,
        additional_instructions: additonalInstructions
          ? `Always use the most updated user-provided context for your answers, which follows: ${additonalInstructions}`
          : undefined,
      })

      await processMessageStream(response, config, setMessages, setCurrentRunId, setRunningTools)
      setIsPending(false)
    },
    [config, context?.contextMap],
  )

  const cancel = useCallback(async () => {
    if (config.cancelApi && currentRunId && threadId) {
      await config.cancelApi({ thread_id: threadId, run_id: currentRunId })
    } else {
      console.error('cancelApi not provided or no current run to stop.')
    }
  }, [config.cancelApi])

  return { submitAndRun, messages, cancel, isPending, clearMessages, runningTools }
}

function createUserMessage(content: string, file_ids: string[]): Message {
  return {
    id: uuid(),
    role: 'user',
    attachments: file_ids.map((file_id) => ({ file_id })),
    content: [
      {
        type: 'text',
        text: { value: content },
      },
    ],
  }
}

function createAssistantPlaceholder(): Message {
  return {
    id: uuid(),
    role: 'assistantPlaceholder',
  }
}
