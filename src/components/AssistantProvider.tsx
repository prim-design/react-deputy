import React, { createContext, useCallback } from "react";

import { v4 as uuid } from "uuid";

export interface AssistantContextType {
  addContext: ({ label, value }: { label: string; value: string }) => string;
  removeContext: (id: string) => void;
  contextMap: Map<string, { label: string; value: string }>;
}

export const AssistantContext = createContext<AssistantContextType | undefined>(
  undefined
);

interface AssistantProviderProps {
  children: React.ReactNode;
}

const contextMap = new Map();

// Define the AssistantProvider component
export function AssistantProvider({ children }: AssistantProviderProps) {
  // Implement your Assistant provider logic here

  const addContext = useCallback(
    ({ label, value }: { label: string; value: string }) => {
      const id = uuid();
      contextMap.set(id, { label, value });
      return id;
    },
    []
  );

  const removeContext = useCallback((id: string) => {
    contextMap.delete(id);
  }, []);

  return (
    <AssistantContext.Provider
      value={{
        addContext,
        removeContext,
        contextMap,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
}
