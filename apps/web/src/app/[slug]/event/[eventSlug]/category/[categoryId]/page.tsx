import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicCategoryDetails } from "@/lib/dal/public";
import { getEventImageUrl, getOrgImageUrl } from "@/lib/image-url-utils";
import { PublicNomineeSheet } from "@/components/event/public/PublicNomineeSheet";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { PoweredByFooter } from "@/components/shared/PoweredByFooter";
import {
	ChevronRight,
	Trophy,
	Sparkles,
	ArrowLeft,
	Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import type { Metadata } from "next";

interface CategoryPageProps {
	params: Promise<{
		slug: string;
		eventSlug: string;
		categoryId: string;
	}>;
}

const BASE_URL =
	process.env.NEXT_PUBLIC_APP_URL ||
	process.env.NEXT_PUBLIC_DOMAIN_URL ||
	"https://afroreality.com";

export async function generateMetadata({
	params,
}: CategoryPageProps): Promise<Metadata> {
	const { slug: orgSlug, eventSlug, categoryId } = await params;
	const data = await getPublicCategoryDetails(orgSlug, eventSlug, categoryId);
	if (!data) return {};

	const { event, category } = data;
	const coverImage =
		getEventImageUrl(category.templateImage || event.flierUrl) ??
		"/landing/g.webp";
	const absoluteImage = coverImage.startsWith("http")
		? coverImage
		: `${BASE_URL}${coverImage}`;
	const pageUrl = `${BASE_URL}/${orgSlug}/event/${eventSlug}/category/${categoryId}`;

	return {
		title: `${category.name} | ${event.title}`,
		description:
			category.description ||
			`Vote for your favorite nominee in ${category.name} at ${event.title}.`,
		openGraph: {
			title: `${category.name} | ${event.title}`,
			description: category.description || `Vote for nominees in ${category.name}.`,
			url: pageUrl,
			type: "website",
			images: [
				{
					url: absoluteImage,
					width: 1200,
					height: 630,
					alt: category.name,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: `${category.name} | ${event.title}`,
			description: category.description || `Vote in ${category.name}.`,
			images: [absoluteImage],
		},
	};
}

export default async function PublicCategoryPage({
	params,
}: CategoryPageProps) {
	const { slug: orgSlug, eventSlug, categoryId } = await params;
	const data = await getPublicCategoryDetails(orgSlug, eventSlug, categoryId);

	if (!data) {
		notFound();
	}

	const { event, category } = data;
	const { organization } = event;
	const isInternalVoting = event.votingMode === "internal";

	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col">
			{/* Breadcrumb Header */}
			<header className="border-b border-border/80 bg-card/60 backdrop-blur-md sticky top-0 z-40">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between text-xs">
					<div className="flex items-center gap-2 truncate">
						<Link
							href={`/${orgSlug}`}
							className="font-semibold text-muted-foreground hover:text-foreground transition-colors"
						>
							{organization.name}
						</Link>
						<ChevronRight className="size-3.5 text-muted-foreground/60" />
						<Link
							href={`/${orgSlug}/event/${eventSlug}`}
							className="font-semibold text-muted-foreground hover:text-foreground transition-colors truncate"
						>
							{event.title}
						</Link>
						<ChevronRight className="size-3.5 text-muted-foreground/60" />
						<span className="font-bold text-foreground truncate">
							{category.name}
						</span>
					</div>

					<Button asChild variant="ghost" size="sm" className="h-8 gap-1 text-xs">
						<Link href={`/${orgSlug}/event/${eventSlug}`}>
							<ArrowLeft className="size-3.5" /> Back to Event
						</Link>
					</Button>
				</div>
			</header>

			{/* Category Hero Section */}
			<section className="border-b border-border/80 bg-muted/30 py-10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
					<div className="flex flex-wrap items-center gap-2">
						<Badge
							variant="secondary"
							className="text-xs bg-primary/10 text-primary border-primary/20 font-bold"
						>
							Voting Category
						</Badge>
						{isInternalVoting && (
							<Badge
								variant="outline"
								className="text-xs text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-900/60 gap-1"
							>
								<Lock className="size-3" /> Member Ballot
							</Badge>
						)}
					</div>

					<h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
						{category.name}
					</h1>

					{category.description && (
						<div className="max-w-3xl text-sm text-muted-foreground leading-relaxed">
							<RichTextDisplay content={category.description} />
						</div>
					)}
				</div>
			</section>

			{/* Main Nominees View */}
			<main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
				<PublicNomineeSheet
					category={{
						id: category.id,
						name: category.name,
						description: category.description,
						votePrice: Number(category.votePrice || 0),
						nominationPrice: Number(category.nominationPrice || 0),
						allowPublicNomination: category.allowPublicNomination,
						allowMultiple: category.allowMultiple,
						showTotalVotesPublicly: category.showTotalVotesPublicly,
						votingOptions: category.votingOptions || [],
					}}
					eventId={event.id}
					votingMode={event.votingMode || "general"}
					orgSlug={orgSlug}
					eventSlug={eventSlug}
				/>
			</main>

			<PanAfricanDivider className="my-12" />
			<PoweredByFooter />
		</div>
	);
}
