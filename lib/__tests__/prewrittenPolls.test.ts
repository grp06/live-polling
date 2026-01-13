import { parsePrewrittenPolls } from "../prewrittenPolls";

describe("parsePrewrittenPolls", () => {
  it("parses presets and trims fields", () => {
    const raw = JSON.stringify([
      {
        id: "  energy ",
        type: "slider",
        question: "  How energized is the room? ",
      },
      {
        id: " topics ",
        type: "multiple_choice",
        question: " Pick one ",
        options: [" APIs ", " Testing ", " Infra "],
      },
    ]);

    const [slider, choice] = parsePrewrittenPolls(raw);

    expect(slider).toEqual({
      id: "energy",
      type: "slider",
      question: "How energized is the room?",
    });
    expect(choice).toEqual({
      id: "topics",
      type: "multiple_choice",
      question: "Pick one",
      options: ["APIs", "Testing", "Infra"],
    });
  });

  it("rejects non-array JSON", () => {
    expect(() => parsePrewrittenPolls("{}")).toThrow(
      "prewritten polls must be an array"
    );
  });

  it("rejects invalid poll types", () => {
    const raw = JSON.stringify([
      { id: "one", type: "ranked", question: "Nope" },
    ]);

    expect(() => parsePrewrittenPolls(raw)).toThrow("invalid poll type");
  });

  it("rejects missing or insufficient options for multiple choice", () => {
    const missing = JSON.stringify([
      { id: "one", type: "multiple_choice", question: "Pick" },
    ]);
    const tooFew = JSON.stringify([
      {
        id: "two",
        type: "multiple_choice",
        question: "Pick",
        options: ["Only"],
      },
    ]);

    expect(() => parsePrewrittenPolls(missing)).toThrow("options are required");
    expect(() => parsePrewrittenPolls(tooFew)).toThrow(
      "at least two options are required"
    );
  });

  it("rejects duplicate ids", () => {
    const raw = JSON.stringify([
      { id: "dup", type: "slider", question: "One" },
      { id: "dup", type: "slider", question: "Two" },
    ]);

    expect(() => parsePrewrittenPolls(raw)).toThrow("duplicate preset id");
  });
});
