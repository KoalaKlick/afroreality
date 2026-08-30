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

    const rawImg = isDb
        ? (item as DbEvent).flierImage || (item as any).flierUrl || (item as DbEvent).bannerImage || (item as any).bannerUrl
        : (item as EventItem).image;
    const image = isDb ? getEventImageUrl(rawImg) : (item as EventItem).image;

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

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

            {/* Top Badge */}
            <div className="absolute top-4 left-4 z-20">
                <span
                    className={cn(
                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-black tracking-wider uppercase backdrop-blur-md border border-white/10 bg-black/40",
                        !brandColor && (badgeColors[accentColor] ?? 'text-[#009A44]')
                    )}
                    style={brandColor ? { color: `var(--color-brand-${brandColor})` } : undefined}
                >
                    {categoryName}
                </span>
            </div>

            {/* Side Accent SVG */}
            <SideAccent colorClass={colorClass} brandColor={brandColor} />

            {/* Bottom Content */}
            <div className="absolute bottom-0 left-0 right-0 p-5 z-20 flex flex-col justify-end">
                <div className="space-y-1">
                    <p className="text-[11px] font-bold tracking-widest text-white/70 uppercase">
                        {dateStr}
                    </p>
                    <h3 className="text-lg font-black tracking-tight text-white uppercase line-clamp-1 group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                    {plainSubtitle && (
                        <p className="text-xs text-white/80 line-clamp-2 leading-relaxed">
                            {plainSubtitle}
                        </p>
                    )}
                </div>
            </div>
        </Link>
    )
}
