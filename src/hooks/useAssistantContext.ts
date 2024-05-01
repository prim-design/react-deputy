import { useContext } from 'react'
import { AssistantContext } from '../components/AssistantProvider'

export function useAssistantContext() {
  const assistantContext = useContext(AssistantContext)
  if (assistantContext === undefined) {
    return null
  } else {
    return assistantContext
  }
}
