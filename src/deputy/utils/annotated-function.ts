import zodToJsonSchema from 'zod-to-json-schema'
import { AiFunction, FunctionSchema } from '../assistant/types'

export function annotatedFunctionToChatCompletionFunction(
  annotatedFunction: FunctionSchema,
): AiFunction {
  // Create the ChatCompletionFunctions object
  const chatCompletionFunction: AiFunction = {
    name: annotatedFunction.name,
    description: annotatedFunction.description,
    parameters: zodToJsonSchema(annotatedFunction.parameters),
  }

  return chatCompletionFunction
}
