import { useEffect } from 'react'
import { useAssistantContext } from './useAssistantContext'

export function useAddToAssistantContext(
  contexts: { label: string; value: string } | Array<{ label: string; value: string }>,
) {
  const assistantContext = useAssistantContext()
  if (assistantContext === null) {
    throw new Error('useAddToAssistantContext must be used within a AssistantProvider')
  }

  const { addContext, removeContext } = assistantContext

  useEffect(() => {
    // Check if contexts is an array
    if (Array.isArray(contexts)) {
      const ids = contexts.map(({ label, value }) => addContext({ label, value }))
      return () => {
        ids.forEach((id) => removeContext(id))
      }
    } else {
      // If contexts is not an array, treat it as a single object
      const id = addContext(contexts)
      return () => {
        removeContext(id)
      }
    }
  }, [addContext, removeContext, contexts])
}
