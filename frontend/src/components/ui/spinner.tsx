import { cn } from "cn"
import { RiLoader4Line } from "@remixicon/react"

// shadcn Spinner with the project's Remix icon set.
function Spinner({
  className,
  ...props
}: React.ComponentProps<typeof RiLoader4Line>) {
  return (
    <RiLoader4Line
      role="status"
      aria-label="Loading"
      className={cn(
        "size-4 animate-spin motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  )
}

export { Spinner }
