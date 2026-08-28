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
 *
 * All values are expressed as percentages of the element's bounding box so the
 * clip scales automatically when the element resizes.
 *
 * The path uses the SVG "even-odd" fill rule, so the semicircle sub-paths
 * act as holes (they are wound opposite to the outer rect).
 */
// Using objectBoundingBox (0-1) coordinates for perfect responsiveness.
// Values derived from: 560w x 210h. 
// x-coords = val / 560, y-coords = val / 210
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
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
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

/** Ghost ticket for the stacked deck effect — clipped the same way */
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
      className="flex flex-row bg-background items-stretch w-full h-full relative"
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
  ticketCode = "XXXX-XXXXXX",
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

  // Stable unique ID so multiple tickets on the same page don't share clipPaths
  const uid = useId().replace(/:/g, "");
  const clipId = `ticket-clip-${uid}`;
  // Ghost tickets can share the same clip shape (they're the same dimensions)
  const ghostClipId = `ticket-ghost-clip-${uid}`;

  const logoDisplayUrl = getOrgImageUrl(logoUrl);
  const bannerDisplayUrl = getEventImageUrl(bannerImage);
  const flierDisplayUrl = getEventImageUrl(flierImage);
  const heroImageUrl = bannerDisplayUrl || flierDisplayUrl;

  const stubLabel = (organizationName || "").slice(0, 10);

  const barWidths = [3, 1.5, 1.5, 3, 1.5, 2, 1.5, 3, 1.5, 1.5, 3, 2, 1.5, 3, 1.5, 2, 3, 1.5, 3, 1.5, 2, 3, 1.5, 1.5, 3, 2, 3, 1.5, 1.5, 3];
  const barHeights = [38, 26, 26, 38, 26, 38, 26, 26, 38, 26, 26, 38, 26, 38, 26, 26, 38, 26, 38, 26, 26, 38, 26, 26, 38, 26, 38, 26, 26, 38];

  const ghosts = [
    { translateX: 24, translateY: 3, rotate: 22, zIndex: 1 },
    { translateX: 14, translateY: 2, rotate: 13, zIndex: 2 },
    { translateX: 6, translateY: 1, rotate: 5, zIndex: 3 },
  ];

  const renderFront = () => (
    <TicketShell
      backgroundColor={secondaryShades[50]}
      outlineColor={primaryShades[200]}
      clipId={clipId}
    >
      <Stub 
        side="left" 
        primaryColor={primaryColor} 
        backgroundColor={primaryShades[100]}
        borderColor={primaryShades[200]}
        label={ticketType} 
      />

      <div className={`flex-1 ${exportMode ? "flex" : "@min-md:flex"} items-center gap-3.5 px-5 py-4 overflow-hidden relative`}>
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
          <div className={`text-base ${exportMode ? "text-lg" : "@min-lg:text-lg"} uppercase font-montserrat font-bold truncate leading-tight`}>
            {eventName}
          </div>
          <div className="flex flex-col gap-1 mt-1.5">
            <div>
              <div
                className="text-xs font-bold tracking-[0.15em] uppercase"
                style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
              >
                Date &amp; Time
              </div>
              <div
                className="text-sm text-[#3d3530]"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {dateTime}
              </div>
            </div>
            <div>
              <div
                className="text-xs font-bold tracking-[0.15em] uppercase "
                style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
              >
                Venue
              </div>
              <div
                className="text-[11px] text-[#3d3530] truncate"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {venue}
              </div>
            </div>
          </div>
        </div>

        <div
          className="self-stretch w-px shrink-0 relative z-10"
          style={{ background: primaryShades[100] }}
        />

        <div className="shrink-0 flex flex-col items-center gap-1 relative z-10">
          <div
            className="text-[9px] font-black tracking-[0.15em] uppercase text-center opacity-60"
            style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
          >
            Organizer
          </div>
          <div
            className="text-[11px] font-bold text-center"
            style={{ fontFamily: "Georgia, serif", color: primaryShades[700] }}
          >
            {organizationName}
          </div>
        </div>
      </div>

      <Stub 
        side="right" 
        primaryColor={primaryColor} 
        backgroundColor={primaryShades[100]}
        borderColor={primaryShades[200]}
        label={stubLabel} 
      />
    </TicketShell>
  );

  const renderBack = () => (
    <TicketShell
      backgroundColor={secondaryShades[50]}
      outlineColor={primaryShades[200]}
      clipId={clipId}
    >
      <Stub 
        side="left" 
        primaryColor={primaryColor} 
        backgroundColor={primaryShades[100]}
        borderColor={primaryShades[200]}
        label={buyerName.slice(0, 12)} 
      />

      <div className={`flex-1 ${exportMode ? "flex" : "@min-md:flex"} items-center gap-6 px-6 py-4`}>
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div
            className={`rounded-none flex items-center justify-center bg-white p-1 ${exportMode ? "size-32" : "size-12 @min-md:size-18"}`}
            style={{ 
              backgroundColor: primaryShades[50],
              imageRendering: "pixelated"
            }}
          >
            {qrPayload ? (
              <QRCode
                value={qrPayload}
                size={512} // Massive internal resolution
                style={{ height: "100%", width: "100%", imageRendering: "pixelated" }}
                fgColor={primaryColor}
                bgColor="transparent"
                level="H" // High error correction for better scannability
              />
            ) : (
              <QrCode className={exportMode ? "size-16" : "size-6 lg:size-9"} style={{ color: primaryColor }} />
            )}
            
          </div>
          <div
            className="text-[8px] font-black tracking-[0.1em] uppercase opacity-40 text-center"
            style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
          >
            Scan to verify
          </div>
        </div>

        <div
          className="self-stretch w-px shrink-0"
          style={{ background: primaryShades[100] }}
        />

        <div className="flex flex-col items-center gap-2 flex-1">
          <div
            className="text-[9px] font-black tracking-[0.3em] uppercase opacity-50"
            style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
          >
            Ticket No.
          </div>
          <div
            className="text-xl font-black tracking-[0.15em] opacity-85"
            style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
          >
            {ticketCode}
          </div>
          <div className="flex items-center gap-0.5">
            {barWidths.map((w, i) => (
              <div
                key={i}
                className="rounded-[1px] opacity-60"
                style={{ width: w, height: barHeights[i], background: primaryColor }}
              />
            ))}
          </div>
          <div
            className="text-[8px] opacity-40"
            style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
          >
            {organizationName}
          </div>
        </div>
      </div>

      <Stub 
        side="right" 
        primaryColor={primaryColor} 
        backgroundColor={primaryShades[100]}
        borderColor={primaryShades[200]}
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
      className={`cursor-pointer select-none @container ${className ?? ""}`}
      style={{ perspective: 1200 }}
    >
      {/* Hidden SVG that defines the clip-paths */}
      <TicketClipPath id={clipId} />
      <TicketClipPath id={ghostClipId} />

      <div
        className="relative w-full max-w-[560px] h-[210px]"
        onClick={() => setFlipped((f) => !f)}
      >
        {/* Ghost (stacked) copies */}
        {stacked &&
          ghosts.map((g, i) => (
            <GhostTicket
              key={i}
              backgroundColor={secondaryShades[50]}
              outlineColor={primaryShades[200]}
              stubColor={primaryShades[50]}
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