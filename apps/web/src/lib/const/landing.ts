export interface NavbarNavLink {
    href: string
    label: string
    active?: boolean
}

export const defaultNavigationLinks: NavbarNavLink[] = [
    { href: "/#", label: "Home", active: true },
    { href: "/#features", label: "Features" },
    { href: "/#about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/#faq", label: "FAQ" },
]

// Events Section Data
export interface EventItem {
    id: number
    title: string
    subtitle?: string
    category: string
    date: string
    image: string
    accentColor: 'red' | 'yellow' | 'green' | 'black'
}

export const eventItems: EventItem[] = [
    { id: 1, title: "Ghana Fashion & Festival", subtitle: "Join us for the biggest", category: "FASHION", date: "MAY 2025", image: "/landing/a.webp", accentColor: "red" },
    { id: 2, title: "Tech Conference Kumasi", subtitle: "Innovation meets tradition", category: "TECH", date: "JUN 2025", image: "/landing/b.webp", accentColor: "yellow" },
    { id: 3, title: "Pan African Film Festival", subtitle: "Celebrating African cinema", category: "FILM", date: "JUL 2025", image: "/landing/c.webp", accentColor: "green" },
    { id: 4, title: "Afrobeats Night Live", subtitle: "Experience the rhythm", category: "MUSIC", date: "AUG 2025", image: "/landing/d.webp", accentColor: "red" },
    { id: 5, title: "Ghana Startup Summit", subtitle: "Build the future", category: "BUSINESS", date: "SEP 2025", image: "/landing/j.webp", accentColor: "yellow" },
    { id: 6, title: "Cultural Dance Exhibition", subtitle: "Traditional meets modern", category: "CULTURE", date: "OCT 2025", image: "/landing/g.webp", accentColor: "green" },
    { id: 7, title: "Innovation Conference", subtitle: "Leading creators gather", category: "TECH", date: "NOV 2025", image: "/landing/h.webp", accentColor: "black" },
    { id: 8, title: "Creative Conference", subtitle: "Explore creativity", category: "ART", date: "DEC 2025", image: "/landing/l.jpg", accentColor: "red" },
]