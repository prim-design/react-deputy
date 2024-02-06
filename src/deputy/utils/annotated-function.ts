/* eslint-disable @typescript-eslint/no-explicit-any */
import { AiFunction, AnnotatedFunction } from '../assistant/types'

export function annotatedFunctionToChatCompletionFunction(
  annotatedFunction: AnnotatedFunction<any[]>,
): AiFunction {
  // Create the parameters object based on the argumentAnnotations
  const parameters: { [key: string]: any } = {}
  for (const arg of annotatedFunction.argumentAnnotations) {
    // isolate the args we should forward inline
    const { name, required, ...forwardedArgs } = arg
    parameters[arg.name] = forwardedArgs
  }

  const requiredParameterNames: string[] = []
  for (const arg of annotatedFunction.argumentAnnotations) {
    if (arg.required) {
      requiredParameterNames.push(arg.name)
    }
  }

  // Create the ChatCompletionFunctions object
  const chatCompletionFunction: AiFunction = {
    name: annotatedFunction.name,
    description: annotatedFunction.description,
    parameters: {
      type: 'object',
      properties: parameters,
      required: requiredParameterNames,
    },
  }

  return chatCompletionFunction
}
