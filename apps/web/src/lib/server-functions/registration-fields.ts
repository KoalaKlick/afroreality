"use server";
import { prisma } from '@repo/db';
import { serializeJsonSafe } from '../utils';

export async function getRegistrationFields({ data }: { data: { eventId: string } }): Promise<any[]> {
  const fields = await prisma.eventRegistrationField.findMany({
    where: { eventId: data.eventId },
    orderBy: { orderIdx: 'asc' },
  });
  return serializeJsonSafe(fields);
}

export async function addRegistrationField({ data }: { data: any }): Promise<any> {
  const field = await prisma.eventRegistrationField.create({
    data: {
      eventId: data.eventId,
      label: data.label,
      fieldType: data.fieldType,
      required: data.required ?? false,
      options: data.options || [],
      orderIdx: data.orderIdx || 0,
    },
  });
  return serializeJsonSafe(field);
}

export async function updateRegistrationField({ data }: { data: any }): Promise<any> {
  const { id, fieldId, ...rest } = data;
  const updated = await prisma.eventRegistrationField.update({
    where: { id: id || fieldId },
    data: rest,
  });
  return serializeJsonSafe(updated);
}

export async function deleteRegistrationField({ data }: { data: any }): Promise<any> {
  const targetId = data.id || data.fieldId;
  await prisma.eventRegistrationField.delete({ where: { id: targetId } });
  return { success: true };
}
