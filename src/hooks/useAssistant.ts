import { AssistantConfig, Message, RunApiProps } from "../types";
import { useState } from "react";
import { useCallback } from "react";
import { v4 as uuid } from "uuid";
import { processMessageStream } from "../utils";
import { useAssistantContext } from "./useAssistantContext";

export function useAssistant(config: AssistantConfig) {
  const [messages, setMessages] = useState<Message[]>(
    config.initialMessages ?? []
  );

  const [threadId, setThreadId] = useState<string | undefined>(
    config.thread_id
  );

  const context = useAssistantContext();

  const submitAndRun = useCallback(
    async ({ content, file_ids = [] }: RunApiProps) => {
      const userMessage: Message = {
        id: uuid(),
        role: "user",
        attachments: file_ids?.map((file_id) => ({
          file_id: file_id,
        })),
        content: [
          {
            type: "text",
            text: {
              value: content,
            },
          },
        ],
      };

      const assistantPlaceholder: Message = {
        id: "placholder",
        role: "assistantPlaceholder",
      };

      setMessages((prevMessages) => [
        assistantPlaceholder,
        userMessage,
        ...prevMessages,
      ]);

      const additonalInstructions = context?.contextMap
        ? Array.from(context?.contextMap)
            .map(([, value]) => `${value.label} ${value.value}`)
            .join("\n\n")
        : undefined;

      if (!threadId && config.createThreadApi) {
        const thread = await config.createThreadApi({
          assistant_id: config.assistant_id,
        });
        setThreadId(thread.id);
        config.onThreadCreated?.(thread);
      }

      const response = await config.runApi({
        content,
        thread_id: threadId,
        file_ids,
        assistant_id: config.assistant_id,
        tools: config.tools?.tools || [],
        additional_instructions:
          additonalInstructions ??
          `Always use the most updated user-provided context for your answers, which follows: ${additonalInstructions}`,
      });

      await processMessageStream(response, config, setMessages);
    },

    [config, context?.contextMap, threadId]
  );

  return { submitAndRun, messages };
}
