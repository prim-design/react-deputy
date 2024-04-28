import OpenAI from "openai";
import { createTools } from "../utils";

export type FunctionDeltas = Record<
  string,
  { functionName: string; snapshot: string }
>;

export interface RunApiProps {
  thread_id?: string;
  content: string;
  file_ids?: string[];
  assistant_id?: string;
  tools?: OpenAI.Beta.AssistantTool[];
  additional_instructions?: string;
}

export interface ToolOutputApiProps {
  runId: string;
  threadId: string;
  tool_outputs: OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[];
}

interface PlaceholderMessage {
  role: "assistantPlaceholder";
  id: string;
}
interface UserMessage {
  id: string;
  role: "user";
  attachments: OpenAI.Beta.Threads.Message.Attachment[];
  content: Array<{
    type: "text";
    text: {
      value: string;
    };
  }>;
}

export type Message =
  | OpenAI.Beta.Threads.Message
  | PlaceholderMessage
  | UserMessage;

interface AssistantWithThread {
  thread_id: string;
  onThreadCreated?: (data: OpenAI.Beta.Threads.Thread) => void | Promise<void>;
  createThreadApi?(data: {
    assistant_id?: string;
  }): Promise<OpenAI.Beta.Threads.Thread>;
}

interface AssistantWithoutThread {
  thread_id?: undefined;
  createThreadApi(data: {
    assistant_id?: string;
  }): Promise<OpenAI.Beta.Threads.Thread>;
  onThreadCreated?: (data: OpenAI.Beta.Threads.Thread) => void | Promise<void>;
}

type Assistant = AssistantWithThread | AssistantWithoutThread;

type AssistantConfigBase = {
  initialMessages?: Message[];
  assistant_id?: string;
  runApi(data: RunApiProps): Promise<Response | void>;
  onRunCreated?: (data: OpenAI.Beta.Threads.Runs.Run) => void | Promise<void>;
  onMessageCreated?: (
    data: OpenAI.Beta.Threads.Message
  ) => void | Promise<void>;
  onMessageDelta?: (
    data: OpenAI.Beta.Threads.Messages.MessageDeltaEvent
  ) => void | Promise<void>;
  onMessageInProgress?: (
    data: OpenAI.Beta.Threads.Messages.Message
  ) => void | Promise<void>;
  onMessageCompleted?: (
    data: OpenAI.Beta.Threads.Messages.Message
  ) => void | Promise<void>;
  onRunQueued?: (data: OpenAI.Beta.Threads.Runs.Run) => void | Promise<void>;
  onRunInProgress?: (
    data: OpenAI.Beta.Threads.Runs.Run
  ) => void | Promise<void>;
  onRunStepCreated?: (
    data: OpenAI.Beta.Threads.Runs.RunStep
  ) => void | Promise<void>;
  onRunStepInProgress?: (
    data: OpenAI.Beta.Threads.Runs.RunStep
  ) => void | Promise<void>;
  onRunStepDelta?: (
    data: OpenAI.Beta.Threads.Runs.Steps.RunStepDeltaEvent
  ) => void | Promise<void>;
  onRunStepCompleted?: (
    data: OpenAI.Beta.Threads.Runs.RunStep
  ) => void | Promise<void>;
  onRunStepRequiredAction?: (
    data: OpenAI.Beta.Threads.Runs.Run
  ) => void | Promise<void>;
  onRunCompleted?: (data: OpenAI.Beta.Threads.Runs.Run) => void | Promise<void>;
};

export type AssistantTools = ReturnType<typeof createTools>;

type AssistantConfigWithTools = AssistantConfigBase & {
  tools?: AssistantTools;
  toolOutputsApi: (data: ToolOutputApiProps) => Promise<Response | void>;
};

type AssistantConfigWithoutTools = AssistantConfigBase & {
  tools?: undefined;
  toolOutputsApi?: undefined;
};

export type AssistantConfig = Assistant &
  (AssistantConfigWithTools | AssistantConfigWithoutTools);
