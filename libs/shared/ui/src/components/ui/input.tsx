import * as React from "react"

import { cn } from '../../lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_hsl(var(--background))] [&:-webkit-autofill]:[-webkit-text-fill-color:hsl(var(--foreground))]",
          className
        )}
        ref={ref}
        {...props}/>
    )
  }
)
Input.displayName = "Input"

export { Input }
