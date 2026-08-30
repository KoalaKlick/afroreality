"use client"

import type { EventItem } from "@/lib/const/landing"
import { getEventImageUrl } from "@/lib/image-url-utils"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type { Event } from "@repo/db"

export type DbEvent = Event & {
    organization: {
        slug: string
        name: string
    }
}

const accentCycle3: ('red' | 'yellow' | 'green')[] = ['red', 'yellow', 'green']
const accentCycle4: ('red' | 'yellow' | 'green' | 'black')[] = ['red', 'yellow', 'green', 'black']

const brandCycle = ['primary', 'secondary', 'tertiary'] as const

interface EventCardProps {
    readonly item: EventItem | DbEvent
    readonly index?: number
    readonly colorCount?: 3 | 4
    readonly className?: string
    readonly size?: 'default' | 'large'
    readonly useBrand?: boolean
}

const accentTextColors: Record<string, string> = {
    red: 'text-[#CE1126]',
    yellow: 'text-[#FFCD00]',
    green: 'text-[#009A44]',
    black: 'text-[#1A1A1A]',
}

const badgeColors: Record<string, string> = {
    red: 'text-[#CE1126]',
    yellow: 'text-[#FFCD00]',
    green: 'text-[#009A44]',
    black: 'text-[#1A1A1A]',
}

function SideAccent({ colorClass, brandColor }: { colorClass?: string; brandColor?: string }) {
    return (
        <svg
            className={cn("absolute right-0 top-0 h-full w-24 z-10", !brandColor && colorClass)}
            style={brandColor ? { color: `var(--color-brand-${brandColor})` } : undefined}
            viewBox="0 0 210 297"
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            <path
                d="M 179.69167,0.37081617 196.23673,146.38046 179.15249,297.0266 l 31.2116,0.35696 V 0.01812264 Z"
                fill="currentColor"
            />
        </svg>
    )
}

function isDbEvent(item: EventItem | DbEvent): item is DbEvent {
    return typeof (item as any).id === 'string' && !!(item as any).organization;
}

export function EventCard({ item, index = 0, colorCount = 3, className, size = 'default', useBrand = false }: EventCardProps) {
    const isDb = isDbEvent(item);

    const title = item.title;
    const cycle = colorCount === 4 ? accentCycle4 : accentCycle3;
    const cycleKey = cycle[index % cycle.length] || 'green';
    const accentColor: 'red' | 'yellow' | 'green' | 'black' = !isDb ? ((item as EventItem).accentColor || 'green') : cycleKey;
    const colorClass = accentTextColors[accentColor] ?? 'text-[#009A44]';

    const brandColor = useBrand && isDb ? brandCycle[index % brandCycle.length] : undefined;

    const image = isDb ? getEventImageUrl((item as DbEvent).flierImage) : (item as EventItem).image;
    const rawSubtitle = isDb ? (item as DbEvent).description : (item as EventItem).subtitle;
    const plainSubtitle = rawSubtitle ? rawSubtitle.replaceAll(/<[^>]*>/g, '').trim() : null;
    const categoryName = isDb ? ((item as DbEvent).type || "EVENT").toUpperCase() : (item as EventItem).category;

    const dateStr = isDb
        ? (item as DbEvent).startDate
            ? new Date((item as DbEvent).startDate!).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).toUpperCase()
            : 'TBA'
        : (item as EventItem).date;

    const href = isDb
        ? `/${(item as DbEvent).organization.slug}/event/${(item as DbEvent).slug}`
        : `/events/${(item as EventItem).id}`;

    return (
        <Link
            href={href}
            className={cn(
                "group relative cursor-pointer block overflow-hidden rounded-2xl h-full border border-border/40 transition-all duration-300",
                size === 'large' ? 'aspect-3/4' : 'aspect-4/3',
                className
            )}
        >
            {/* Background image */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: image ? `url(${image})` : undefined }}
            />

            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-colors group-hover:from-black/75" />

            {/* Side accent */}
            <SideAccent colorClass={colorClass} brandColor={brandColor} />

            {/* Content */}
            <div className="absolute inset-0 p-4 pr-9 flex flex-col justify-end">
                <h3 className={cn(
                    "text-white font-bold leading-tight mb-1",
                    size === 'large' ? 'text-lg' : 'text-sm'
                )}>
                    {title}
                </h3>

                {plainSubtitle && (
                    <p className="text-white/65 text-xs mb-3 line-clamp-2 leading-relaxed">
                        {plainSubtitle}
                    </p>
                )}

                <div className="flex items-center justify-between gap-2">
                    <span
                        className={cn(
                            "text-white text-[10px] font-bold uppercase px-2 py-1 rounded-sm tracking-wide bg-white/10 backdrop-blur-xs",
                            !brandColor && badgeColors[accentColor]
                        )}
                        style={brandColor ? { color: `var(--color-brand-${brandColor})` } : undefined}
                    >
                        {categoryName}
                    </span>
                    <span className="text-white/55 text-[10px] shrink-0" suppressHydrationWarning>
                        {dateStr}
                    </span>
                </div>
            </div>
        </Link>
    )
}
