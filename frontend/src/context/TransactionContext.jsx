import React, { createContext, useState, useContext } from 'react'

const TransactionContext = createContext()

export function TransactionProvider({ children }) {
  const [showForm, setShowForm] = useState(false)

  return (
    <TransactionContext.Provider value={{ showForm, setShowForm }}>
      {children}
    </TransactionContext.Provider>
  )
}

export function useTransaction() {
  const context = useContext(TransactionContext)
  if (!context) {
    throw new Error('useTransaction deve ser usado dentro de TransactionProvider')
  }
  return context
}
