"use client";

import { useState, useId } from "react";
import Image from "next/image";
import { QrCode } from "lucide-react";
import QRCode from "react-qr-code";
import { getEventImageUrl, getOrgImageUrl } from "@/lib/image-url-utils";
import { generateColorShades, type ColorShades } from "@/utils/theme/color-generator";

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

// ─── Ticket silhouette: same notch positions as original for consistency ──────
// 560w x 210h, two side notches at y=105, two top/bottom notches at x=72 and x=488
const TICKET_PATH_RELATIVE = [
  `M ${12 / 560} 0`,
  `L ${(72 - 12) / 560} 0 A ${12 / 560} ${12 / 210} 0 0 0 ${(72 + 12) / 560} 0`,
  `L ${(560 - 72 - 12) / 560} 0 A ${12 / 560} ${12 / 210} 0 0 0 ${(560 - 72 + 12) / 560} 0`,
  `L ${(560 - 12) / 560} 0`,
  `Q 1 0 1 ${12 / 210}`,
  `L 1 ${(105 - 12) / 210} A ${12 / 560} ${12 / 210} 0 0 0 1 ${(105 + 12) / 210}`,
  `L 1 ${(210 - 12) / 210}`,
  `Q 1 1 ${(560 - 12) / 560} 1`,
  `L ${(560 - 72 + 12) / 560} 1 A ${12 / 560} ${12 / 210} 0 0 0 ${(560 - 72 - 12) / 560} 1`,
  `L ${(72 + 12) / 560} 1 A ${12 / 560} ${12 / 210} 0 0 0 ${(72 - 12) / 560} 1`,
  `L ${12 / 560} 1`,
  `Q 0 1 0 ${(210 - 12) / 210}`,
  `L 0 ${(105 + 12) / 210} A ${12 / 560} ${12 / 210} 0 0 0 0 ${(105 - 12) / 210}`,
  `L 0 ${12 / 210}`,
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

/** Ghost ticket for stacked deck effect */
function GhostTicket({
  primaryColor,
  secondaryColor,
  primaryShades,
  secondaryShades,
  clipId,
  translateX,
  translateY,
  rotate,
  zIndex,
}: {
  primaryColor: string;
  secondaryColor: string;
  primaryShades: ColorShades;
  secondaryShades: ColorShades;
  clipId: string;
  translateX: number;
  translateY: number;
  rotate: number;
  zIndex: number;
}) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg)`,
        transformOrigin: "center center",
        zIndex,
        clipPath: `url(#${clipId})`,
        backgroundColor: "#ffffff",
        backgroundImage: `linear-gradient(120deg, ${secondaryShades[900]} 0%, ${primaryShades[950]} 100%)`,
      }}
    >
      <TicketOutline color={primaryShades[800]} />
      {/* Photo panel ghost */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[180px]"
        style={{ background: primaryShades[900] }}
      />
    </div>
  );
}

// ─── Diagonal accent line drawn as SVG overlay ────────────────────────────────
function DiagonalAccent({ color }: { color: string }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      viewBox="0 0 560 210"
      preserveAspectRatio="none"
    >
      {/* Thin diagonal rule from top-right of photo panel to bottom */}
      <line
        x1="185"
        y1="0"
        x2="175"
        y2="210"
        stroke={color}
        strokeWidth="0.75"
        opacity="0.35"
      />
      <line
        x1="191"
        y1="0"
        x2="181"
        y2="210"
        stroke={color}
        strokeWidth="0.35"
        opacity="0.18"
      />
    </svg>
  );
}

// ─── Tiny serif-style "lozenge" bullet ────────────────────────────────────────
function Lozenge({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rotate-45 shrink-0 mt-px"
      style={{ background: color }}
    />
  );
}

// ─── Horizontal rules with lozenge ends ──────────────────────────────────────
function HRule({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1 w-full opacity-30">
      <Lozenge color={color} />
      <div className="flex-1 h-px" style={{ background: color }} />
      <Lozenge color={color} />
    </div>
  );
}

// ─── Front face ───────────────────────────────────────────────────────────────
function FrontFace({
  primaryColor,
  secondaryColor,
  primaryShades,
  secondaryShades,
  clipId,
  heroImageUrl,
  logoDisplayUrl,
  organizationName,
  eventName,
  ticketType,
  dateTime,
  venue,
  exportMode,
}: {
  primaryColor: string;
  secondaryColor: string;
  primaryShades: ColorShades;
  secondaryShades: ColorShades;
  clipId: string;
  heroImageUrl: string | null;
  logoDisplayUrl: string | null;
  organizationName: string;
  eventName: string;
  ticketType: string;
  dateTime: string;
  venue: string;
  exportMode: boolean;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-row"
      style={{
        clipPath: `url(#${clipId})`,
        backgroundColor: "#0d0d0d",
        backgroundImage: `
          radial-gradient(ellipse at 80% 50%, ${secondaryShades[900]} 0%, transparent 60%),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 39px,
            rgba(255,255,255,0.018) 40px
          )
        `,
      }}
    >
      <TicketOutline color={primaryShades[700]} />
      <DiagonalAccent color={primaryColor} />

      {/* ── Left: Photo / Hero Panel ── */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ width: 180 }}
      >
        {heroImageUrl ? (
          <>
            <Image
              src={heroImageUrl}
              alt={eventName}
              fill
              className="object-cover"
              unoptimized
            />
            {/* Dark gradient so text above is legible */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to right, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.1) 100%)`,
              }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${primaryShades[900]} 0%, ${secondaryShades[950]} 100%)`,
            }}
          />
        )}

        {/* Org logo in bottom-left of photo */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5">
          {logoDisplayUrl && (
            <div className="relative w-5 h-5 rounded-sm overflow-hidden shrink-0 ring-1 ring-white/20">
              <Image src={logoDisplayUrl} alt={organizationName} fill className="object-cover" unoptimized />
            </div>
          )}
          <span
            className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70 truncate max-w-[120px]"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            {organizationName}
          </span>
        </div>

        {/* Ticket type pill on photo */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className="text-[8px] font-black uppercase tracking-[0.25em] px-2 py-0.5 rounded-sm"
            style={{
              background: primaryColor,
              color: "#0d0d0d",
              fontFamily: "'Courier New', monospace",
            }}
          >
            {ticketType}
          </span>
        </div>
      </div>

      {/* ── Right: Info Panel ── */}
      <div className="flex-1 flex flex-col justify-between px-5 py-4 min-w-0 relative z-10">
        {/* Event name */}
        <div>
          <div
            className="text-[10px] font-black tracking-[0.35em] uppercase mb-1.5"
            style={{
              fontFamily: "'Courier New', monospace",
              color: primaryShades[200],
            }}
          >
            Event
          </div>
          <HRule color={primaryShades[400]} />
          <div
            className={`mt-2 font-bold uppercase leading-tight tracking-wide text-white ${exportMode ? "text-xl" : "text-base"}`}
            style={{
              fontFamily: "'Georgia', serif",
              textShadow: `0 0 40px ${primaryShades[500]}`,
            }}
          >
            {eventName}
          </div>
        </div>

        {/* Date + Venue */}
        <div className="space-y-2 mt-auto">
          <div className="flex gap-4">
            <div className="min-w-0">
              <div
                className="text-[8px] font-black tracking-[0.25em] uppercase mb-0.5"
                style={{ fontFamily: "'Courier New', monospace", color: primaryShades[400] }}
              >
                Date &amp; Time
              </div>
              <div
                className="text-xs font-medium"
                style={{ fontFamily: "'Georgia', serif", color: primaryShades[100] }}
              >
                {dateTime}
              </div>
            </div>
            <div className="min-w-0">
              <div
                className="text-[8px] font-black tracking-[0.25em] uppercase mb-0.5 "
                style={{ fontFamily: "'Courier New', monospace", color: primaryShades[400] }}
              >
                Venue
              </div>
              <div
                className="text-xs font-medium truncate"
                style={{ fontFamily: "'Georgia', serif", color: primaryShades[100] }}
              >
                {venue}
              </div>
            </div>
          </div>
          <HRule color={primaryShades[400]} />
          {/* Bottom accent strip */}
          <div
            className="text-[8px] font-black tracking-[0.4em] uppercase  text-right"
            style={{ fontFamily: "'Courier New', monospace", color: primaryShades[400] }}
          >
            Admit One · Valid Once
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Back face ────────────────────────────────────────────────────────────────
function BackFace({
  primaryColor,
  secondaryColor,
  primaryShades,
  secondaryShades,
  clipId,
  ticketCode,
  qrPayload,
  organizationName,
  buyerName,
  exportMode,
}: {
  primaryColor: string;
  secondaryColor: string;
  primaryShades: ColorShades;
  secondaryShades: ColorShades;
  clipId: string;
  ticketCode: string;
  qrPayload?: string;
  organizationName: string;
  buyerName: string;
  exportMode: boolean;
}) {
  const barWidths = [3, 1.5, 1.5, 3, 1.5, 2, 1.5, 3, 1.5, 1.5, 3, 2, 1.5, 3, 1.5, 2, 3, 1.5, 3, 1.5, 2, 3, 1.5, 1.5, 3, 2, 3, 1.5, 1.5, 3];
  const barHeights = [38, 26, 26, 38, 26, 38, 26, 26, 38, 26, 26, 38, 26, 38, 26, 26, 38, 26, 38, 26, 26, 38, 26, 26, 38, 26, 38, 26, 26, 38];

  return (
    <div
      className="absolute inset-0 flex flex-row items-stretch"
      style={{
        clipPath: `url(#${clipId})`,
        backgroundColor: "#0d0d0d",
        backgroundImage: `
          radial-gradient(ellipse at 20% 50%, ${primaryShades[900]} 0%, transparent 55%),
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 19px,
            rgba(255,255,255,0.015) 20px
          )
        `,
      }}
    >
      <TicketOutline color={primaryShades[700]} />

      {/* ── Left: QR / scan area ── */}
      <div className="flex flex-col items-center justify-center gap-2 px-6 shrink-0" style={{ width: 160 }}>
        <div
          className="text-[8px] font-black tracking-[0.3em] uppercase text-center"
          style={{ fontFamily: "'Courier New', monospace", color: primaryShades[400] }}
        >
          Scan to Verify
        </div>
        <div
          className="flex items-center justify-center p-1.5 rounded-sm"
          style={{
            background: primaryShades[100],
            border: `1px solid ${primaryShades[800]}`,
          }}
        >
          <div className={exportMode ? "w-28 h-28" : "w-16 h-16"}>
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
              <QrCode className="w-full h-full opacity-50" style={{ color: primaryColor }} />
            )}
          </div>
        </div>
        <div
          className="text-[7px] tracking-[0.15em] uppercase opacity-25 text-center"
          style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
        >
          {organizationName}
        </div>
      </div>

      {/* ── Vertical divider ── */}
      <div className="flex flex-col items-center justify-center py-4 shrink-0">
        <div className="flex flex-col items-center gap-1 h-full justify-center">
          <Lozenge color={primaryColor} />
          <div className="flex-1 w-px" style={{ background: primaryShades[800] }} />
          <Lozenge color={primaryColor} />
        </div>
      </div>

      {/* ── Right: Ticket details ── */}
      <div className="flex-1 flex flex-col justify-between py-4 px-5 min-w-0">
        {/* Buyer */}
        <div>
          <div
            className="text-[8px] font-black tracking-[0.3em] uppercase"
            style={{ fontFamily: "'Courier New', monospace", color: primaryShades[300] }}
          >
            Ticket Holder
          </div>
          <div
            className="text-sm font-bold text-white/90 mt-0.5 truncate"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            {buyerName}
          </div>
        </div>

        {/* Barcode */}
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-end gap-0.5">
            {barWidths.map((w, i) => (
              <div
                key={i}
                className="rounded-[1px] opacity-50"
                style={{ width: w, height: (barHeights[i] ?? 26) * 0.72, background: primaryColor }}
              />
            ))}
          </div>
          <div
            className="text-[9px] font-black tracking-[0.18em] opacity-70"
            style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
          >
            {ticketCode}
          </div>
        </div>

        {/* Bottom rule */}
        <div>
          <HRule color={primaryColor} />
          <div
            className="mt-1.5 text-[7px] font-black tracking-[0.4em] uppercase "
            style={{ fontFamily: "'Courier New', monospace", color: primaryShades[300] }}
          >
            Non-Transferable · Non-Refundable
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function TicketCard2({
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
  const uid = useId().replace(/:/g, "");
  const clipId = `ticket-alt-clip-${uid}`;
  const ghostClipId = `ticket-alt-ghost-clip-${uid}`;

  const logoDisplayUrl = getOrgImageUrl(logoUrl);
  const bannerDisplayUrl = getEventImageUrl(bannerImage);
  const flierDisplayUrl = getEventImageUrl(flierImage);
  const heroImageUrl = bannerDisplayUrl || flierDisplayUrl;

  const primaryShades = generateColorShades(primaryColor);
  const secondaryShades = generateColorShades(secondaryColor);

  const ghosts = [
    { translateX: 24, translateY: 3, rotate: 22, zIndex: 1 },
    { translateX: 14, translateY: 2, rotate: 13, zIndex: 2 },
    { translateX: 6, translateY: 1, rotate: 5, zIndex: 3 },
  ];

  const sharedFrontProps = {
    primaryColor,
    secondaryColor,
    primaryShades,
    secondaryShades,
    clipId,
    heroImageUrl,
    logoDisplayUrl,
    organizationName,
    eventName,
    ticketType,
    dateTime,
    venue,
    exportMode,
  };

  const sharedBackProps = {
    primaryColor,
    secondaryColor,
    primaryShades,
    secondaryShades,
    clipId,
    ticketCode,
    qrPayload,
    organizationName,
    buyerName,
    exportMode,
  };

  if (exportMode) {
    return (
      <div className="flex flex-col gap-8 p-0 bg-transparent w-[560px]">
        {(exportSide === "both" || exportSide === "front") && (
          <div className="relative w-[560px] h-[210px] shrink-0 overflow-hidden">
            <TicketClipPath id={clipId} />
            <FrontFace {...sharedFrontProps} />
          </div>
        )}
        {(exportSide === "both" || exportSide === "back") && (
          <div className="relative w-[560px] h-[210px] shrink-0 overflow-hidden">
            <TicketClipPath id={clipId} />
            <BackFace {...sharedBackProps} />
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
      <TicketClipPath id={clipId} />
      <TicketClipPath id={ghostClipId} />

      <div
        className="relative w-full max-w-[560px] h-[210px]"
        onClick={() => setFlipped((f) => !f)}
      >
        {stacked &&
          ghosts.map((g, i) => (
            <GhostTicket
              key={i}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              primaryShades={primaryShades}
              secondaryShades={secondaryShades}
              clipId={ghostClipId}
              {...g}
            />
          ))}

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
            <FrontFace {...sharedFrontProps} />
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
            <BackFace {...sharedBackProps} />
          </div>
        </div>
      </div>
    </div>
  );
}
