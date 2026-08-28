"use client";

import React, { useId, useState } from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { cn } from "@/lib/utils";
import { generateColorShades } from "@/utils/theme/color-generator";
import { getEventImageUrl, getOrgImageUrl } from "@/lib/image-url-utils";

interface TicketProps {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly logoUrl?: string | null;
  readonly flierImage?: string | null;
  readonly bannerImage?: string | null;
  readonly organizationName?: string;
  readonly eventName?: string;
  readonly ticketType?: string;
  readonly dateTime?: string;
  readonly venue?: string;
  readonly ticketCode?: string;
  readonly qrPayload?: string;
  readonly className?: string;
  readonly exportMode?: boolean;
  readonly exportSide?: "front" | "back" | "both";
  readonly buyerName?: string;
}

const RETRO_PATH = "M 0,0.1 C 0,0.05 0.05,0 0.1,0 L 0.9,0 C 0.95,0 1,0.05 1,0.1 L 1,0.4 C 0.98,0.4 0.96,0.42 0.96,0.5 C 0.96,0.58 0.98,0.6 1,0.6 L 1,0.9 C 1,0.95 0.95,1 0.9,1 L 0.1,1 C 0.05,1 0,0.95 0,0.9 L 0,0.6 C 0.02,0.6 0.04,0.58 0.04,0.5 C 0.04,0.42 0.02,0.4 0,0.4 Z";

function TicketClipPath({ id }: { id: string }) {
  return (
    <svg
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={id} clipPathUnits="objectBoundingBox">
          <path d={RETRO_PATH} />
        </clipPath>
      </defs>
    </svg>
  );
}

function TicketOutline({ color }: { color: string }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
    >
      <path
        d={RETRO_PATH}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

const DotPattern = ({ color }: { color: string }) => (
  <div 
    className="absolute inset-0 opacity-[0.03] pointer-events-none"
    style={{
      backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`,
      backgroundSize: '12px 12px'
    }}
  />
);

export function TicketCardRetro({
  primaryColor,
  secondaryColor,
  logoUrl,
  flierImage,
  organizationName,
  eventName,
  ticketType,
  dateTime,
  venue,
  ticketCode,
  qrPayload,
  className,
  exportMode = false,
  exportSide = "both",
  buyerName,
  stacked = true,
}: TicketProps & { stacked?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const clipId = `ticket-retro-clip-${uid}`;
  const [flipped, setFlipped] = React.useState(false);
  const primaryShades = generateColorShades(primaryColor);
  
  const showFront = exportMode ? (exportSide === "front" || exportSide === "both") : true;
  const showBack = exportMode ? (exportSide === "back" || exportSide === "both") : true;

  const renderFront = () => (
    <div
      className={cn(
        "relative flex h-full overflow-hidden",
        exportMode ? "w-[560px] h-[210px]" : "w-full rounded-lg shadow-2xl"
      )}
      style={{
        clipPath: `url(#${clipId})`,
        backgroundColor: "#f4f1ea", // Vintage paper cream
        color: "#1a1a1a",
        fontFamily: "'Courier New', Courier, monospace",
      }}
    >
      <DotPattern color={primaryColor} />
      <TicketOutline color={primaryShades[200]} />
      
      {/* Texture Overlay (Grain) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-black/5" />

      {/* Top Edge Perforation Visual */}
      <div className="absolute top-0 left-0 right-0 h-1 flex justify-around px-4">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 -translate-y-1/2 rounded-full bg-muted/40" />
          ))}
      </div>

      {/* Left: Event Visual */}
      <div className="w-1/3 h-full relative border-r-2 border-dashed border-black/10">
        {(() => {
          const imageUrl = getEventImageUrl(flierImage);
          if (imageUrl) {
            return (
              <Image 
                src={imageUrl} 
                alt="Event" 
                fill
                className="object-cover grayscale-[0.3] sepia-[0.2]" 
              />
            );
          }
          return (
            <div className="w-full h-full flex items-center justify-center bg-black/5">
              <span className="text-[10px] font-bold rotate-[-45deg] opacity-20">NO IMAGE</span>
            </div>
          );
        })()}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <div className="text-[8px] font-bold tracking-tighter opacity-70">ADMIT ONE</div>
          <div className="text-[10px] font-bold truncate uppercase">{organizationName}</div>
        </div>
      </div>

      {/* Center/Right: Details */}
      <div className="flex-1 flex flex-col p-5 relative">
        <div className="absolute top-4 right-4 border-2 border-black/80 px-2 py-0.5 rotate-3 font-black text-xs">
          {ticketType?.toUpperCase()}
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-[10px] font-bold text-muted-foreground mb-0.5">EVENT TITLE</div>
            <h3 className="text-xl font-black leading-tight tracking-tight uppercase line-clamp-2" style={{ color: primaryColor }}>
              {eventName}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[8px] font-bold text-muted-foreground mb-0.5">DATE & TIME</div>
              <div className="text-[11px] font-bold leading-none">{dateTime}</div>
            </div>
            <div>
              <div className="text-[8px] font-bold text-muted-foreground mb-0.5">VENUE</div>
              <div className="text-[11px] font-bold leading-none truncate">{venue}</div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div>
            <div className="text-[8px] font-bold text-muted-foreground mb-0.5">HOLDER</div>
            <div className="text-[11px] font-black uppercase">{buyerName || "---"}</div>
          </div>
          <div className="text-right">
            <div className="text-[8px] font-bold text-muted-foreground mb-0.5">TICKET ID</div>
            <div className="text-[11px] font-mono tracking-widest">{ticketCode}</div>
          </div>
        </div>
      </div>

      {/* Perforation Line */}
      <div 
        className="absolute left-[33.33%] top-0 bottom-0 w-[2px]" 
        style={{
          backgroundImage: 'linear-gradient(to bottom, transparent 33%, rgba(0,0,0,0.1) 0%)',
          backgroundPosition: 'left',
          backgroundSize: '1px 12px',
          backgroundRepeat: 'repeat-y'
        }}
      />
    </div>
  );

  const renderBack = () => (
    <div
      className={cn(
        "relative flex h-full overflow-hidden",
        exportMode ? "w-[560px] h-[210px]" : "w-full rounded-lg shadow-2xl"
      )}
      style={{
        clipPath: `url(#${clipId})`,
        backgroundColor: "#ece9df", // Slightly darker paper for back
        color: "#1a1a1a",
        fontFamily: "'Courier New', Courier, monospace",
      }}
    >
      <DotPattern color={primaryColor} />
      <TicketOutline color={primaryShades[200]} />
      <div className="w-full h-full flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2">
            <div className="border-4 border-black p-2 bg-white rotate-[-1deg]">
              {qrPayload ? (
                <QRCode 
                  value={qrPayload} 
                  size={exportMode ? 100 : 100} 
                  fgColor="#1a1a1a"
                  bgColor="#ffffff"
                />
              ) : (
                <div className="w-24 h-24 bg-muted animate-pulse" />
              )}
            </div>
            <div className="text-center space-y-1">
              <div className="text-[10px] font-black tracking-[0.2em]">VALIDATE AT GATE</div>
              <div className="text-[8px] opacity-60 max-w-[200px]">
                DO NOT FOLD OR MUTILATE. VOID IF DETACHED. AFROTIX OFFICIAL DOCUMENT.
              </div>
            </div>
        </div>
      </div>
    </div>
  );

  if (exportMode) {
    return (
      <div className={cn("flex flex-col gap-12 p-4 bg-transparent w-[600px]", className)}>
        <TicketClipPath id={clipId} />
        {showFront && (
          <div className="relative w-[560px] h-[215px] shrink-0 mx-auto">
             {renderFront()}
          </div>
        )}
        {showBack && (
          <div className="relative w-[560px] h-[215px] shrink-0 mx-auto">
             {renderBack()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn("cursor-pointer select-none", className)}
      style={{ perspective: 1200 }}
    >
      <TicketClipPath id={clipId} />
      
      <div
        className="relative w-full max-w-[560px] h-[210px]"
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="absolute inset-0 z-10"
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 0.6s cubic-bezier(.4,0,.2,1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* ── FRONT ── */}
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            {renderFront()}
          </div>

          {/* ── BACK ── */}
          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {renderBack()}
          </div>
        </div>
      </div>
    </div>
  );
}
