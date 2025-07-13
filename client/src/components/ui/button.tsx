import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 ripple",
  {
    variants: {
      variant: {
        default:
          "rounded-xl bg-gradient-primary text-primary-foreground shadow-card hover:shadow-hover hover:scale-105 micro-bounce",
        destructive:
          "rounded-xl bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "rounded-xl border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground micro-lift",
        secondary:
          "rounded-xl bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-card micro-bounce",
        ghost: "rounded-xl hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        glass: 
          "rounded-xl backdrop-blur-md bg-gradient-glass border border-glass-border text-foreground hover:bg-gradient-primary hover:text-primary-foreground hover:shadow-hover micro-lift",
        neuro:
          "rounded-xl bg-gradient-neuro shadow-neuro hover:shadow-neuro-inset text-foreground micro-bounce",
        hero: 
          "rounded-xl bg-gradient-primary text-primary-foreground shadow-glass hover:shadow-hover hover:scale-105 animate-glow micro-bounce",
        pill: 
          "rounded-pill bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground micro-bounce px-6 py-3",
        "pill-primary":
          "rounded-pill bg-gradient-primary text-primary-foreground hover:shadow-hover hover:scale-105 micro-bounce px-6 py-3",
        "pill-glass":
          "rounded-pill backdrop-blur-md bg-gradient-glass border border-glass-border text-foreground hover:bg-gradient-primary hover:text-primary-foreground micro-lift px-6 py-3",
        floating: 
          "fixed bottom-6 right-6 rounded-full bg-gradient-primary text-primary-foreground shadow-elevation hover:scale-110 z-50 w-14 h-14 micro-bounce",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
