import { NextResponse } from "next/server";

import { openPoll } from "@/lib/pollService";
import { ensureAuthorized, parseJson, requireAdminKey } from "../_utils";

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
    console.error("POST /api/admin/open failed", error);
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
