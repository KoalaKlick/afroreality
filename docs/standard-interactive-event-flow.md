# Architecture & Implementation Specification: Standard Interactive Event Flow

> **Status**: Design & RFC Phase  
> **Target Platform**: Fextiva (Web Application & Mobile Public Views)  
> **Scope**: Standard Events, Timeline / Session Outline Engine, and Coinciding Interactive Topic Discussions

---

## 1. Executive Summary & Vision

While **Ticketed** events focus on access control & purchases, and **Voting** events focus on candidate ballots and standings, **Standard Events** in Fextiva represent gatherings, summits, meetups, conferences, workshops, and community festivals where **content delivery, schedules, and live attendee engagement** are paramount.

Currently, standard events show basic metadata (title, dates, venue, and description). This specification introduces a **General Interactive Standard Flow** designed to transform standard events into dynamic, live-participatory experiences through:
1. **Curated Event Outlines & Timelines**: Structured multi-session schedules with speaker details, milestones, and live session status tracking.
2. **Coinciding Interactive Topics Engine**: Real-time discussion threads, audience Q&A, and topic explorations mapped directly to specific timeline sessions.
3. **Audience Participation Tools**: Live topic upvoting, presenter replies, and session resource downloads.

---

## 2. Core Feature Pillars

### A. Dynamic Event Timeline & Outline Engine
- **Session Hierarchy**: Organizers can configure single-day or multi-day agendas broken down into chronological milestones (e.g., *09:00 AM Keynote*, *11:00 AM Panel Discussion*, *02:00 PM Breakout Sessions*).
- **Session Metadata**:
  - Start & end times, duration, and timezone.
  - Session title and rich description.
  - Speaker / Facilitator names, titles, and avatars.
  - Physical / virtual room (e.g., "Auditorium A", "Zoom Room 2").
  - Presentation attachments (PDF slides, worksheets, resource URLs).
- **Live Session State Engine**:
  - Automatic time-based status: `upcoming`, `live`, `completed`.
  - Organizer manual override (e.g., mark "Session in Progress" or delay/shift timing live).
  - Visual pulse indicators for attendees showing what is happening **right now**.

### B. Coinciding Interactive Topics & Discussion Streams
- **Timeline-Topic Synchronization**:
  - Each milestone in the timeline can have one or more linked **Interactive Topics**.
  - Example: During the "AI & African Fintech Panel" session, an interactive topic *"What are the biggest regulatory hurdles for cross-border remittances?"* activates.
- **Audience Engagement**:
  - Attendees can ask questions, submit feedback, or share insights under relevant session topics.
  - Community upvoting allows the best questions and talking points to bubble to the top for moderators/speakers to address live.
- **Organizer & Speaker Moderation**:
  - Pin important announcements or prompt questions to the top of the topic.
  - Mark attendee questions as *"Answered Live"* or reply with official answers.
  - Hide or delete spam/inappropriate submissions.

### C. Public & Attendee Experience
- **Content-First Placement**: On standard events, the interactive timeline and topics take center stage where category/nominees or tickets normally appear (the right column on desktop, and the primary content stream on mobile).
- **Graceful Empty State**: If an organizer has not yet entered their schedule, a clean illustration (`NoStandardEventIllustration`) and coming-soon outline guide the user to check back and share the event.
- **Personalized Itinerary** *(Phase 3)*: Attendees can bookmark sessions to receive calendar reminders or push notifications before sessions begin.

---

## 3. Data Architecture (Prisma Schema Proposal)

The following schema extensions will be added to `packages/db/prisma/schema/event.prisma`:

```prisma
/// Represents a structured milestone or session within an event's agenda outline.
model EventTimelineItem {
  id            String             @id @default(cuid()) @map("id") @db.VarChar(36)
  eventId       String             @map("event_id") @db.VarChar(36)
  event         Event              @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  title         String             @map("title") @db.VarChar(255)
  description   String?            @map("description") @db.Text
  
  startTime     DateTime           @map("start_time")
  endTime       DateTime?          @map("end_time")
  orderIdx      Int                @default(0) @map("order_idx")
  
  // Logistics & Speakers
  roomOrStage   String?            @map("room_or_stage") @db.VarChar(120)
  speakerNames  String[]           @default([]) @map("speaker_names")
  speakerMeta   Json?              @map("speaker_meta") // [{ name, role, avatarUrl, company }]
  
  // Status & Attachments
  status        String             @default("upcoming") @map("status") @db.VarChar(20) // upcoming | live | completed | cancelled
  resources     Json?              @map("resources")    // [{ title, url, type }]
  
  // Linked Interactive Topics
  topics        EventTopic[]
  
  createdAt     DateTime           @default(now()) @map("created_at")
  updatedAt     DateTime           @updatedAt @map("updated_at")

  @@index([eventId, startTime])
  @@map("event_timeline_items")
}

/// An interactive discussion or Q&A topic coinciding with an event outline milestone.
model EventTopic {
  id              String             @id @default(cuid()) @map("id") @db.VarChar(36)
  eventId         String             @map("event_id") @db.VarChar(36)
  event           Event              @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  timelineItemId  String?            @map("timeline_item_id") @db.VarChar(36)
  timelineItem    EventTimelineItem? @relation(fields: [timelineItemId], references: [id], onDelete: SetNull)
  
  title           String             @map("title") @db.VarChar(255)
  description     String?            @map("description") @db.Text
  
  // Author information (optional guest or registered attendee)
  authorName      String?            @map("author_name") @db.VarChar(100)
  authorEmail     String?            @map("author_email") @db.VarChar(255)
  isOrganizer     Boolean            @default(false) @map("is_organizer")
  
  // Moderation & Interaction stats
  isPinned        Boolean            @default(false) @map("is_pinned")
  isAnswered      Boolean            @default(false) @map("is_answered")
  upvotesCount    Int                @default(0) @map("upvotes_count")
  status          String             @default("active") @map("status") @db.VarChar(20) // active | closed | hidden
  
  comments        EventTopicComment[]
  votes           EventTopicVote[]

  createdAt       DateTime           @default(now()) @map("created_at")
  updatedAt       DateTime           @updatedAt @map("updated_at")

  @@index([eventId, timelineItemId])
  @@map("event_topics")
}

/// Comments, questions, or attendee replies under a specific topic.
model EventTopicComment {
  id          String      @id @default(cuid()) @map("id") @db.VarChar(36)
  topicId     String      @map("topic_id") @db.VarChar(36)
  topic       EventTopic  @relation(fields: [topicId], references: [id], onDelete: Cascade)
  
  authorName  String      @map("author_name") @db.VarChar(100)
  authorEmail String?     @map("author_email") @db.VarChar(255)
  content     String      @map("content") @db.Text
  isOfficial  Boolean     @default(false) @map("is_official")
  
  createdAt   DateTime    @default(now()) @map("created_at")

  @@index([topicId, createdAt])
  @@map("event_topic_comments")
}

/// Upvotes for topics and questions to prevent duplicates.
model EventTopicVote {
  id          String      @id @default(cuid()) @map("id") @db.VarChar(36)
  topicId     String      @map("topic_id") @db.VarChar(36)
  topic       EventTopic  @relation(fields: [topicId], references: [id], onDelete: Cascade)
  
  identifier  String      @map("identifier") @db.VarChar(128) // hashed IP or User ID
  createdAt   DateTime    @default(now()) @map("created_at")

  @@unique([topicId, identifier])
  @@map("event_topic_votes")
}
```

---

## 4. UI/UX Architecture

### A. Desktop View (`xl+`)
- **Sticky Left Column (`col-span-4`)**:
  - Handled by `EventSidebarCard.tsx`:
    - Event flier/cover (or `OrgGeometricBanner` fallback).
    - Event title, organization link, date/time, venue, map preview.
    - Quick actions: Share, Add to Calendar, Live Session status indicator.
- **Dynamic Right Column (`col-span-8`)**:
  - Handled by `StandardEventContent.tsx`:
    - **Header & Event Overview Card**: Rich description, venue details, category & tag pills.
    - **Interactive Outline Tracker**: Chronological timeline cards with active pulse indicator, speaker tags, room badges, and resource download buttons.
    - **Coinciding Topics Feed**: Tabbed or inline interactive topic modules where attendees can upvote topics, ask questions, and read official replies.

### B. Mobile View (`< xl`)
- `EventHero.tsx` with cover image or `OrgGeometricBanner`.
- Main content stream with `StandardEventContent.tsx` rendered directly below hero/divider.
- Tabbed switcher for long schedules:
  - **[Schedule / Outline]**: Chronological session list.
  - **[Live Topics & Q&A]**: Discussion threads.
  - **[About & Venue]**: Location map, sponsors, organizer bio.

---

## 5. Phased Implementation Roadmap

| Phase | Milestone | Deliverables |
|---|---|---|
| **Phase 1** *(Current)* | **UI Shell & Empty Illustration** | - `NoStandardEventIllustration.tsx` created.<br>- `StandardEventContent.tsx` integrated in public event page.<br>- Initial timeline outline skeleton and coming-soon empty state active. |
| **Phase 2** | **Prisma Schema & Dashboard Manager** | - Apply `EventTimelineItem` & `EventTopic` schema via `db:push`.<br>- Build Timeline & Agenda tab in Event Dashboard.<br>- CRUD form for schedule milestones, speakers, and materials. |
| **Phase 3** | **Live Timeline Presentation** | - Render real organizer timeline items in `StandardEventContent.tsx`.<br>- Automatic active/live session detection based on current time.<br>- Downloadable session resource attachments. |
| **Phase 4** | **Interactive Topics & Audience Q&A** | - Public topic submission and comment drawers.<br>- Attendee upvoting system (fingerprint/cookie based).<br>- Organizer moderation tools (pin, mark answered, delete). |
| **Phase 5** | **Real-Time Synchronisation** | - Live updates via Server-Sent Events (SSE) or optimistic revalidation.<br>- Live polling module attached to session milestones. |

---

## 6. Verification & Design Checkpoints

1. **Brand Theme Harmony**:
   - Uses CSS color variables (`--color-brand-primary`, `--color-brand-secondary`, `--color-brand-tertiary`) so the outline and interactive components inherit the organizer's palette.
2. **Container Query Compatibility**:
   - Uses `@container` queries ensuring cards adapt gracefully whether viewed in wide desktop columns or narrow mobile viewports.
3. **Graceful Fallbacks**:
   - When no schedule or description exists, `NoStandardEventIllustration` provides an engaging, brand-aligned empty state.
