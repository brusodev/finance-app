import { useState, useEffect, useMemo, useRef } from 'react'
import { ChevronDown, Search, Check } from 'lucide-react'

const normalize = (text) =>
  text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

const categoryLabel = (category) =>
  category.icon ? `${category.icon} ${category.name}` : category.name

export default function CategorySelect({
  categories,
  value,
  onChange,
  placeholder = 'Selecione uma categoria',
  allowEmpty = false,
  compact = false,
  disabled = false,
  className = ''
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef(null)
  const searchRef = useRef(null)
  const listRef = useRef(null)

  const selected = categories.find((c) => c.id === parseInt(value)) || null

  // null na lista representa a opção "sem categoria" (quando allowEmpty)
  const options = useMemo(() => {
    const q = normalize(query.trim())
    const filtered = q ? categories.filter((c) => normalize(c.name).includes(q)) : categories
    return allowEmpty && !q ? [null, ...filtered] : filtered
  }, [categories, query, allowEmpty])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  useEffect(() => {
    setHighlighted(0)
  }, [query])

  useEffect(() => {
    listRef.current?.children[highlighted]?.scrollIntoView({ block: 'nearest' })
  }, [highlighted])

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  const select = (option) => {
    onChange(option ? option.id : '')
    close()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (options.length > 0) select(options[highlighted])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'Enter') {
            e.preventDefault()
            setOpen(true)
          }
        }}
        className={`w-full ${compact ? 'px-3 py-2 text-sm' : 'px-4 py-2'} border border-zinc-200 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zinc-50 dark:bg-[#1a1a1a] text-left flex items-center justify-between gap-2 text-zinc-900 dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className={`truncate ${selected ? '' : 'text-zinc-400 dark:text-zinc-500'}`}>
          {selected ? categoryLabel(selected) : placeholder}
        </span>
        <ChevronDown
          size={compact ? 16 : 18}
          className={`shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full min-w-48 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#111111] shadow-xl overflow-hidden">
          <div className="relative border-b border-zinc-100 dark:border-white/[0.06]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar categoria..."
              className="w-full pl-9 pr-4 py-2.5 bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <ul ref={listRef} className="max-h-56 overflow-y-auto py-1">
            {options.length === 0 && (
              <li className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                Nenhuma categoria encontrada
              </li>
            )}
            {options.map((option, index) => (
              <li key={option ? option.id : 'empty'}>
                <button
                  type="button"
                  onClick={() => select(option)}
                  onMouseEnter={() => setHighlighted(index)}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between gap-2 transition-colors ${
                    option ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'
                  } ${index === highlighted ? 'bg-zinc-100 dark:bg-white/[0.06]' : ''}`}
                >
                  <span className="truncate">
                    {option ? categoryLabel(option) : placeholder}
                  </span>
                  {((option && selected?.id === option.id) || (!option && !selected)) && (
                    <Check size={16} className="shrink-0 text-blue-500" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
