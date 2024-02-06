/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { nanoid } from 'nanoid'
import { useDeputyContext } from '../DeputyProvider'
import { AnnotatedFunction } from '../assistant/types'

export function useDeputizeFunction<ActionInput extends any[]>(
  annotatedFunction: AnnotatedFunction<ActionInput>,
  dependencies: unknown[],
) {
  const { setEntryPoint, removeEntryPoint } = useDeputyContext()

  const idRef = React.useRef(nanoid()) // generate a unique id

  const memoizedAnnotatedFunction = React.useMemo(
    () => ({
      name: annotatedFunction.name,
      description: annotatedFunction.description,
      argumentAnnotations: annotatedFunction.argumentAnnotations,
      implementation: annotatedFunction.implementation,
    }),
    dependencies,
  )

  React.useEffect(() => {
    setEntryPoint(idRef.current, memoizedAnnotatedFunction as AnnotatedFunction<any[]>)

    return () => {
      removeEntryPoint(idRef.current)
    }
  }, [memoizedAnnotatedFunction, setEntryPoint, removeEntryPoint])
}
