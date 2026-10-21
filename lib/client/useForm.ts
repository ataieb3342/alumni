'use client'

import { useCallback, useMemo, useState } from 'react'
import type { ZodType } from 'zod'
import { ApiError } from './api'

/**
 * Formulaire avec validation en direct : un champ est vérifié quand on le
 * quitte, puis à chaque frappe ; le même schéma Zod que le serveur sert de
 * référence. Les erreurs renvoyées par l'API se replacent sous leur champ.
 */
export function useForm<T extends Record<string, unknown>>(schema: ZodType, initial: T) {
  const [values, setValues] = useState<T>(initial)
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [serverErrors, setServerErrors] = useState<Partial<Record<string, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const allErrors = useMemo(() => {
    const result = schema.safeParse(values)
    const errors: Partial<Record<string, string>> = {}
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? '')
        if (key && !errors[key]) errors[key] = issue.message
      }
    }
    return errors
  }, [schema, values])

  const error = useCallback(
    (field: keyof T & string): string | null => {
      if (serverErrors[field]) return serverErrors[field] ?? null
      if (!touched[field] && !submitted) return null
      return allErrors[field] ?? null
    },
    [allErrors, serverErrors, touched, submitted]
  )

  const set = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((current) => ({ ...current, [field]: value }))
    setServerErrors((current) => (current[field as string] ? { ...current, [field as string]: undefined } : current))
  }, [])

  const bind = useCallback(
    (field: keyof T & string) => ({
      name: field,
      value: (values[field] ?? '') as string,
      onChange: (event: { target: { value: string } }) => set(field, event.target.value as T[keyof T & string]),
      onBlur: () => setTouched((current) => ({ ...current, [field]: true })),
    }),
    [values, set]
  )

  /** À appeler à l'envoi : vrai si tout est valide (sinon toutes les erreurs s'affichent) */
  const validate = useCallback(() => {
    setSubmitted(true)
    setFormError(null)
    return Object.keys(allErrors).length === 0
  }, [allErrors])

  const applyServerError = useCallback((err: unknown) => {
    if (err instanceof ApiError) {
      if (err.field) setServerErrors((current) => ({ ...current, [err.field!.split('.')[0]]: err.message }))
      else setFormError(err.message)
    } else {
      setFormError(err instanceof Error ? err.message : 'Une erreur est survenue')
    }
  }, [])

  return { values, set, bind, error, validate, isValid: Object.keys(allErrors).length === 0, formError, setFormError, applyServerError, firstError: Object.values(allErrors)[0] }
}
