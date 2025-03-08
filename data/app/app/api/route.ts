// app/api/api/route.ts
import data from '../../../data/data.json';
import { NextResponse } from 'next/server';

export async function GET() {
  // Retourne les données JSON stockées dans data.json
  return NextResponse.json(data);
}
