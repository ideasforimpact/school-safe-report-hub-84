
import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"
import { X } from "lucide-react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:bg-green-100 group-[.toaster]:text-green-900 group-[.toaster]:border-green-200",
          error: "group-[.toaster]:bg-red-100 group-[.toaster]:text-red-900 group-[.toaster]:border-red-200",
          warning: "group-[.toaster]:bg-amber-100 group-[.toaster]:text-amber-900 group-[.toaster]:border-amber-200",
          info: "group-[.toaster]:bg-blue-100 group-[.toaster]:text-blue-900 group-[.toaster]:border-blue-200",
          closeButton: "bg-transparent text-foreground opacity-100 !important",
        },
        duration: 5000,
        closeButton: true,
        // Use the X component from Lucide as close icon
        closeIcon: <X className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
