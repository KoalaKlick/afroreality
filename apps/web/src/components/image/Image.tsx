"use client";

import React from "react";
import NextImage, { type ImageProps as NextImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { getImageUrl, getAvatarUrl, getOrgImageUrl } from "@/lib/image-url-utils";

export interface ImageProps extends Omit<NextImageProps, "src"> {
  src?: string | null;
  fallback?: string;
  containerClassName?: string;
}

export function Image({
  src,
  alt = "fextiva Image",
  className,
  fallback,
  width = 400,
  height = 300,
  ...props
}: ImageProps) {
  const [error, setError] = React.useState(false);
  const resolvedSrc = error || !src ? fallback || "" : getImageUrl(src);

  if (!resolvedSrc) {
    return <div className={cn("bg-neutral-100 dark:bg-neutral-800", className)} />;
  }

  return (
    <NextImage
      src={resolvedSrc}
      alt={alt}
      width={width}
      height={height}
      onError={() => setError(true)}
      className={cn("object-cover", className)}
      unoptimized={true}
      {...props}
    />
  );
}

export function Avatar({
  src,
  alt = "User avatar",
  className,
  size = 40,
  width,
  height,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  size?: number;
  width?: number;
  height?: number;
}) {
  const finalSize = width || height || size;
  return (
    <Image
      src={getAvatarUrl(src)}
      alt={alt}
      width={finalSize}
      height={finalSize}
      className={cn("rounded-full", className)}
    />
  );
}

export function Logo({
  src,
  alt = "Logo",
  className,
  size = 40,
  width,
  height,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  size?: number;
  width?: number;
  height?: number;
}) {
  const finalSize = width || height || size;
  return (
    <Image
      src={getOrgImageUrl(src)}
      alt={alt}
      width={finalSize}
      height={finalSize}
      className={cn("rounded-lg object-contain", className)}
    />
  );
}
