"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@listeningkit/ui";
import type { LucideIcon } from "lucide-react";
import { BrainIcon, DotIcon } from "lucide-react";
import { motion } from "motion/react";
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
  /**
   * Render a rounded elbow joint instead of a straight rail.
   * - "in" (or `true`): the trunk enters from above-left and curves down-right
   *   into this icon. Use on the FIRST step of a nested sub-chain — the trunk
   *   keeps running past this point (drawn by the parent step), this just
   *   shows the branch peeling off of it.
   * - "out": this icon's own outgoing rail curves out to the left instead of
   *   running straight down, rejoining the trunk below. Use on the LAST step
   *   of a nested sub-chain. This REPLACES the straight rail — it doesn't
   *   render alongside it.
   */
  elbow?: boolean | "in" | "out";
  /**
   * Compact rows (tight sub-steps): the rail starts flush under the icon and
   * ends 4px past the row bottom, tucking behind the next icon so short
   * joints meet with no overshoot and no hairline gap.
   */
  compact?: boolean;
};

const stepStatusStyles = {
  active: "border-white/30 bg-white text-[#2A8CFF]",
  complete: "bg-white text-[#2A8CFF]",
  pending: "bg-black/5 text-muted-foreground/50",
};

export const ChainOfThoughtStep = memo(
  ({
    className,
    icon: Icon = DotIcon,
    label,
    description,
    status = "complete",
    elbow = false,
    compact = false,
    children,
    ...props
  }: ChainOfThoughtStepProps) => {
    const elbowMode = elbow === true ? "in" : elbow;

    return (
      <div className={cn("flex gap-2 text-sm", className)} {...props}>
        <div className="relative shrink-0">
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-md",
              stepStatusStyles[status]
            )}
          >
            <Icon className="size-4" />
          </span>

          {elbowMode === "in" ? (
            <motion.svg
              aria-hidden="true"
              className="absolute -top-2 left-[-29px] z-10"
              width="30"
              height="26"
              viewBox="0 0 30 26"
              fill="none"
            >
              <motion.path
                d="M1 0 L1 13 Q1 25 13 25 L29 25"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="butt"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: status === "complete" ? 1 : 0 }}
                transition={{
                  duration: 0.4,
                  delay: status === "complete" ? 0.3 : 0,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            </motion.svg>
          ) : null}

          {elbowMode === "out" ? (
            // Vertical mirror of the "in" joint: instead of the trunk
            // entering from the top and curving down-right into the icon,
            // this icon's own rail curves out to the left at the BOTTOM,
            // then a plain straight rail (below) picks up at the trunk's
            // x-offset and keeps running down to whatever follows — same
            // top/-bottom-6 handoff convention as every other sibling
            // connector in this file. If the joint doesn't sit flush once
            // rendered, nudge `top-5` / `top-[46px]` a few px to match your
            // icon size/spacing.
            <>
              <motion.svg
                aria-hidden="true"
                className="absolute top-5 left-[-29px] z-10"
                width="30"
                height="26"
                viewBox="0 0 30 26"
                fill="none"
              >
                <motion.path
                  d="M1 26 L1 13 Q1 1 13 1 L29 1"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="butt"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: status === "complete" ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              </motion.svg>
              <motion.div
                className="absolute top-[46px] -bottom-6 left-[-29px] w-[1.75px] origin-top bg-white"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: status === "complete" ? 1 : 0 }}
                transition={{ duration: 0.45, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
            </>
          ) : null}

          {elbowMode !== "out" ? (
            <motion.div
              className={
                compact
                  ? "absolute top-7 -bottom-1 left-1/2 ml-[-0.875px] w-[1.75px] origin-top bg-white"
                  : "absolute top-7 -bottom-6 left-1/2 ml-[-0.875px] mt-2 w-[1.75px] origin-top bg-white"
              }
              initial={{ scaleY: 0 }}
              animate={{ scaleY: status === "complete" ? 1 : 0 }}
              transition={
                elbowMode === "in"
                  ? { duration: 0.45, delay: 0.55, ease: [0.22, 1, 0.36, 1] }
                  : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
              }
            />
          ) : null}
        </div>
        <div className="flex-1 space-y-1 overflow-hidden pb-1">
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
    );
  }
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