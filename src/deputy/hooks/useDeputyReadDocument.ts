import { useEffect, useRef } from 'react'

import { useDeputyContext } from '../DeputyProvider'
import { DocumentPointer } from '../assistant/types'

/**
 * Makes a document readable by Copilot.
 * @param document The document to make readable.
 * @param categories The categories to associate with the document.
 * @param dependencies The dependencies to use for the effect.
 * @returns The id of the document.
 */
export function useDeputyReadDocument(
  document: DocumentPointer,
  categories?: string[],
  dependencies: unknown[] = [],
): string | undefined {
  const { addDocumentContext, removeDocumentContext } = useDeputyContext()
  const idRef = useRef<string>()

  useEffect(() => {
    const id = addDocumentContext(document, categories)
    idRef.current = id

    return () => {
      removeDocumentContext(id)
    }
  }, [addDocumentContext, removeDocumentContext, ...dependencies])

  return idRef.current
}
