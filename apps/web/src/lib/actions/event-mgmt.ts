'use server';

import { prisma } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { requireSession } from '../session';
import { createEventSchema, type CreateEventInput } from '../validations/event';
import { serializeJsonSafe } from '../utils';

export async function createNewEvent({ data }: { data: CreateEventInput & { organizationId?: string } }) {
  const session = await requireSession();
  const organizationId = data.organizationId;
  if (!organizationId) {
    throw new Error('Organization ID is required');
  }

  const existing = await prisma.event.findUnique({
    where: {
      organizationId_slug: {
        organizationId,
        slug: data.slug.toLowerCase().trim(),
      },
    },
    select: { id: true },
  });
  if (existing) throw new Error('Event slug already taken in this organization');

  const event = await prisma.event.create({
    data: {
      organizationId,
      creatorId: session.userId,
      title: data.title.trim(),
      slug: data.slug.toLowerCase().trim(),
      type: data.type as any,
      description: data.description || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      timezone: data.timezone || 'Africa/Accra',
      isPublic: data.isPublic ?? true,
      flierImage: data.flierImage || null,
      bannerImage: data.bannerImage || null,
      venueName: data.venueName || null,
      venueAddress: data.venueAddress || null,
      venueCity: data.venueCity || null,
      venueCountry: data.venueCountry || 'Ghana',
      latitude: data.latitude !== undefined && data.latitude !== null ? Number(data.latitude) : null,
      longitude: data.longitude !== undefined && data.longitude !== null ? Number(data.longitude) : null,
      isVirtual: data.isVirtual ?? false,
      virtualLink: data.virtualLink || null,
      maxAttendees: data.maxAttendees ?? null,
      hasUssd: data.hasUssd ?? false,
      ussdCode: data.ussdCode || null,
      sponsors: data.sponsors ? {
        create: data.sponsors.map((s) => ({
          name: s.name,
          logo: s.logo || null,
        })),
      } : undefined,
      socialLinks: data.socialLinks ? {
        create: data.socialLinks.map((s) => ({
          url: s.url,
        })),
      } : undefined,
      galleryLinks: data.galleryLinks ? {
        create: data.galleryLinks.map((g) => ({
          name: g.name,
          url: g.url,
        })),
      } : undefined,
    },
    include: { sponsors: true, socialLinks: true, galleryLinks: true },
  });

  revalidatePath('/my-events');
  revalidatePath('/dashboard');

  return serializeJsonSafe(event);
}

export async function updateExistingEvent({ data }: { data: any }) {
  await requireSession();
  const { id, startDate, endDate, sponsors, socialLinks, galleryLinks, ...rest } = data;

  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...rest,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      sponsors: sponsors ? { deleteMany: {}, create: sponsors } : undefined,
      socialLinks: socialLinks ? { deleteMany: {}, create: socialLinks } : undefined,
      galleryLinks: galleryLinks ? { deleteMany: {}, create: galleryLinks } : undefined,
    },
    include: { sponsors: true, socialLinks: true, galleryLinks: true },
  });

  revalidatePath('/my-events');
  revalidatePath(`/my-events/${id}`);
  return serializeJsonSafe(updated);
}

export async function changeEventStatus({ data }: { data: { id: string; status: any } }) {
  await requireSession();
  const updated = await prisma.event.update({
    where: { id: data.id },
    data: {
      status: data.status,
      publishedAt: data.status === 'published' ? new Date() : undefined,
    },
  });

  revalidatePath('/my-events');
  revalidatePath(`/my-events/${data.id}`);
  return serializeJsonSafe(updated);
}

export async function deleteExistingEvent({ data }: { data: { id: string } }) {
  await requireSession();
  const evt = await prisma.event.findUnique({
    where: { id: data.id },
    select: { status: true },
  });
  if (!evt) throw new Error('Event not found');
  if (evt.status !== 'draft') throw new Error('Only draft events can be deleted');

  await prisma.event.delete({ where: { id: data.id } });

  revalidatePath('/my-events');
  revalidatePath('/dashboard');
  return { success: true };
}
