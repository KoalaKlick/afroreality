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

// ─── Exact same clip path as TicketCard (560 × 210) ──────────────────────────
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

// ─── Shared structural primitives (identical role to originals) ───────────────

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

// Dashed perforation on stub inner edge
function StubDash({ side, color }: { side: "left" | "right"; color: string }) {
  return (
    <div
      className={`absolute top-3 bottom-3 ${side === "left" ? "border-r" : "border-l"} border-dashed`}
      style={{ borderColor: color, [side === "left" ? "right" : "left"]: 0 }}
    />
  );
}

// ─── GEO Stub — same 72px width + same vertical label, different visual ───────
// Filled with primaryShades[700]; tiny square corner accents; label in [100]
function Stub({
  side,
  primaryShades,
  label,
}: {
  side: "left" | "right";
  primaryShades: ColorShades;
  label: string;
}) {
  const radius = side === "left" ? "rounded-l-xl" : "rounded-r-xl";
  return (
    <div
      className={`w-[72px] shrink-0 flex items-center justify-center relative ${radius} overflow-hidden`}
      style={{ background: primaryShades[700] }}
    >
      {/* Geo corner squares */}
      <div className="absolute top-0 left-0 w-2.5 h-2.5" style={{ background: primaryShades[500] }} />
      <div className="absolute top-0 right-0 w-2.5 h-2.5" style={{ background: primaryShades[500] }} />
      <div className="absolute bottom-0 left-0 w-2.5 h-2.5" style={{ background: primaryShades[500] }} />
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5" style={{ background: primaryShades[500] }} />

      <StubDash side={side} color={primaryShades[500]} />

      <span
        className="text-[10px] font-black tracking-[0.22em] uppercase relative z-10"
        style={{
          fontFamily: "'Courier New', monospace",
          color: primaryShades[100],
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

// ─── GEO Shell — same clip + row flex as TicketShell, crosshatch bg ───────────
function TicketShell({
  primaryShades,
  secondaryShades,
  primaryColor,
  clipId,
  children,
}: {
  primaryShades: ColorShades;
  secondaryShades: ColorShades;
  primaryColor: string;
  clipId: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-row items-stretch w-full h-full relative"
      style={{
        clipPath: `url(#${clipId})`,
        backgroundColor: secondaryShades[50],
        backgroundImage: `
          repeating-linear-gradient(0deg,  transparent, transparent 23px, ${primaryColor}07 24px),
          repeating-linear-gradient(90deg, transparent, transparent 23px, ${primaryColor}07 24px)
        `,
      }}
    >
      <TicketOutline color={primaryShades[200]} />
      {children}
    </div>
  );
}

// ─── Art-Deco quarter-arc corner ornament ────────────────────────────────────
function CornerOrnament({
  corner,
  color,
}: {
  corner: "tl" | "tr" | "bl" | "br";
  color: string;
}) {
  const rotations = { tl: 0, tr: 90, br: 180, bl: 270 };
  const pos: Record<string, React.CSSProperties> = {
    tl: { top: 8, left: 82 },   // just inside left stub edge
    tr: { top: 8, right: 82 },  // just inside right stub edge
    bl: { bottom: 8, left: 82 },
    br: { bottom: 8, right: 82 },
  };
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      className="absolute pointer-events-none z-10"
      style={{ ...pos[corner], opacity: 0.35 }}
    >
      <g transform={`rotate(${rotations[corner]}, 12, 12)`}>
        {[4, 8, 12].map((r) => (
          <path
            key={r}
            d={`M 0 ${r} A ${r} ${r} 0 0 1 ${r} 0`}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
          />
        ))}
      </g>
    </svg>
  );
}

// ─── Thin rule with centred diamond pip ──────────────────────────────────────
function GeoRule({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1.5 w-full">
      <div className="flex-1 h-px" style={{ background: color }} />
      <div className="w-1.5 h-1.5 rotate-45 shrink-0" style={{ background: color }} />
      <div className="flex-1 h-px" style={{ background: color }} />
    </div>
  );
}

// ─── Ghost ticket for stacked deck ───────────────────────────────────────────
function GhostTicket({
  primaryShades,
  secondaryShades,
  clipId,
  translateX,
  translateY,
  rotate,
  zIndex,
}: {
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
        backgroundColor: secondaryShades[100],
      }}
    >
      <TicketOutline color={primaryShades[200]} />
      <div className="absolute left-0 top-0 bottom-0 w-[72px] rounded-l-xl" style={{ background: primaryShades[800] }} />
      <div className="absolute right-0 top-0 bottom-0 w-[72px] rounded-r-xl" style={{ background: primaryShades[800] }} />
    </div>
  );
}

// ─── FRONT face ───────────────────────────────────────────────────────────────
function FrontFace({
  primaryShades,
  secondaryShades,
  primaryColor,
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
  primaryShades: ColorShades;
  secondaryShades: ColorShades;
  primaryColor: string;
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
    <TicketShell
      primaryShades={primaryShades}
      secondaryShades={secondaryShades}
      primaryColor={primaryColor}
      clipId={clipId}
    >
      {/* ── Left stub ── */}
      <Stub side="left" primaryShades={primaryShades} label={ticketType} />

      {/* ── Main content area — same flex-1, px-5 py-4 as original ── */}
      <div
        className={`flex-1 ${exportMode ? "flex" : "@min-md:flex"} items-center gap-3.5 px-5 py-4 overflow-hidden relative`}
      >
        {/* Hero image — slightly stronger than original to work with grid bg */}
        {heroImageUrl && (
          <>
            <Image
              src={heroImageUrl}
              alt={eventName}
              fill
              className="object-cover opacity-[0.13]"
              unoptimized
            />
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(120deg, ${primaryShades[100]}bb 0%, transparent 65%)` }}
            />
          </>
        )}

        {/* Corner ornaments anchored just inside stub edges */}
        <CornerOrnament corner="tl" color={primaryShades[500]} />
        <CornerOrnament corner="bl" color={primaryShades[500]} />
        <CornerOrnament corner="tr" color={primaryShades[500]} />
        <CornerOrnament corner="br" color={primaryShades[500]} />

        {/* ── Left text block ── */}
        <div className="flex-1 min-w-0 relative z-10">
          <span
            className="block text-[9px] font-black tracking-[0.35em] uppercase mb-1.5"
            style={{ fontFamily: "'Courier New', monospace", color: primaryShades[500] }}
          >
            {ticketType}
          </span>

          <GeoRule color={primaryShades[300]} />

          <div
            className={`mt-1.5 font-black uppercase leading-tight tracking-tight ${exportMode ? "text-xl" : "text-base"}`}
            style={{ fontFamily: "'Georgia', serif", color: primaryShades[900] }}
          >
            {eventName}
          </div>

          <div className="flex flex-col gap-1 mt-2">
            <div>
              <div
                className="text-[8px] font-black tracking-[0.25em] uppercase"
                style={{ fontFamily: "'Courier New', monospace", color: primaryShades[500] }}
              >
                Date &amp; Time
              </div>
              <div
                className="text-sm"
                style={{ fontFamily: "'Georgia', serif", color: primaryShades[800] }}
              >
                {dateTime}
              </div>
            </div>
            <div>
              <div
                className="text-[8px] font-black tracking-[0.25em] uppercase"
                style={{ fontFamily: "'Courier New', monospace", color: primaryShades[500] }}
              >
                Venue
              </div>
              <div
                className="text-[11px] truncate"
                style={{ fontFamily: "'Georgia', serif", color: primaryShades[800] }}
              >
                {venue}
              </div>
            </div>
          </div>
        </div>

        {/* Vertical divider — same as original */}
        <div
          className="self-stretch w-px shrink-0 relative z-10"
          style={{ background: primaryShades[200] }}
        />

        {/* ── Right: organizer — same position as original ── */}
        <div className="shrink-0 flex flex-col items-center gap-1.5 relative z-10">
          {logoDisplayUrl && (
            <div
              className="relative w-9 h-9 overflow-hidden shrink-0"
              style={{ borderRadius: 2, outline: `2px solid ${primaryShades[200]}` }}
            >
              <Image src={logoDisplayUrl} alt={organizationName} fill className="object-cover" unoptimized />
            </div>
          )}
          <div
            className="text-[9px] font-black tracking-[0.15em] uppercase text-center opacity-60"
            style={{ fontFamily: "'Courier New', monospace", color: primaryShades[600] }}
          >
            Organizer
          </div>
          <div
            className="text-[11px] font-bold text-center"
            style={{ fontFamily: "'Georgia', serif", color: primaryShades[800] }}
          >
            {organizationName}
          </div>
        </div>
      </div>

      {/* ── Right stub ── */}
      <Stub side="right" primaryShades={primaryShades} label={(organizationName || "").slice(0, 10)} />
    </TicketShell>
  );
}

// ─── BACK face ────────────────────────────────────────────────────────────────
function BackFace({
  primaryShades,
  secondaryShades,
  primaryColor,
  clipId,
  ticketCode,
  qrPayload,
  organizationName,
  buyerName,
  exportMode,
}: {
  primaryShades: ColorShades;
  secondaryShades: ColorShades;
  primaryColor: string;
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
    <TicketShell
      primaryShades={primaryShades}
      secondaryShades={secondaryShades}
      primaryColor={primaryColor}
      clipId={clipId}
    >
      {/* ── Left stub ── */}
      <Stub side="left" primaryShades={primaryShades} label={buyerName.slice(0, 12)} />

      {/* ── Main content area — same flex-1, px-6 py-4 as original ── */}
      <div
        className={`flex-1 ${exportMode ? "flex" : "@min-md:flex"} items-center gap-6 px-6 py-4 relative`}
      >
        <CornerOrnament corner="tl" color={primaryShades[500]} />
        <CornerOrnament corner="bl" color={primaryShades[500]} />
        <CornerOrnament corner="tr" color={primaryShades[500]} />
        <CornerOrnament corner="br" color={primaryShades[500]} />

        {/* QR — same sizing logic as original */}
        <div className="flex flex-col items-center gap-1.5 shrink-0 relative z-10">
          <div
            className={`flex items-center justify-center p-1.5 ${exportMode ? "size-32" : "size-12 @min-md:size-18"}`}
            style={{
              backgroundColor: primaryShades[100],
              imageRendering: "pixelated",
              borderRadius: 2,
            }}
          >
            {qrPayload ? (
              <QRCode
                value={qrPayload}
                size={512}
                style={{ height: "100%", width: "100%", imageRendering: "pixelated" }}
                fgColor={primaryShades[700]}
                bgColor="transparent"
                level="H"
              />
            ) : (
              <QrCode
                className={exportMode ? "size-16" : "size-6 lg:size-9"}
                style={{ color: primaryShades[600] }}
              />
            )}
          </div>
          <div
            className="text-[8px] font-black tracking-[0.1em] uppercase opacity-50 text-center"
            style={{ fontFamily: "'Courier New', monospace", color: primaryShades[600] }}
          >
            Scan to verify
          </div>
        </div>

        {/* Vertical divider — same as original */}
        <div
          className="self-stretch w-px shrink-0 relative z-10"
          style={{ background: primaryShades[200] }}
        />

        {/* Ticket number + barcode — same layout as original */}
        <div className="flex flex-col items-center gap-2 flex-1 relative z-10">
          <div
            className="text-[9px] font-black tracking-[0.3em] uppercase opacity-50"
            style={{ fontFamily: "'Courier New', monospace", color: primaryShades[600] }}
          >
            Ticket No.
          </div>

          <GeoRule color={primaryShades[300]} />

          <div
            className="text-xl font-black tracking-[0.15em]"
            style={{ fontFamily: "'Courier New', monospace", color: primaryShades[800] }}
          >
            {ticketCode}
          </div>

          <div className="flex items-center gap-0.5">
            {barWidths.map((w, i) => (
              <div
                key={i}
                className="rounded-[1px]"
                style={{ width: w, height: barHeights[i], background: primaryShades[700], opacity: 0.65 }}
              />
            ))}
          </div>

          <div
            className="text-[8px] opacity-40 tracking-[0.1em]"
            style={{ fontFamily: "'Courier New', monospace", color: primaryShades[700] }}
          >
            {organizationName}
          </div>
        </div>
      </div>

      {/* ── Right stub ── */}
      <Stub side="right" primaryShades={primaryShades} label={(organizationName || "").slice(0, 10)} />
    </TicketShell>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function TicketCardGeo({
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

  const uid = useId().replace(/:/g, "");
  const clipId = `ticket-geo-clip-${uid}`;
  const ghostClipId = `ticket-geo-ghost-clip-${uid}`;

  const logoDisplayUrl = getOrgImageUrl(logoUrl);
  const bannerDisplayUrl = getEventImageUrl(bannerImage);
  const flierDisplayUrl = getEventImageUrl(flierImage);
  const heroImageUrl = bannerDisplayUrl || flierDisplayUrl;

  const ghosts = [
    { translateX: 24, translateY: 3, rotate: 22, zIndex: 1 },
    { translateX: 14, translateY: 2, rotate: 13, zIndex: 2 },
    { translateX: 6, translateY: 1, rotate: 5, zIndex: 3 },
  ];

  const frontProps = {
    primaryShades, secondaryShades, primaryColor, clipId,
    heroImageUrl, logoDisplayUrl, organizationName,
    eventName, ticketType, dateTime, venue, exportMode,
  };

  const backProps = {
    primaryShades, secondaryShades, primaryColor, clipId,
    ticketCode, qrPayload, organizationName, buyerName, exportMode,
  };

  if (exportMode) {
    return (
      <div className="flex flex-col gap-8 p-0 bg-transparent w-[560px]">
        {(exportSide === "both" || exportSide === "front") && (
          <div className="relative w-[560px] h-[210px] shrink-0 overflow-hidden">
            <TicketClipPath id={clipId} />
            <FrontFace {...frontProps} />
          </div>
        )}
        {(exportSide === "both" || exportSide === "back") && (
          <div className="relative w-[560px] h-[210px] shrink-0 overflow-hidden">
            <TicketClipPath id={clipId} />
            <BackFace {...backProps} />
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
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            <FrontFace {...frontProps} />
          </div>
          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <BackFace {...backProps} />
          </div>
        </div>
      </div>
    </div>
  );
}