import OpenAI from "openai";

// if a function call doesn't have an output for some reason, it will error the submit tools API, so give it an empty output string
export function refineToolOutputs(
  toolOutputs: OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[]
): OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[] {
  return toolOutputs.map((toolOutput) => {
    if (!toolOutput.output) {
      return {
        ...toolOutput,
        output: "",
      };
    }
    return toolOutput;
  });
}
