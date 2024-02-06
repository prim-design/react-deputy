/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import {
  AiFunction,
  AnnotatedFunction,
  DocumentPointer,
  FunctionCallHandler,
} from './assistant/types'
import useTree, { TreeNodeId } from './hooks/useReadTree'
import useFlatCategoryStore from './hooks/useFlatCategoryStore'
import { annotatedFunctionToChatCompletionFunction } from './utils'
import { DeputyApiConfig, StandardDeputyApiConfig } from './utils/standard-api-config'

interface DeputyContextType {
  entryPoints: Record<string, AnnotatedFunction<any[]>>
  setEntryPoint: (id: string, entryPoint: AnnotatedFunction<any[]>) => void
  removeEntryPoint: (id: string) => void
  getChatCompletionFunctionDescriptions: (
    customEntryPoints?: Record<string, AnnotatedFunction<any[]>>,
  ) => AiFunction[]
  getFunctionCallHandler: (
    customEntryPoints?: Record<string, AnnotatedFunction<any[]>>,
  ) => FunctionCallHandler
  addContext: (context: string, parentId?: string, categories?: string[]) => string
  removeContext: (id: string) => void
  getContextString: (documents: DocumentPointer[], categories: string[]) => string

  addDocumentContext: (documentPointer: DocumentPointer, categories?: string[]) => TreeNodeId
  removeDocumentContext: (documentId: string) => void
  getDocumentsContext: (categories: string[]) => DocumentPointer[]
  deputyApiConfig: DeputyApiConfig
}

const DeputyContext = React.createContext<DeputyContextType | undefined>(undefined)

interface DeputyProviderProps {
  /**
   * The endpoint for the chat API.
   */
  url: string

  /**
   * additional headers to be sent with the request
   * @default {}
   * @example
   * ```
   * {
   *   'Authorization': 'Bearer your_token_here'
   * }
   * ```
   */
  headers?: Record<string, string>

  /**
   * Additional body params to be sent with the request
   * @default {}
   * @example
   * ```
   * {
   *   'message': 'Hello, world!'
   * }
   * ```
   */
  body?: Record<string, unknown>

  /**
   * The children to be rendered within the CopilotKit.
   */
  children: React.ReactNode
}

export function DeputyProvider({ children, ...props }: DeputyProviderProps) {
  const {
    addElement: addDocument,
    removeElement: removeDocument,
    allElements: allDocuments,
  } = useFlatCategoryStore<DocumentPointer>()

  const { addElement, removeElement, printTree } = useTree()

  const [entryPoints, setEntryPoints] = React.useState<Record<string, AnnotatedFunction<any[]>>>({})

  const setEntryPoint = React.useCallback((id: string, entryPoint: AnnotatedFunction<any[]>) => {
    setEntryPoints((prev) => {
      return {
        ...prev,
        [id]: entryPoint,
      }
    })
  }, [])

  const removeEntryPoint = React.useCallback((id: string) => {
    setEntryPoints((prev) => {
      const { [id]: _, ...rest } = prev
      return rest
    })
  }, [])

  const addContext = React.useCallback(
    (context: string, parentId?: string, categories: string[] = ['global']) => {
      return addElement(context, categories, parentId)
    },
    [],
  )

  const removeContext = React.useCallback((id: string) => {
    removeElement(id)
  }, [])

  const getContextString = React.useCallback(
    (documents: DocumentPointer[], categories: string[]) => {
      const documentsString = documents
        .map((document) => {
          return `${document.name} (${document.sourceApplication}):\n${document.getContents()}`
        })
        .join('\n\n')

      const nonDocumentStrings = printTree(categories)

      return `${documentsString}\n\n${nonDocumentStrings}`
    },
    [printTree],
  )

  const getChatCompletionFunctionDescriptions = React.useCallback(
    (customEntryPoints?: Record<string, AnnotatedFunction<any[]>>) => {
      return entryPointsToChatCompletionFunctions(Object.values(customEntryPoints || entryPoints))
    },
    [entryPoints],
  )

  const getFunctionCallHandler = React.useCallback(
    (customEntryPoints?: Record<string, AnnotatedFunction<any[]>>) => {
      return entryPointsToFunctionCallHandler(Object.values(customEntryPoints || entryPoints))
    },
    [entryPoints],
  )

  const getDocumentsContext = React.useCallback(
    (categories: string[]) => {
      return allDocuments(categories)
    },
    [allDocuments],
  )

  const addDocumentContext = React.useCallback(
    (documentPointer: DocumentPointer, categories: string[] = ['global']) => {
      return addDocument(documentPointer, categories)
    },
    [addDocument],
  )

  const removeDocumentContext = React.useCallback(
    (documentId: string) => {
      removeDocument(documentId)
    },
    [removeDocument],
  )

  const deputyApiConfig: DeputyApiConfig = new StandardDeputyApiConfig(
    props.url,
    `${props.url}/v2`,
    props.headers || {},
    props.body || {},
  )

  return (
    <DeputyContext.Provider
      value={{
        entryPoints,
        setEntryPoint,
        removeEntryPoint,
        addContext,
        removeContext,
        getContextString,
        getChatCompletionFunctionDescriptions,
        getFunctionCallHandler,
        addDocumentContext,
        removeDocumentContext,
        getDocumentsContext,
        deputyApiConfig,
      }}
    >
      {children}
    </DeputyContext.Provider>
  )
}

export function useDeputyContext() {
  const deputyContext = React.useContext(DeputyContext)
  if (deputyContext === undefined) {
    throw new Error('Tried to use deputyContext outside of a DeputyContextProvider!')
  } else {
    return deputyContext
  }
}

function entryPointsToFunctionCallHandler(
  entryPoints: AnnotatedFunction<any[]>[],
): FunctionCallHandler {
  return async (chatMessages, functionCall) => {
    const entrypointsByFunctionName: Record<string, AnnotatedFunction<any[]>> = {}
    for (const entryPoint of entryPoints) {
      entrypointsByFunctionName[entryPoint.name] = entryPoint
    }

    const entryPointFunction = entrypointsByFunctionName[functionCall.name || '']
    if (entryPointFunction) {
      let functionCallArguments: Record<string, any>[] = []
      if (functionCall.arguments) {
        functionCallArguments = JSON.parse(functionCall.arguments)
      }

      const paramsInCorrectOrder: any[] = []
      for (const arg of entryPointFunction.argumentAnnotations) {
        paramsInCorrectOrder.push(
          functionCallArguments[arg.name as keyof typeof functionCallArguments],
        )
      }

      await entryPointFunction.implementation(...paramsInCorrectOrder)

      // commented out becasue for now we don't want to return anything
      // const result = await entryPointFunction.implementation(
      //   ...parsedFunctionCallArguments
      // );
      // const functionResponse: ChatRequest = {
      //   messages: [
      //     ...chatMessages,
      //     {
      //       id: nanoid(),
      //       name: functionCall.name,
      //       role: 'function' as const,
      //       content: JSON.stringify(result),
      //     },
      //   ],
      // };

      // return functionResponse;
    }
  }
}

function entryPointsToChatCompletionFunctions(
  entryPoints: AnnotatedFunction<any[]>[],
): AiFunction[] {
  return entryPoints.map(annotatedFunctionToChatCompletionFunction)
}
