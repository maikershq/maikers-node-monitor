"use client";

import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export function Card({
  className,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(
        "rounded-xl border border-zinc-800 text-white shadow-sm",
        className,
      )}
      style={{ backgroundColor: "#181818", ...style }}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge("p-5 border-b border-zinc-800", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={twMerge("font-heading text-lg font-semibold", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={twMerge("p-6", className)} {...props} />;
}
