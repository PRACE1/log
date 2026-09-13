"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@listeningkit/ui";
import type { LucideIcon } from "lucide-react";
import { BrainIcon, DotIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { memo } from "react";

export type ChainOfThoughtProps = ComponentProps<"div">;

export const ChainOfThought = memo(
  ({ className, children, ...props }: ChainOfThoughtProps) => (
    <div className={cn("not-prose w-full space-y-4", className)} {...props}>
      {children}
    </div>
  )
);

export type ChainOfThoughtHeaderProps = ComponentProps<"div">;

export const ChainOfThoughtHeader = memo(
  ({ className, children, ...props }: ChainOfThoughtHeaderProps) => (
    <div
      className={cn("flex w-full items-center gap-2 text-sm", className)}
      {...props}
    >
      <BrainIcon className="size-4" />
      <span className="flex-1 text-left">{children ?? "Chain of Thought"}</span>
    </div>
  )
);

export type ChainOfThoughtStepProps = ComponentProps<"div"> & {
  icon?: LucideIcon;
  label: ReactNode;
  description?: ReactNode;
  status?: "complete" | "active" | "pending";
};

const stepStatusStyles = {
  active: "border-white/10 bg-[#2A8CFF] text-white",
  complete: "bg-black/5 text-foreground",
  pending: "bg-black/5 text-muted-foreground/50",
};

export const ChainOfThoughtStep = memo(
  ({
    className,
    icon: Icon = DotIcon,
    label,
    description,
    status = "complete",
    children,
    ...props
  }: ChainOfThoughtStepProps) => (
    <div
      className={cn("flex gap-2 text-sm", className)}
      {...props}
    >
      <div className="relative -mt-1 shrink-0">
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-md",
            stepStatusStyles[status]
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="absolute top-9 bottom-0 left-1/2 -mx-px w-px bg-border" />
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <div
          className={cn(
            status === "active" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {label}
        </div>
        {description && (
          <div className="text-muted-foreground text-xs">{description}</div>
        )}
        {children}
      </div>
    </div>
  )
);

export type ChainOfThoughtSearchResultsProps = ComponentProps<"div">;

export const ChainOfThoughtSearchResults = memo(
  ({ className, ...props }: ChainOfThoughtSearchResultsProps) => (
    <div className={cn("flex flex-wrap items-center gap-2", className)} {...props} />
  )
);

export type ChainOfThoughtSearchResultProps = ComponentProps<typeof Badge>;

export const ChainOfThoughtSearchResult = memo(
  ({ className, children, ...props }: ChainOfThoughtSearchResultProps) => (
    <Badge
      className={cn("gap-1 px-2 py-0.5 font-normal text-xs", className)}
      variant="secondary"
      {...props}
    >
      {children}
    </Badge>
  )
);

export type ChainOfThoughtContentProps = ComponentProps<"div">;

export const ChainOfThoughtContent = memo(
  ({ className, children, ...props }: ChainOfThoughtContentProps) => (
    <div className={cn("mt-2 space-y-3", className)} {...props}>
      {children}
    </div>
  )
);

export type ChainOfThoughtImageProps = ComponentProps<"div"> & {
  caption?: string;
};

export const ChainOfThoughtImage = memo(
  ({ className, children, caption, ...props }: ChainOfThoughtImageProps) => (
    <div className={cn("mt-2 space-y-2", className)} {...props}>
      <div className="relative flex max-h-[22rem] items-center justify-center overflow-hidden rounded-lg bg-muted p-3">
        {children}
      </div>
      {caption && <p className="text-muted-foreground text-xs">{caption}</p>}
    </div>
  )
);

ChainOfThought.displayName = "ChainOfThought";
ChainOfThoughtHeader.displayName = "ChainOfThoughtHeader";
ChainOfThoughtStep.displayName = "ChainOfThoughtStep";
ChainOfThoughtSearchResults.displayName = "ChainOfThoughtSearchResults";
ChainOfThoughtSearchResult.displayName = "ChainOfThoughtSearchResult";
ChainOfThoughtContent.displayName = "ChainOfThoughtContent";
ChainOfThoughtImage.displayName = "ChainOfThoughtImage";