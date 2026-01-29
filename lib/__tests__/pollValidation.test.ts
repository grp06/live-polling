import { normalizeOptions, requirePollType } from "../pollValidation";

describe("requirePollType", () => {
  it("returns slider when valid", () => {
    expect(requirePollType("slider", "invalid poll type")).toBe("slider");
  });

  it("returns multiple_choice when valid", () => {
    expect(requirePollType("multiple_choice", "invalid poll type")).toBe(
      "multiple_choice"
    );
  });

  it("throws provided error when invalid", () => {
    expect(() => requirePollType("bad", "invalid poll type")).toThrow(
      "invalid poll type"
    );
  });
});

describe("normalizeOptions", () => {
  const messages = {
    missing: "options are required",
    nonString: "options must be strings",
    minCount: "at least two options are required",
  };

  it("throws missing when options is not an array", () => {
    expect(() => normalizeOptions(null, messages)).toThrow(
      "options are required"
    );
  });

  it("throws nonString when options contain non-string", () => {
    expect(() => normalizeOptions(["A", 2], messages)).toThrow(
      "options must be strings"
    );
  });

  it("throws minCount when fewer than two options remain", () => {
    expect(() => normalizeOptions(["A", "  "], messages)).toThrow(
      "at least two options are required"
    );
  });

  it("returns trimmed options", () => {
    expect(normalizeOptions([" A ", "B"], messages)).toEqual(["A", "B"]);
  });
});
