import { cva } from "class-variance-authority"

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-green-500 text-white hover:bg-green-500/80",
        review:
          "border-transparent bg-blue-500 text-white hover:bg-blue-500/80",
        reviewed:
          "border-transparent bg-purple-500 text-white hover:bg-purple-500/80",
        softNeutral:
          "bg-muted text-muted-foreground border-border hover:bg-muted/80",
        softInfo:
          "bg-primary/15 text-primary border-primary/20 hover:bg-primary/20",
        softSuccess:
          "bg-secondary/15 text-secondary-foreground border-secondary/30 hover:bg-secondary/20",
        softAmber:
          "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100/80",
        teal:
          "bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-100/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
