import React from 'react'
import { nanoid } from 'nanoid'
// import zodToJsonSchema from 'zod-to-json-schema'
import { FunctionSchema } from '../assistant/types'
import { useDeputyContext } from '../DeputyProvider'

export function useDeputizeFunction(deputyFunction: FunctionSchema) {
  const { setEntryPoint, removeEntryPoint } = useDeputyContext()

  const idRef = React.useRef(nanoid()) // generate a unique id

  const memoizedAnnotatedFunction = React.useMemo(
    () => ({
      name: deputyFunction.name,
      description: deputyFunction.description,
      parameters: deputyFunction.parameters,
      implementation: deputyFunction.implementation,
    }),
    [],
  )

  React.useEffect(() => {
    setEntryPoint(idRef.current, memoizedAnnotatedFunction)

    return () => {
      removeEntryPoint(idRef.current)
    }
  }, [memoizedAnnotatedFunction, setEntryPoint, removeEntryPoint])
}
