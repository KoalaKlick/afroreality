"use client";

import { useState, useId } from "react";
import Image from "next/image";
import { QrCode } from "lucide-react";
import QRCode from "react-qr-code";
import { getEventImageUrl, getOrgImageUrl } from "@/lib/image-url-utils";
import { generateColorShades } from "@/utils/theme/color-generator";

interface TicketCardProps {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly tertiaryColor?: string;
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
  readonly stacked?: boolean;
  readonly exportMode?: boolean;
  readonly exportSide?: "front" | "back" | "both";
  readonly buyerName?: string;
}

/**
 * Builds a clip-path that describes the ticket silhouette:
 * a rounded rectangle with 3 semicircular notches punched into each side.
 */
const TICKET_PATH_RELATIVE = [
  `M ${12 / 560} 0`,
  // Top Edge
  `L ${(72 - 12) / 560} 0 A ${12 / 560} ${12 / 210} 0 0 0 ${(72 + 12) / 560} 0`,
  `L ${(560 - 72 - 12) / 560} 0 A ${12 / 560} ${12 / 210} 0 0 0 ${(560 - 72 + 12) / 560} 0`,
  `L ${(560 - 12) / 560} 0`,
  // Corner
  `Q 1 0 1 ${12 / 210}`,
  // Right Edge
  `L 1 ${(105 - 12) / 210} A ${12 / 560} ${12 / 210} 0 0 0 1 ${(105 + 12) / 210}`,
  `L 1 ${(210 - 12) / 210}`,
  // Corner
  `Q 1 1 ${(560 - 12) / 560} 1`,
  // Bottom Edge
  `L ${(560 - 72 + 12) / 560} 1 A ${12 / 560} ${12 / 210} 0 0 0 ${(560 - 72 - 12) / 560} 1`,
  `L ${(72 + 12) / 560} 1 A ${12 / 560} ${12 / 210} 0 0 0 ${(72 - 12) / 560} 1`,
  `L ${12 / 560} 1`,
  // Corner
  `Q 0 1 0 ${(210 - 12) / 210}`,
  // Left Edge
  `L 0 ${(105 + 12) / 210} A ${12 / 560} ${12 / 210} 0 0 0 0 ${(105 - 12) / 210}`,
  `L 0 ${12 / 210}`,
  // Corner
  `Q 0 0 ${12 / 560} 0`,
  `Z`,
].join(" ");

function TicketClipPath({ id }: { id: string }) {
  return (
    <svg
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        overflow: "hidden",
        pointerEvents: "none",
        opacity: 0,
      }}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={id} clipPathUnits="objectBoundingBox">
          <path d={TICKET_PATH_RELATIVE} />
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
        d={TICKET_PATH_RELATIVE}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Dashed perforation line inside the stub */
function StubDash({
  side,
  borderColor,
}: {
  side: "left" | "right";
  borderColor: string;
}) {
  const dashBorder = side === "left" ? "border-r" : "border-l";
  return (
    <div
      className={`absolute top-3 bottom-3 ${dashBorder} border-dashed`}
      style={{
        borderColor: borderColor,
        [side === "left" ? "right" : "left"]: 0,
      }}
    />
  );
}

function Stub({
  side,
  primaryColor,
  backgroundColor,
  borderColor,
  label,
}: {
  side: "left" | "right";
  primaryColor: string;
  backgroundColor: string;
  borderColor: string;
  label: string;
}) {
  const radius = side === "left" ? "rounded-l-xl" : "rounded-r-xl";

  return (
    <div
      className={`w-[72px] shrink-0 flex items-center justify-center relative ${radius}`}
      style={{ background: backgroundColor }}
    >
      <StubDash side={side} borderColor={borderColor} />
      <span
        className="text-[10px] font-black tracking-[0.22em] uppercase opacity-70"
        style={{
          fontFamily: "'Courier New', monospace",
          color: primaryColor,
          writingMode: "vertical-rl",
          transform: side === "left" ? "rotate(180deg)" : "none",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}

/** Ghost ticket for the stacked deck effect */
function GhostTicket({
  backgroundColor,
  outlineColor,
  stubColor,
  clipId,
  translateX = 20,
  translateY = 30,
  rotate = 5,
  zIndex = 0,
}: {
  backgroundColor: string;
  outlineColor: string;
  stubColor: string;
  clipId: string;
  translateX: number;
  translateY: number;
  rotate: number;
  zIndex: number;
}) {
  return (
    <div
      className="absolute inset-0 pointer-events-none rounded-xl"
      style={{
        transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg)`,
        transformOrigin: "center center",
        zIndex,
        clipPath: `url(#${clipId})`,
        backgroundColor: "#ffffff",
        backgroundImage: `linear-gradient(${backgroundColor}, ${backgroundColor}), repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(0,0,0,0.02) 24px)`,
      }}
    >
      <TicketOutline color={outlineColor} />
      {/* Left stub strip */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[72px] rounded-l-xl"
        style={{ background: stubColor }}
      />
      {/* Right stub strip */}
      <div
        className="absolute right-0 top-0 bottom-0 w-[72px] rounded-r-xl"
        style={{ background: stubColor }}
      />
    </div>
  );
}

function TicketShell({
  backgroundColor,
  outlineColor,
  clipId,
  children,
}: {
  backgroundColor: string;
  outlineColor: string;
  clipId: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-row bg-background items-stretch w-full h-full relative rounded-2xl overflow-hidden shadow-sm"
      style={{
        clipPath: `url(#${clipId})`,
        backgroundImage: `linear-gradient(${backgroundColor}, ${backgroundColor}), repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(0,0,0,0.025) 24px)`,
      }}
    >
      <TicketOutline color={outlineColor} />
      {children}
    </div>
  );
}

export function TicketCard({
  primaryColor,
  secondaryColor,
  tertiaryColor = "#dc2626",
  logoUrl,
  flierImage,
  bannerImage,
  organizationName = "Your Organization",
  eventName = "Sample Event 2026",
  ticketType = "General Admission",
  dateTime = "18 Mar 2026, 7:00 PM",
  venue = "Convention Center, Accra",
  ticketCode = "AR-8924-X",
  qrPayload,
  className,
  stacked = false,
  exportMode = false,
  exportSide = "both",
  buyerName = "Valued Guest",
}: TicketCardProps) {
  const [flipped, setFlipped] = useState(false);

  const primaryShades = generateColorShades(primaryColor);
  const secondaryShades = generateColorShades(secondaryColor);

  // Stable unique ID
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const clipId = `ticket-clip-${uid}`;
  const ghostClipId = `ticket-ghost-clip-${uid}`;

  const logoDisplayUrl = getOrgImageUrl(logoUrl);
  const bannerDisplayUrl = getEventImageUrl(bannerImage);
  const flierDisplayUrl = getEventImageUrl(flierImage);
  const heroImageUrl = bannerDisplayUrl || flierDisplayUrl;

  const stubLabel = (organizationName || "").slice(0, 10);

  const barWidths = [3, 1.5, 1.5, 3, 1.5, 2, 1.5, 3, 1.5, 1.5, 3, 2, 1.5, 3, 1.5, 2, 3, 1.5, 3, 1.5, 2, 3, 1.5, 1.5, 3, 2, 3, 1.5, 1.5, 3];
  const barHeights = [38, 26, 26, 38, 26, 38, 26, 26, 38, 26, 26, 38, 26, 38, 26, 26, 38, 26, 38, 26, 26, 38, 26, 26, 38, 26, 38, 26, 26, 38];

  const ghosts = [
    { translateX: 18, translateY: 4, rotate: 6, zIndex: 1 },
    { translateX: 10, translateY: 2, rotate: 3, zIndex: 2 },
  ];

  const renderFront = () => (
    <TicketShell
      backgroundColor={secondaryShades[50] || "#fafafa"}
      outlineColor={primaryShades[200] || primaryColor}
      clipId={clipId}
    >
      <Stub 
        side="left" 
        primaryColor={primaryColor} 
        backgroundColor={primaryShades[100] || "#f4f4f5"}
        borderColor={primaryShades[200] || primaryColor}
        label={ticketType} 
      />

      <div className="flex-1 flex items-center gap-3.5 px-5 py-4 overflow-hidden relative">
        {heroImageUrl && (
          <>
            <Image
              src={heroImageUrl}
              alt={eventName}
              fill
              className="object-cover opacity-20"
              unoptimized
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${primaryShades[50]}, transparent 100%)`,
              }}
            />
          </>
        )}

        <div className="flex-1 min-w-0 relative z-10">
          <span
            className="block text-xs font-black tracking-[0.22em] uppercase mb-0.5"
            style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
          >
            {ticketType}
          </span>
          <div className="text-base font-bold uppercase truncate leading-tight text-foreground">
            {eventName}
          </div>
          <div className="flex flex-col gap-1 mt-1.5">
            <div>
              <div
                className="text-[10px] font-bold tracking-[0.15em] uppercase"
                style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
              >
                Date &amp; Time
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {dateTime}
              </div>
            </div>
            <div>
              <div
                className="text-[10px] font-bold tracking-[0.15em] uppercase"
                style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
              >
                Venue
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {venue}
              </div>
            </div>
          </div>
        </div>

        <div
          className="self-stretch w-px shrink-0 relative z-10"
          style={{ background: primaryShades[200] || primaryColor }}
        />

        <div className="shrink-0 flex flex-col items-center gap-1.5 relative z-10">
          {logoDisplayUrl ? (
            <img
              src={logoDisplayUrl}
              alt={organizationName}
              className="size-8 rounded-full object-cover border"
            />
          ) : null}
          <div
            className="text-[9px] font-black tracking-[0.15em] uppercase text-center opacity-60"
            style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
          >
            Organizer
          </div>
          <div
            className="text-[11px] font-bold text-center max-w-[90px] truncate text-foreground"
          >
            {organizationName}
          </div>
        </div>
      </div>

      <Stub 
        side="right" 
        primaryColor={primaryColor} 
        backgroundColor={primaryShades[100] || "#f4f4f5"}
        borderColor={primaryShades[200] || primaryColor}
        label={stubLabel} 
      />
    </TicketShell>
  );

  const renderBack = () => (
    <TicketShell
      backgroundColor={secondaryShades[50] || "#fafafa"}
      outlineColor={primaryShades[200] || primaryColor}
      clipId={clipId}
    >
      <Stub 
        side="left" 
        primaryColor={primaryColor} 
        backgroundColor={primaryShades[100] || "#f4f4f5"}
        borderColor={primaryShades[200] || primaryColor}
        label={buyerName.slice(0, 12)} 
      />

      <div className="flex-1 flex items-center gap-6 px-6 py-4">
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div
            className="rounded-none flex items-center justify-center bg-white p-1 size-16"
            style={{ 
              backgroundColor: primaryShades[50] || "#ffffff",
              imageRendering: "pixelated"
            }}
          >
            {qrPayload ? (
              <QRCode
                value={qrPayload}
                size={512}
                style={{ height: "100%", width: "100%", imageRendering: "pixelated" }}
                fgColor={primaryColor}
                bgColor="transparent"
                level="H"
              />
            ) : (
              <QrCode className="size-8" style={{ color: primaryColor }} />
            )}
          </div>
          <div
            className="text-[8px] font-black tracking-[0.1em] uppercase opacity-60 text-center"
            style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
          >
            Scan to verify
          </div>
        </div>

        <div
          className="self-stretch w-px shrink-0"
          style={{ background: primaryShades[200] || primaryColor }}
        />

        <div className="flex flex-col items-center gap-2 flex-1">
          <div
            className="text-[9px] font-black tracking-[0.3em] uppercase opacity-60"
            style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
          >
            Ticket No.
          </div>
          <div
            className="text-base font-black tracking-[0.15em]"
            style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
          >
            {ticketCode}
          </div>
          <div className="flex items-center gap-0.5">
            {barWidths.map((w, i) => (
              <div
                key={i}
                className="rounded-[1px] opacity-70"
                style={{ width: w, height: (barHeights[i] ?? 26) * 0.7, background: primaryColor }}
              />
            ))}
          </div>
          <div
            className="text-[8px] opacity-60"
            style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
          >
            {organizationName}
          </div>
        </div>
      </div>

      <Stub 
        side="right" 
        primaryColor={primaryColor} 
        backgroundColor={primaryShades[100] || "#f4f4f5"}
        borderColor={primaryShades[200] || primaryColor}
        label={stubLabel} 
      />
    </TicketShell>
  );

  if (exportMode) {
    return (
      <div className="flex flex-col gap-8 p-0 bg-transparent w-[560px]">
        {(exportSide === "both" || exportSide === "front") && (
          <div className="relative w-[560px] h-[210px] shrink-0 overflow-hidden">
            <TicketClipPath id={clipId} />
            {renderFront()}
          </div>
        )}
        {(exportSide === "both" || exportSide === "back") && (
          <div className="relative w-[560px] h-[210px] shrink-0 overflow-hidden">
            <TicketClipPath id={clipId} />
            {renderBack()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`cursor-pointer select-none w-full max-w-[560px] ${className ?? ""}`}
      style={{ perspective: 1200 }}
    >
      {/* Hidden SVG that defines the clip-paths */}
      <TicketClipPath id={clipId} />
      <TicketClipPath id={ghostClipId} />

      <div
        className="relative w-full aspect-[560/210] min-h-[190px]"
        onClick={() => setFlipped((f) => !f)}
      >
        {/* Ghost (stacked) copies */}
        {stacked &&
          ghosts.map((g, i) => (
            <GhostTicket
              key={i}
              backgroundColor={secondaryShades[50] || "#ffffff"}
              outlineColor={primaryShades[200] || primaryColor}
              stubColor={primaryShades[50] || "#f4f4f5"}
              clipId={ghostClipId}
              {...g}
            />
          ))}

        {/* Main flippable ticket */}
        <div
          className="absolute inset-0 z-10"
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 0.6s cubic-bezier(.4,0,.2,1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* FRONT */}
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            {renderFront()}
          </div>

          {/* BACK */}
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
