import { NextRequest } from 'next/server';

export interface RouteSegmentContext<Params> {
  params: Params;
}

export type CategoryParams = {
  id: string;
};

export type CategoryHandler = (
  req: NextRequest,
  context: RouteSegmentContext<CategoryParams>
) => Promise<Response>; 