import { BadRequestException } from "@nestjs/common";

export interface BrowseCursor {
  lastId: string;
  organicOffset: number;
}
export interface SearchCursor {
  offset: number;
}

function decode<T>(cursor: string): T {
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf8');
    return JSON.parse(json) as T;
  } catch {
    throw new BadRequestException('Invalid pagination cursor.');
  }
}

function encode(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeBrowseCursor(cursor: string | undefined): BrowseCursor {
  if (!cursor) return { lastId: '0', organicOffset: 0 };
  const decoded = decode<BrowseCursor>(cursor);
  if (
    typeof decoded.lastId !== 'string' ||
    typeof decoded.organicOffset !== 'number' ||
    decoded.organicOffset < 0
  ) {
    throw new BadRequestException('Invalid pagination cursor.');
  }
  return decoded;
}

export function encodeBrowseCursor(payload: BrowseCursor): string {
  return encode(payload);
}

export function encodeSearchCursor(payload: SearchCursor): string {
  return encode(payload);
}

export function decodeSearchCursor(cursor: string | undefined): SearchCursor {
  if (!cursor) return { offset: 0 };
  const decoded = decode<SearchCursor>(cursor);
  if (typeof decoded.offset !== 'number' || decoded.offset < 0) {
    throw new BadRequestException('Invalid pagination cursor.');
  }
  return decoded;
}