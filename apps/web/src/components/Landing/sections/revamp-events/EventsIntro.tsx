"use client"

interface EventsIntroProps {
    readonly title?: string
}

export function EventsIntro({ title = "Tokyo Nights" }: EventsIntroProps) {
    return (
        <section className="flex h-[50vh] flex-col items-center justify-end pb-10 text-center">
            <h1 className="m-0 text-[clamp(36px,8vw,72px)] uppercase text-[#f5f5f5]">
                {title}
            </h1>
        </section>
    )
}
