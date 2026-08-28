"use server";
import { prisma } from '@repo/db';
import { serializeJsonSafe } from '../utils';

export async function getEventMembers({ data }: { data: any }): Promise<any> {
  const members = await prisma.eventMember.findMany({
    where: { eventId: data.eventId },
    orderBy: { createdAt: 'desc' },
  });
  return { items: serializeJsonSafe(members), total: members.length };
}

export async function addEventMember({ data }: { data: any }): Promise<any> {
  const member = await prisma.eventMember.create({
    data: {
      eventId: data.eventId,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      uniqueCode: `MEM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'invited',
      responses: data.responses || undefined,
    },
  });
  return serializeJsonSafe(member);
}

export async function bulkAddEventMembers({ data }: { data: any }): Promise<any> {
  const members = await prisma.eventMember.createMany({
    data: (data.members || []).map((m: any) => ({
      eventId: data.eventId,
      name: m.name,
      email: m.email || null,
      phone: m.phone || null,
      uniqueCode: `MEM-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      status: 'invited',
      responses: m.responses || undefined,
    })),
  });
  return serializeJsonSafe(members);
}

export async function publicRegisterForEvent({ data }: { data: any }): Promise<any> {
  return addEventMember({ data });
}

export async function markAttendance({ data }: { data: any }): Promise<any> {
  const updated = await prisma.eventMember.update({
    where: { id: data.id || data.memberId },
    data: { attended: data.attended ?? true },
  });
  return serializeJsonSafe(updated);
}

export async function removeEventMember({ data }: { data: any }): Promise<any> {
  await prisma.eventMember.delete({
    where: { id: data.id || data.memberId },
  });
  return { success: true };
}

export async function bulkMarkAttendance({ data }: { data: any }): Promise<any> {
  await prisma.eventMember.updateMany({
    where: { id: { in: data.memberIds || data.ids } },
    data: { attended: data.attended ?? true },
  });
  return { success: true };
}

export async function bulkRemoveEventMembers({ data }: { data: any }): Promise<any> {
  await prisma.eventMember.deleteMany({
    where: { id: { in: data.memberIds || data.ids } },
  });
  return { success: true };
}

export async function sendCodes({ data }: { data: any }): Promise<any> {
  return { success: true, sentCount: data.memberIds?.length || 0 };
}

export async function sendSingleCode({ data }: { data: any }): Promise<any> {
  return { success: true };
}
