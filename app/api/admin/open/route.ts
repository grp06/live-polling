import { NextResponse } from "next/server";

import { handleRouteError } from "@/app/api/_utils";
import { parseAdminJson } from "@/app/api/admin/adminRoute";
import { openPoll } from "@/lib/pollService";

type OpenPayload = {
  key: string;
  question: string;
  type: "slider" | "multiple_choice";
  options?: string[];
};

export async function POST(request: Request) {
  const parsed = await parseAdminJson<OpenPayload>(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const body = parsed.data;
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
