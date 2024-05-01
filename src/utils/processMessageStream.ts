import OpenAI from 'openai'
import { AssistantConfig, FunctionDeltas, Message } from '../types'
import { refineToolOutputs } from './refineToolOutputs'
import { Dispatch, SetStateAction } from 'react'

export async function processMessageStream(
  response: Response | void,
  config: AssistantConfig,
  setMessages: Dispatch<SetStateAction<Message[]>>,
) {
  if (!response || !response.body) {
    throw new Error('The response body is empty.')
  }
  let contentSnapshot = ''
  const functionSnapshots: FunctionDeltas = {}
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let done = false

  while (!done) {
    const { value, done: doneReading } = await reader.read()
    done = doneReading

    // parse server event string
    const strChunk = decoder.decode(value).trim()

    // split on '}\n{' (to handle multiple JSON elements passed at once)
    const strServerEvents = strChunk.split(/}\s*{/)

    // process each event
    for (let i = 0; i < strServerEvents.length; i++) {
      let strServerEvent = strServerEvents[i]

      // Add missing '{' and '}' characters
      if (i !== 0) {
        strServerEvent = '{' + strServerEvent
      }
      if (i !== strServerEvents.length - 1) {
        strServerEvent = strServerEvent + '}'
      }

      // Skip empty strings
      if (strServerEvent.trim() === '') {
        continue
      }

      try {
        const serverEvent: OpenAI.Beta.AssistantStreamEvent = JSON.parse(strServerEvent)

        const { event, data } = serverEvent

        switch (event) {
          case 'thread.run.created':
            config.onRunCreated?.(data)
            break

          // create new message
          case 'thread.message.created':
            config.onMessageCreated?.(data)
            setMessages((prevMessages) => [
              data,
              ...prevMessages.filter((message) => message.role !== 'assistantPlaceholder'),
            ])
            break

          // update streaming message content
          case 'thread.message.delta':
            config.onMessageDelta?.(data)
            if (data.delta.content?.[0].type === 'text') {
              contentSnapshot += data.delta.content[0].text?.value
              const type = data.delta.content[0].type
              setMessages((prevMessages) =>
                prevMessages.map((message) =>
                  message.id === data.id && message.role === 'assistant'
                    ? {
                        ...message,
                        content: [
                          {
                            ...message.content[0],
                            type,
                            text: {
                              annotations: [],
                              value: contentSnapshot,
                            },
                          },
                          ...message.content.slice(1),
                        ],
                      }
                    : message,
                ),
              )
            }

            break

          case 'thread.message.in_progress':
            config.onMessageInProgress?.(data)
            break

          case 'thread.message.completed':
            config.onMessageCompleted?.(data)
            setMessages((prevMessages) =>
              prevMessages.map((message) =>
                message.id === data.id && message.role === 'assistant'
                  ? {
                      ...data,
                    }
                  : message,
              ),
            )
            break
          case 'thread.run.queued':
            config.onRunQueued?.(data)
            break

          case 'thread.run.in_progress':
            config.onRunInProgress?.(data)
            break

          case 'thread.run.step.created':
            config.onRunStepCreated?.(data)
            break

          case 'thread.run.step.in_progress':
            config.onRunStepInProgress?.(data)
            break

          case 'thread.run.step.delta':
            config.onRunStepDelta?.(data)
            if (data.delta?.step_details?.type === 'tool_calls') {
              const actions = data.delta.step_details.tool_calls

              if (actions) {
                actions.forEach((action) => {
                  if (action.type === 'function' && action?.function?.name) {
                    functionSnapshots[data.id] = {
                      functionName: action.function.name,
                      snapshot: action.function.arguments || '',
                    }
                  }

                  if (
                    action.type === 'function' &&
                    action?.function?.arguments &&
                    functionSnapshots[data.id]
                  ) {
                    functionSnapshots[data.id] = {
                      ...functionSnapshots[data.id],
                      snapshot: functionSnapshots[data.id].snapshot + action.function.arguments,
                    }
                  }
                })
              }
              config.tools?.processActionDeltas(functionSnapshots)
            }

            break

          case 'thread.run.step.completed':
            config.onRunStepCompleted?.(data)
            delete functionSnapshots[data.id]

            break

          case 'thread.run.requires_action':
            config.onRunStepRequiredAction?.(data)
            if (data.required_action?.submit_tool_outputs) {
              const actions = data.required_action.submit_tool_outputs.tool_calls
              const tool_outputs = await config.tools?.processAssistantActions(actions)

              const response = await config.toolOutputsApi?.({
                runId: data.id,
                threadId: data.thread_id,
                tool_outputs: tool_outputs ? refineToolOutputs(tool_outputs) : [],
              })

              // recursively process the new messages after tool outputs are submitted

              await processMessageStream(response, config, setMessages)
            }
            break

          case 'thread.run.completed':
            config.onRunCompleted?.(data)
            break

          default:
            console.warn(`Unhandled event: ${serverEvent.event}`)
        }
      } catch (e) {
        console.error(`Failed to parse JSON string: ${strServerEvent}`, e)
      }
    }
  }
  if (done) {
    reader.releaseLock()
    return
  }
}
