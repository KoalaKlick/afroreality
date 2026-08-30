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

function StubDash({ side, color }: { side: "left" | "right"; color: string }) {
  return (
    <div
      className={`absolute top-3 bottom-3 ${side === "left" ? "border-r" : "border-l"} border-dashed`}
      style={{ borderColor: color, [side === "left" ? "right" : "left"]: 0 }}
    />
  );
}

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
      style={{ background: primaryShades[700] || "#1e293b" }}
    >
      <div className="absolute top-0 left-0 w-2.5 h-2.5" style={{ background: primaryShades[500] }} />
      <div className="absolute top-0 right-0 w-2.5 h-2.5" style={{ background: primaryShades[500] }} />
      <div className="absolute bottom-0 left-0 w-2.5 h-2.5" style={{ background: primaryShades[500] }} />
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5" style={{ background: primaryShades[500] }} />

      <StubDash side={side} color={primaryShades[500]} />

      <span
        className="text-[10px] font-black tracking-[0.22em] uppercase relative z-10"
        style={{
          fontFamily: "'Courier New', monospace",
          color: primaryShades[100] || "#ffffff",
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
  const bgBase = secondaryShades[50] || "#f8fafc";
  const gridLine = primaryShades[100] || "rgba(0,0,0,0.06)";

  return (
    <div
      className="flex flex-row bg-background items-stretch w-full h-full relative rounded-2xl overflow-hidden shadow-sm"
      style={{
        clipPath: `url(#${clipId})`,
        backgroundColor: bgBase,
        backgroundImage: [
          `linear-gradient(to right, ${gridLine} 1px, transparent 1px)`,
          `linear-gradient(to bottom, ${gridLine} 1px, transparent 1px)`,
          `linear-gradient(135deg, ${primaryShades[50]}88 0%, ${secondaryShades[50]} 100%)`,
        ].join(", "),
        backgroundSize: "20px 20px, 20px 20px, 100% 100%",
      }}
    >
      <TicketOutline color={primaryShades[300] || primaryColor} />
      {children}
    </div>
  );
}

function CornerOrnament({
  corner,
  color,
}: {
  corner: "tl" | "tr" | "bl" | "br";
  color: string;
}) {
  const posMap = {
    tl: "top-2 left-2",
    tr: "top-2 right-2",
    bl: "bottom-2 left-2",
    br: "bottom-2 right-2",
  };
  return (
    <div
      aria-hidden="true"
      className={`absolute ${posMap[corner]} w-2 h-2 pointer-events-none z-10`}
      style={{
        borderTop: corner.startsWith("t") ? `1.5px solid ${color}` : undefined,
        borderBottom: corner.startsWith("b") ? `1.5px solid ${color}` : undefined,
        borderLeft: corner.endsWith("l") ? `1.5px solid ${color}` : undefined,
        borderRight: corner.endsWith("r") ? `1.5px solid ${color}` : undefined,
        opacity: 0.6,
      }}
    />
  );
}

function GeoRule({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1 my-1 opacity-40">
      <div className="w-1.5 h-1.5 rotate-45 shrink-0" style={{ background: color }} />
      <div className="h-px flex-1" style={{ background: color }} />
      <div className="w-1.5 h-1.5 rotate-45 shrink-0" style={{ background: color }} />
    </div>
  );
}

function GhostTicketGeo({
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
      className="absolute inset-0 pointer-events-none rounded-xl"
      style={{
        transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg)`,
        transformOrigin: "center center",
        zIndex,
        clipPath: `url(#${clipId})`,
        backgroundColor: secondaryShades[50] || "#ffffff",
      }}
    >
      <TicketOutline color={primaryShades[200]} />
      <div
        className="absolute left-0 top-0 bottom-0 w-[72px] rounded-l-xl"
        style={{ background: primaryShades[700] }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-[72px] rounded-r-xl"
        style={{ background: primaryShades[700] }}
      />
    </div>
  );
}

function FrontSide({
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
}) {
  return (
    <TicketShell
      primaryShades={primaryShades}
      secondaryShades={secondaryShades}
      primaryColor={primaryColor}
      clipId={clipId}
    >
      <Stub side="left" primaryShades={primaryShades} label={ticketType} />

      <div className="flex-1 flex items-center gap-3.5 px-5 py-4 overflow-hidden relative">
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

        <CornerOrnament corner="tl" color={primaryShades[500]} />
        <CornerOrnament corner="bl" color={primaryShades[500]} />
        <CornerOrnament corner="tr" color={primaryShades[500]} />
        <CornerOrnament corner="br" color={primaryShades[500]} />

        <div className="flex-1 min-w-0 relative z-10">
          <span
            className="block text-[9px] font-black tracking-[0.35em] uppercase mb-1.5"
            style={{ fontFamily: "'Courier New', monospace", color: primaryShades[500] }}
          >
            {ticketType}
          </span>

          <GeoRule color={primaryShades[300]} />

          <div
            className="text-base font-bold uppercase truncate leading-tight mt-1 text-foreground"
          >
            {eventName}
          </div>

          <div className="flex flex-col gap-1 mt-1.5">
            <div>
              <div
                className="text-[9px] font-black tracking-[0.2em] uppercase"
                style={{ fontFamily: "'Courier New', monospace", color: primaryShades[500] }}
              >
                Date &amp; Time
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {dateTime}
              </div>
            </div>
            <div>
              <div
                className="text-[9px] font-black tracking-[0.2em] uppercase"
                style={{ fontFamily: "'Courier New', monospace", color: primaryShades[500] }}
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
          style={{ background: primaryShades[200] }}
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
            className="text-[9px] font-black tracking-[0.2em] uppercase text-center opacity-60"
            style={{ fontFamily: "'Courier New', monospace", color: primaryShades[500] }}
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
        primaryShades={primaryShades}
        label={(organizationName || "").slice(0, 10)}
      />
    </TicketShell>
  );
}

function BackSide({
  primaryShades,
  secondaryShades,
  primaryColor,
  clipId,
  qrPayload,
  ticketCode,
  organizationName,
  buyerName,
}: {
  primaryShades: ColorShades;
  secondaryShades: ColorShades;
  primaryColor: string;
  clipId: string;
  qrPayload?: string;
  ticketCode: string;
  organizationName: string;
  buyerName: string;
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
      <Stub side="left" primaryShades={primaryShades} label={buyerName.slice(0, 12)} />

      <div className="flex-1 flex items-center gap-6 px-6 py-4 relative">
        <CornerOrnament corner="tl" color={primaryShades[500]} />
        <CornerOrnament corner="bl" color={primaryShades[500]} />
        <CornerOrnament corner="tr" color={primaryShades[500]} />
        <CornerOrnament corner="br" color={primaryShades[500]} />

        <div className="flex flex-col items-center gap-1.5 shrink-0 relative z-10">
          <div
            className="flex items-center justify-center p-1.5 size-16"
            style={{
              backgroundColor: primaryShades[100] || "#ffffff",
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
                className="size-8"
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

        <div
          className="self-stretch w-px shrink-0 relative z-10"
          style={{ background: primaryShades[200] }}
        />

        <div className="flex flex-col items-center gap-2 flex-1 relative z-10">
          <div
            className="text-[9px] font-black tracking-[0.3em] uppercase opacity-60"
            style={{ fontFamily: "'Courier New', monospace", color: primaryShades[600] }}
          >
            Ticket No.
          </div>
          <div
            className="text-base font-black tracking-[0.15em]"
            style={{ fontFamily: "'Courier New', monospace", color: primaryShades[800] }}
          >
            {ticketCode}
          </div>
          <div className="flex items-center gap-0.5">
            {barWidths.map((w, i) => (
              <div
                key={i}
                className="rounded-[1px] opacity-70"
                style={{ width: w, height: (barHeights[i] ?? 26) * 0.7, background: primaryShades[700] }}
              />
            ))}
          </div>
          <div
            className="text-[8px] opacity-50 uppercase tracking-wider"
            style={{ fontFamily: "'Courier New', monospace", color: primaryShades[600] }}
          >
            {organizationName}
          </div>
        </div>
      </div>

      <Stub
        side="right"
        primaryShades={primaryShades}
        label={(organizationName || "").slice(0, 10)}
      />
    </TicketShell>
  );
}

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

  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const clipId = `ticket-geo-clip-${uid}`;
  const ghostClipId = `ticket-geo-ghost-clip-${uid}`;

  const logoDisplayUrl = getOrgImageUrl(logoUrl);
  const bannerDisplayUrl = getEventImageUrl(bannerImage);
  const flierDisplayUrl = getEventImageUrl(flierImage);
  const heroImageUrl = bannerDisplayUrl || flierDisplayUrl;

  const ghosts = [
    { translateX: 18, translateY: 4, rotate: 6, zIndex: 1 },
    { translateX: 10, translateY: 2, rotate: 3, zIndex: 2 },
  ];

  if (exportMode) {
    return (
      <div className="flex flex-col gap-8 p-0 bg-transparent w-[560px]">
        {(exportSide === "both" || exportSide === "front") && (
          <div className="relative w-[560px] h-[210px] shrink-0 overflow-hidden">
            <TicketClipPath id={clipId} />
            <FrontSide
              primaryShades={primaryShades}
              secondaryShades={secondaryShades}
              primaryColor={primaryColor}
              clipId={clipId}
              heroImageUrl={heroImageUrl}
              logoDisplayUrl={logoDisplayUrl}
              organizationName={organizationName}
              eventName={eventName}
              ticketType={ticketType}
              dateTime={dateTime}
              venue={venue}
            />
          </div>
        )}
        {(exportSide === "both" || exportSide === "back") && (
          <div className="relative w-[560px] h-[210px] shrink-0 overflow-hidden">
            <TicketClipPath id={clipId} />
            <BackSide
              primaryShades={primaryShades}
              secondaryShades={secondaryShades}
              primaryColor={primaryColor}
              clipId={clipId}
              qrPayload={qrPayload}
              ticketCode={ticketCode}
              organizationName={organizationName}
              buyerName={buyerName}
            />
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
      <TicketClipPath id={clipId} />
      <TicketClipPath id={ghostClipId} />

      <div
        className="relative w-full aspect-[560/210] min-h-[190px]"
        onClick={() => setFlipped((f) => !f)}
      >
        {stacked &&
          ghosts.map((g, i) => (
            <GhostTicketGeo
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
            <FrontSide
              primaryShades={primaryShades}
              secondaryShades={secondaryShades}
              primaryColor={primaryColor}
              clipId={clipId}
              heroImageUrl={heroImageUrl}
              logoDisplayUrl={logoDisplayUrl}
              organizationName={organizationName}
              eventName={eventName}
              ticketType={ticketType}
              dateTime={dateTime}
              venue={venue}
            />
          </div>

          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <BackSide
              primaryShades={primaryShades}
              secondaryShades={secondaryShades}
              primaryColor={primaryColor}
              clipId={clipId}
              qrPayload={qrPayload}
              ticketCode={ticketCode}
              organizationName={organizationName}
              buyerName={buyerName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
