"use client"

interface EventsOutroProps {
    readonly text?: string
}

export function EventsOutro({ text = "Fin" }: EventsOutroProps) {
    return (
        <section className="flex h-screen items-center justify-center">
            <p className="m-0 text-[clamp(36px,8vw,72px)] text-[#f5f5f5]">
                {text}
            </p>
        </section>
    )
}
