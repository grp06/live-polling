import { NextResponse } from "next/server";

import { ensureAuthorized, handleRouteError, parseJson, requireAdminKey } from "@/app/api/_utils";
import { openPoll } from "@/lib/pollService";

type OpenPayload = {
  key: string;
  question: string;
  type: "slider" | "multiple_choice";
  options?: string[];
};

export async function POST(request: Request) {
  const adminKeyResult = requireAdminKey();
  if (!adminKeyResult.ok) {
    return adminKeyResult.response;
  }

  const bodyResult = await parseJson<OpenPayload>(request);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const unauthorized = ensureAuthorized(
    bodyResult.data?.key,
    adminKeyResult.adminKey
  );
  if (unauthorized) {
    return unauthorized;
  }

  const body = bodyResult.data;
  if (!body?.question || !body.question.trim()) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }
  if (body.type !== "slider" && body.type !== "multiple_choice") {
    return NextResponse.json(
      { error: "type must be slider or multiple_choice" },
      { status: 400 }
    );
  }
  if (body.type === "multiple_choice") {
    if (!Array.isArray(body.options)) {
      return NextResponse.json(
        { error: "options are required" },
        { status: 400 }
      );
    }
    if (!body.options.every((option) => typeof option === "string")) {
      return NextResponse.json(
        { error: "options must be strings" },
        { status: 400 }
      );
    }
  }

  try {
    const poll = await openPoll(body.question, body.type, body.options);
    return NextResponse.json(poll);
  } catch (error) {
    return handleRouteError("POST /api/admin/open failed", error);
  }
}
