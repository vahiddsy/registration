import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret });
  if (!token || token.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const registrations = await prisma.registration.findMany({ include: { operator: true }, orderBy: { createdAt: 'desc' } });
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Registrations');
  sheet.columns = [
    { header: 'First Name', key: 'firstName' },
    { header: 'Last Name', key: 'lastName' },
    { header: 'National ID', key: 'nationalId' },
    { header: 'Operator', key: 'operator' },
    { header: 'Created At', key: 'createdAt' },
  ];
  registrations.forEach((registration: (typeof registrations)[number]) => {
    sheet.addRow({
      firstName: registration.firstName,
      lastName: registration.lastName,
      nationalId: registration.nationalId,
      operator: registration.operator.fullname,
      createdAt: registration.createdAt.toISOString(),
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="registrations.xlsx"',
    },
  });
}
