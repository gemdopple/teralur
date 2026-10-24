import "server-only";
import { NextResponse } from "next/server";
import { AuthError } from "@/lib/admin-auth";

// Helper respons bersama untuk semua rute /api/admin/* (PRD v1.1 Lampiran E.1).
// Semua respons memakai Cache-Control: no-store.

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "INVALID_FILE"
  | "NOT_FOUND"
  | "FEATURED_LIMIT"
  | "RATE_LIMITED"
  | "INTERNAL";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  VALIDATION_ERROR: 422,
  INVALID_FILE: 400,
  NOT_FOUND: 404,
  FEATURED_LIMIT: 422,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

export type ErrorDetail = { path: (string | number)[]; message: string };

export function jsonError(
  code: ApiErrorCode,
  status: number,
  message: string,
  details?: ErrorDetail[],
): NextResponse {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export function jsonOk(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function adminErrorResponse(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return jsonError(error.code, error.status, error.code);
  }
  console.error("Admin route failed:", error);
  return jsonError("INTERNAL", STATUS_BY_CODE.INTERNAL, "Terjadi kesalahan internal.");
}
