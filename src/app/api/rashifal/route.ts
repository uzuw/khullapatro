import { getRashifal } from '@/lib/sources';
import { apiResponse } from '@/lib/api';
export const dynamic = 'force-dynamic';
export async function GET() {
  return apiResponse(getRashifal);
}
