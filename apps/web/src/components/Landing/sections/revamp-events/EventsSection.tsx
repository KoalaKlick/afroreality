"use client"

import { useRef } from "react"
import { motion, useInView } from "motion/react"
import Link from "next/link"
import { eventItems, type EventItem } from "@/lib/const/landing"
import { EventCard, type DbEvent } from "./EventGalleryItem"
import { Section } from "../../shared/Section"
import { NoEventsIllustration } from "@/components/common/NoEventsIllustration"

interface EventsSectionProps {
    readonly title?: string
    readonly items?: (EventItem | DbEvent)[]
    readonly useBrand?: boolean
}

export function EventsSection({
    title = "Ongoing Events.",
    items = eventItems,
    useBrand = false,
}: EventsSectionProps) {
    const sectionRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(sectionRef, { once: true, margin: "-80px" })

    // Show max 6 items
    const visible = items.slice(0, 6)
    const hasMore = items.length > 6

    if (items.length === 0) {
        return (
            <Section id="events" className="py-20">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="text-4xl md:text-5xl font-black text-center uppercase mb-12 tracking-tight"
                >
                    {title}
                </motion.h2>
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.1 }}
                    className="flex flex-col items-center justify-center text-center py-8"
                >
                    <NoEventsIllustration className="w-64 h-auto mb-6" />
                    <p className="text-xl font-semibold text-muted-foreground">No events yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">Check back soon for upcoming events.</p>
                </motion.div>
            </Section>
        )
    }

    // Distribution pattern: middle first, then sides
    const col1 = [visible[1], visible[4]].filter((x): x is (EventItem | DbEvent) => Boolean(x))
    const col2 = [visible[0], visible[3]].filter((x): x is (EventItem | DbEvent) => Boolean(x))
    const col3 = [visible[2], visible[5]].filter((x): x is (EventItem | DbEvent) => Boolean(x))

    const MIDDLE_OFFSET = 48 // px - middle column sits lower

    const fadeUp = (delay: number) => ({
        initial: { opacity: 0, y: 48 },
        animate: isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 48 },
        transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] as const },
    })

    return (
        <Section id="events" className="py-20 overflow-hidden">
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl md:text-5xl font-black text-center uppercase mb-16 tracking-tight"
            >
                {title}
            </motion.h2>

            {/* Mobile: 2-column grid */}
            <div ref={sectionRef} className="max-w-6xl mx-auto px-4">
                <div className="grid grid-cols-2 @max-2xl:grid-cols-1 gap-3 lg:hidden">
                    {visible.map((item, i) => (
                        <motion.div
                            key={`mobile-${item.id}`}
                            initial={{ opacity: 0, y: 32 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                            whileHover={{ scale: 1.02 }}
                        >
                            <EventCard item={item} index={i} useBrand={useBrand} />
                        </motion.div>
                    ))}
                </div>

                {/* Desktop: 3-column staggered grid */}
                <div className="hidden lg:flex gap-4 items-start">
                    {/* Column 1 - HIGH */}
                    <motion.div className="flex flex-col gap-4 flex-1" {...fadeUp(0)}>
                        {col1.map((item, i) => (
                            <motion.div key={`c1-${item.id}`} whileHover={{ scale: 1.03 }} transition={{ duration: 0.22 }}>
                                <EventCard item={item} index={i} useBrand={useBrand} />
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Column 2 - LOW (offset) */}
                    <motion.div
                        className="flex flex-col gap-4 flex-1"
                        style={{ paddingTop: MIDDLE_OFFSET }}
                        {...fadeUp(0.08)}
                    >
                        {col2.map((item, i) => (
                            <motion.div key={`c2-${item.id}`} whileHover={{ scale: 1.03 }} transition={{ duration: 0.22 }}>
                                <EventCard item={item} index={i + 2} useBrand={useBrand} />
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Column 3 - HIGH */}
                    <motion.div className="flex flex-col gap-4 flex-1" {...fadeUp(0.16)}>
                        {col3.map((item, i) => (
                            <motion.div key={`c3-${item.id}`} whileHover={{ scale: 1.03 }} transition={{ duration: 0.22 }}>
                                <EventCard item={item} index={i + 4} useBrand={useBrand} />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* View More button */}
                {hasMore && (
                    <motion.div
                        className="text-center mt-16"
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Link
                            href="/events"
                            className="inline-flex items-center gap-2 border border-foreground/20 hover:border-foreground/40 bg-foreground/5 hover:bg-foreground/10 px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-200"
                        >
                            <span>Explore All Events</span>
                        </Link>
                    </motion.div>
                )}
            </div>
        </Section>
    )
}
