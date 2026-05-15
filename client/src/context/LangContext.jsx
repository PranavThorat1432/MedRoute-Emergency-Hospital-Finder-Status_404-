import { createContext, useContext, useState } from 'react'
import { t } from '../utils/translations'

const LangContext = createContext()

export function LangProvider({ children }) {
  const [lang, setLang] = useState('en')
  return (
    <LangContext.Provider value={{ lang, setLang, t: (key) => t(lang, key) }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
