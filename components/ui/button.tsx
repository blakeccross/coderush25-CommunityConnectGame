import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "border bg-background shadow-xs hover:bg-accent dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  onClick,
  disabled,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  type SparkleStyle = React.CSSProperties & { [key in "--dx" | "--dy"]?: string };

  const [sparkles, setSparkles] = React.useState<{ id: number; dx: number; dy: number }[]>([]);

  const triggerSparkles = React.useCallback(() => {
    if (disabled) return;
    const count = 6; // number of sparkles per click
    const next: { id: number; dx: number; dy: number }[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 16 + Math.random() * 20; // px
      next.push({
        id: Date.now() + i,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance,
      });
    }
    setSparkles(next);
    // Cleanup after animation
    window.setTimeout(() => {
      setSparkles([]);
    }, 700);
  }, [disabled]);

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    triggerSparkles();
    onClick?.(e);
  };

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }), "relative")}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {props.children}
      {sparkles.length > 0 && (
        <span className="sparkle-container" aria-hidden>
          {sparkles.map((s) => (
            <span
              key={s.id}
              className="sparkle"
              style={
                {
                  left: "50%",
                  top: "50%",
                  marginLeft: "-5px",
                  marginTop: "-5px",
                  "--dx": `${s.dx}px`,
                  "--dy": `${s.dy}px`,
                  color: "currentColor",
                } as SparkleStyle
              }
            >
              <svg viewBox="0 0 20 20" aria-hidden>
                <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill="currentColor" />
              </svg>
            </span>
          ))}
        </span>
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
