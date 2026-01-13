import assert from "node:assert/strict";
import pollService from "../lib/pollService.ts";

const { computeAggregates } = pollService;

const sliderPoll = {
  id: "poll-slider",
  question: "Slider",
  openedAt: "2026-01-01T00:00:00.000Z",
  type: "slider",
};

const empty = computeAggregates(sliderPoll, {});
assert.equal(empty.count, 0);
assert.equal(empty.avg, null);
assert.equal(empty.histogram.length, 11);
assert.ok(empty.histogram.every((value) => value === 0));

const sample = computeAggregates(sliderPoll, {
  a: "0",
  b: "10",
  c: "5",
});
assert.equal(sample.count, 3);
assert.equal(sample.avg, 5.0);
assert.equal(sample.histogram[0], 1);
assert.equal(sample.histogram[5], 1);
assert.equal(sample.histogram[10], 1);

const choicePoll = {
  id: "poll-choice",
  question: "Choice",
  openedAt: "2026-01-01T00:00:00.000Z",
  type: "multiple_choice",
  options: ["A", "B", "C"],
};

const choiceSample = computeAggregates(choicePoll, {
  a: "0",
  b: "1",
  c: "1",
});
assert.equal(choiceSample.count, 3);
assert.equal(choiceSample.avg, null);
assert.deepEqual(choiceSample.histogram, [1, 2, 0]);
