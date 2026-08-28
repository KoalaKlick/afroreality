"use client"

import { cn } from "@/lib/utils"
import { Check, Clock, X, AlertTriangle, Minus, Ban, Play, Calendar, Crown, ShieldCheck, User } from "lucide-react"
import type { LucideIcon } from "lucide-react"

type StatusVariant =
    | 'active'
    | 'inactive'
    | 'approved'
    | 'pending'
    | 'review'
    | 'rejected'
    | 'cancelled'
    | 'warning'
    | 'success'
    | 'current'
    | 'past'
    | 'draft'
    | 'closed'
    | 'view'
    | 'info'
    | 'error'
    | 'default'
    | 'completed'
    | 'ongoing'
    | 'ended'
    | 'published'
    | 'upcoming'
    | 'owner'
    | 'admin'
    | 'member'

interface StatusConfig {
    icon: LucideIcon
    iconBgColor: string
    textColor: string
    borderColor: string
    bgColor: string
    defaultText: string
}

const statusConfigs: Record<StatusVariant, StatusConfig> = {
    active: {
        icon: Check,
        iconBgColor: "bg-[#38C793]",
        textColor: "text-gray-700",
        borderColor: "",
        bgColor: "",
        defaultText: "Active",
    },
    inactive: {
        icon: Minus,
        iconBgColor: "bg-red-600",
        textColor: "text-gray-700",
        borderColor: "",
        bgColor: "",
        defaultText: "Archived",
    },
    approved: {
        icon: Check,
        iconBgColor: "bg-[#38C793]",
        textColor: "text-gray-500",
        borderColor: "",
        bgColor: "",
        defaultText: "Approved",
    },
    completed: {
        icon: Check,
        iconBgColor: "bg-[#38C793]",
        textColor: "text-gray-500",
        borderColor: "",
        bgColor: "",
        defaultText: "Completed",
    },
    pending: {
        icon: Clock,
        iconBgColor: "bg-amber-500",
        textColor: "text-gray-500",
        borderColor: "",
        bgColor: "",
        defaultText: "Pending",
    },
    review: {
        icon: Clock,
        iconBgColor: "bg-amber-500",
        textColor: "text-gray-500",
        borderColor: "",
        bgColor: "",
        defaultText: "In Review",
    },
    rejected: {
        icon: X,
        iconBgColor: "bg-red-500",
        textColor: "text-gray-500",
        borderColor: "",
        bgColor: "",
        defaultText: "Rejected",
    },
    cancelled: {
        icon: Ban,
        iconBgColor: "bg-gray-500",
        textColor: "text-gray-500",
        borderColor: "",
        bgColor: "",
        defaultText: "Cancelled",
    },
    warning: {
        icon: AlertTriangle,
        iconBgColor: "bg-orange-500",
        textColor: "text-gray-500",
        borderColor: "",
        bgColor: "",
        defaultText: "Warning",
    },
    success: {
        icon: Check,
        iconBgColor: "bg-emerald-500",
        textColor: "text-gray-500",
        borderColor: "",
        bgColor: "",
        defaultText: "Success",
    },
    current: {
        icon: Check,
        iconBgColor: "bg-emerald-500",
        textColor: "text-gray-500",
        borderColor: "",
        bgColor: "",
        defaultText: "Current",
    },
    past: {
        icon: Minus,
        iconBgColor: "bg-slate-500",
        textColor: "text-gray-500",
        borderColor: "",
        bgColor: "",
        defaultText: "Past",
    },
    draft: {
        icon: Clock,
        iconBgColor: "bg-blue-500",
        textColor: "text-gray-500",
        borderColor: "",
        bgColor: "",
        defaultText: "Draft",
    },
    closed: {
        icon: X,
        iconBgColor: "bg-red-500",
        textColor: "text-gray-500",
        borderColor: "",
        bgColor: "",
        defaultText: "Closed",
    },
    info: {
        icon: Clock,
        iconBgColor: "bg-blue-500",
        textColor: "text-gray-500",
        borderColor: "",
        bgColor: "",
        defaultText: "Info",
    },
    error: {
        icon: X,
        iconBgColor: "bg-red-500",
        textColor: "text-gray-500",
        borderColor: "",
        bgColor: "",
        defaultText: "Error",
    },
    default: {
        icon: Minus,
        iconBgColor: "bg-gray-500",
        textColor: "text-gray-500",
        borderColor: "",
        bgColor: "",
        defaultText: "",
    },
    view: {
        icon: Minus,
        iconBgColor: "bg-gray-500",
        textColor: "text-gray-500",
        borderColor: "",
        bgColor: "",
        defaultText: "View Details",
    },
    ongoing: {
        icon: Play,
        iconBgColor: "bg-green-500",
        textColor: "text-gray-500",
        borderColor: "",
        bgColor: "",
        defaultText: "Ongoing",
    },
    ended: {
        icon: Check,
        iconBgColor: "bg-slate-500",
        textColor: "text-gray-500",
        borderColor: "",
        bgColor: "",
        defaultText: "Ended",
    },
    published: {
        icon: Check,
        iconBgColor: "bg-emerald-500",
        textColor: "text-gray-500",
        borderColor: "",
        bgColor: "",
        defaultText: "Published",
    },
    upcoming: {
        icon: Calendar,
        iconBgColor: "bg-blue-500",
        textColor: "text-gray-500",
        borderColor: "",
        bgColor: "",
        defaultText: "Upcoming",
    },
    owner: {
        icon: Crown,
        iconBgColor: "text-primary-600",
        textColor: "text-gray-700 dark:text-gray-300",
        borderColor: "",
        bgColor: "bg-primary-50",
        defaultText: "Owner",
    },
    admin: {
        icon: ShieldCheck,
         iconBgColor: "text-secondary-600",
        textColor: "text-gray-700 dark:text-gray-300",
        borderColor: "bg-secondary-50",
        bgColor: "",
        defaultText: "Admin",
    },
    member: {
        icon: User,
        iconBgColor: "text-tertiary-600",
        textColor: "text-gray-700 dark:text-gray-300",
        borderColor: "bg-tertiary-50",
        bgColor: "",
        defaultText: "Member",
    },
}

interface StatusBadgeProps {
    readonly variant: string
    readonly text?: string
    readonly className?: string
    readonly showIcon?: boolean
    readonly size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
    sm: {
        container: "px-2 py-0.5 text-xs",
        icon: "size-2",
        iconPadding: "p-0.5"
    },
    md: {
        container: "px-2.5 py-1 text-xs",
        icon: "size-2.5",
        iconPadding: "p-0.5"
    },
    lg: {
        container: "px-3 py-1.5 text-sm",
        icon: "size-3",
        iconPadding: "p-1"
    }
}

export function StatusBadge({
    variant,
    text,
    className,
    showIcon = true,
    size = 'sm'
}: StatusBadgeProps): React.ReactElement {
    const normalizedVariant = (variant || 'default').toLowerCase() as StatusVariant
    const config = statusConfigs[normalizedVariant] || statusConfigs.default
    const Icon = config.icon
    const displayText = text || config.defaultText || variant
    const sizeConfig = sizeClasses[size]

    return (
        <span
            className={cn(
                "inline-flex w-fit gap-1.5 items-center rounded border font-medium transition-colors",
                config.textColor,
                config.borderColor,
                config.bgColor,
                sizeConfig.container,
                className
            )}
        >
            {showIcon && (
                <span className={cn("rounded-full flex items-center justify-center text-white", config.iconBgColor, sizeConfig.iconPadding)}>
                    <Icon className={cn(sizeConfig.icon, "stroke-[3]")} />
                </span>
            )}
            {displayText}
        </span>
    )
}

// Backward compatibility wrapper for the old API
interface LegacyStatusBadgeProps {
    readonly isActive: boolean
    readonly activeText?: string
    readonly inactiveText?: string
    readonly className?: string
    readonly variant?: 'default' | 'employment'
}

export function LegacyStatusBadge({
    isActive,
    activeText = "Active",
    inactiveText = "Archived",
    className,
    variant = 'default',
}: LegacyStatusBadgeProps): React.ReactElement {
    const getStatusVariant = (): StatusVariant => {
        if (variant === 'employment') {
            return isActive ? 'current' : 'past'
        }
        return isActive ? 'active' : 'inactive'
    }

    const getDisplayText = (): string | undefined => {
        if (variant === 'employment') {
            return undefined
        }
        return isActive ? activeText : inactiveText
    }

    return <StatusBadge variant={getStatusVariant()} text={getDisplayText()} className={className} />
}