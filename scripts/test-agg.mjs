import assert from "node:assert/strict";
import pollService from "../lib/pollService.ts";

const { computeAggregates } = pollService;

const empty = computeAggregates({});
assert.equal(empty.count, 0);
assert.equal(empty.avg, null);
assert.equal(empty.histogram.length, 11);
assert.ok(empty.histogram.every((value) => value === 0));

const sample = computeAggregates({
  a: "0",
  b: "10",
  c: "5",
});
assert.equal(sample.count, 3);
assert.equal(sample.avg, 5.0);
assert.equal(sample.histogram[0], 1);
assert.equal(sample.histogram[5], 1);
assert.equal(sample.histogram[10], 1);
