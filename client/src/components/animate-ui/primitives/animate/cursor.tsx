import * as React from 'react'
import {
  motion,
  useMotionValue,
  AnimatePresence,
  type MotionValue,
  type HTMLMotionProps,
} from 'motion/react'

import { getStrictContext } from '@/lib/get-strict-context'
import {
  Slot,
  type WithAsChild,
} from '@/components/animate-ui/primitives/animate/slot'

const CURSOR_NONE_CLASS = 'animate-ui-cursor-none'

const NATIVE_CURSOR_SELECTOR =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"]), :disabled, [aria-disabled="true"]'

const CURSOR_NONE_STYLE = `
  .${CURSOR_NONE_CLASS} { cursor: none !important; }
  .${CURSOR_NONE_CLASS} *:not(
    :is(${NATIVE_CURSOR_SELECTOR}),
    :is(${NATIVE_CURSOR_SELECTOR}) *
  ) { cursor: none !important; }
`

function keepsNativeCursor(target: EventTarget | null) {
  return (
    target instanceof Element && target.closest(NATIVE_CURSOR_SELECTOR) !== null
  )
}

type CursorContextType = {
  x: MotionValue<number>
  y: MotionValue<number>
  active: boolean
  global: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  cursorRef: React.RefObject<HTMLDivElement | null>
}

const [LocalCursorProvider, useCursor] =
  getStrictContext<CursorContextType>('CursorContext')

type CursorProviderProps = {
  children: React.ReactNode
  global?: boolean
}

function CursorProvider({ children, global = false }: CursorProviderProps) {
  const [active, setActive] = React.useState(false)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const containerRef = React.useRef<HTMLDivElement>(null)
  const cursorRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const id = '__cursor_none_style__'
    if (document.getElementById(id)) return

    const style = document.createElement('style')
    style.id = id
    style.textContent = CURSOR_NONE_STYLE
    document.head.appendChild(style)
  }, [])

  React.useEffect(() => {
    const handlePointerOut = (e: PointerEvent | MouseEvent) => {
      if (e.relatedTarget === null) setActive(false)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') setActive(false)
    }

    if (global) {
      const handlePointerMove = (e: PointerEvent) => {
        if (e.pointerType === 'touch') {
          setActive(false)
          return
        }

        x.set(e.clientX)
        y.set(e.clientY)
        setActive(!keepsNativeCursor(e.target))
      }

      window.addEventListener('pointermove', handlePointerMove, {
        passive: true,
      })
      window.addEventListener('pointerout', handlePointerOut, {
        passive: true,
      })
      window.addEventListener('mouseout', handlePointerOut, { passive: true })
      document.addEventListener('visibilitychange', handleVisibilityChange)

      return () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerout', handlePointerOut)
        window.removeEventListener('mouseout', handlePointerOut)
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange,
        )
      }
    }

    const parent = containerRef.current?.parentElement
    if (!parent) return

    if (getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative'
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        setActive(false)
        return
      }

      const rect = parent.getBoundingClientRect()
      x.set(e.clientX - rect.left)
      y.set(e.clientY - rect.top)
      setActive(!keepsNativeCursor(e.target))
    }

    const handleParentPointerOut = (e: PointerEvent | MouseEvent) => {
      if (
        e.relatedTarget === null ||
        !parent.contains(e.relatedTarget as Node)
      ) {
        setActive(false)
      }
    }

    parent.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    })
    parent.addEventListener('pointerout', handleParentPointerOut, {
      passive: true,
    })
    parent.addEventListener('mouseout', handleParentPointerOut, {
      passive: true,
    })
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      parent.removeEventListener('pointermove', handlePointerMove)
      parent.removeEventListener('pointerout', handleParentPointerOut)
      parent.removeEventListener('mouseout', handleParentPointerOut)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [global, x, y])

  return (
    <LocalCursorProvider
      value={{ x, y, active, global, containerRef, cursorRef }}
    >
      {children}
    </LocalCursorProvider>
  )
}

type CursorContainerProps = WithAsChild<HTMLMotionProps<'div'>>

function CursorContainer({
  ref,
  asChild = false,
  ...props
}: CursorContainerProps) {
  const { containerRef, global, active } = useCursor()
  React.useImperativeHandle(ref, () => containerRef.current as HTMLDivElement)

  const Component = asChild ? Slot : motion.div

  return (
    <Component
      ref={containerRef}
      data-slot="cursor-container"
      data-global={global}
      data-active={active}
      {...props}
    />
  )
}

type CursorProps = WithAsChild<
  HTMLMotionProps<'div'> & {
    children: React.ReactNode
  }
>

function Cursor({ ref, asChild = false, style, ...props }: CursorProps) {
  const { x, y, active, containerRef, cursorRef, global } = useCursor()
  React.useImperativeHandle(ref, () => cursorRef.current as HTMLDivElement)

  React.useEffect(() => {
    const target = global
      ? document.documentElement
      : containerRef.current?.parentElement

    if (!target) return

    if (active) {
      target.classList.add(CURSOR_NONE_CLASS)
    } else {
      target.classList.remove(CURSOR_NONE_CLASS)
    }

    return () => {
      target.classList.remove(CURSOR_NONE_CLASS)
    }
  }, [active, global, containerRef])

  const Component = asChild ? Slot : motion.div

  return (
    <AnimatePresence>
      {active && (
        <Component
          ref={cursorRef}
          data-slot="cursor"
          data-global={global}
          data-active={active}
          style={{
            transform: 'translate(-50%,-50%)',
            pointerEvents: 'none',
            zIndex: 9999,
            position: global ? 'fixed' : 'absolute',
            top: y,
            left: x,
            ...style,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          {...props}
        />
      )}
    </AnimatePresence>
  )
}

export {
  CursorProvider,
  Cursor,
  CursorContainer,
  useCursor,
  type CursorProviderProps,
  type CursorProps,
  type CursorContainerProps,
  type CursorContextType,
}
