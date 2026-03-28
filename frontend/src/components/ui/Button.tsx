import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'human' | 'ai'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize
  readonly children: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brutal-yellow text-brutal-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm',
  secondary: 'bg-brutal-white text-brutal-black hover:bg-brutal-light-gray',
  danger: 'bg-brutal-red text-brutal-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm',
  ghost: 'bg-transparent text-brutal-black border-transparent shadow-none hover:bg-brutal-light-gray',
  human: 'bg-human text-brutal-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm',
  ai: 'bg-ai text-brutal-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-8 py-4 text-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'brutal-border font-display font-bold uppercase tracking-wider shadow-brutal transition-all duration-150 cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-0 disabled:shadow-brutal',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
