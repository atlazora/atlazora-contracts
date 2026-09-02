import { spawnSync } from "node:child_process";

const moduleTarget = "github.com/oasdiff/oasdiff@v1.28.0";
const base = "tests/fixtures/compatible/openapi-base.yaml";
const compatible = "tests/fixtures/compatible/openapi-compatible.yaml";
const breaking = "tests/fixtures/breaking/openapi-breaking.yaml";

function run(revision) {
  return spawnSync(
    "go",
    [
      "run",
      moduleTarget,
      "breaking",
      base,
      revision,
      "--color",
      "never",
      "--fail-on",
      "ERR"
    ],
    { encoding: "utf8" }
  );
}

const compatibleResult = run(compatible);

if (compatibleResult.error) {
  console.error(compatibleResult.error);
  process.exit(1);
}

if (compatibleResult.status !== 0) {
  console.error(compatibleResult.stdout);
  console.error(compatibleResult.stderr);
  console.error("Compatible OpenAPI fixture was rejected.");
  process.exit(1);
}

console.log("OPENAPI_COMPATIBLE_FIXTURE=PASS");

const breakingResult = run(breaking);

if (breakingResult.error) {
  console.error(breakingResult.error);
  process.exit(1);
}

if (breakingResult.status === 0) {
  console.error("Breaking OpenAPI fixture was not detected.");
  process.exit(1);
}

const breakingOutput =
  `${breakingResult.stdout ?? ""}\n${breakingResult.stderr ?? ""}`;

if (!breakingOutput.trim()) {
  console.error("Breaking check failed without diagnostic output.");
  process.exit(1);
}

console.log("OPENAPI_BREAKING_FIXTURE=REJECTED");
console.log("OPENAPI_BREAKING_EXIT_NONZERO=PASS");
console.log("OPENAPI_COMPATIBILITY_CHECK=PASS");
