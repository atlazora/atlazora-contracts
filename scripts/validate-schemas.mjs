import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const ajv = new Ajv2020({
  strict: true,
  allErrors: true,
});

addFormats(ajv);

function loadJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function fail(message, errors = null) {
  console.error(message);
  if (errors) {
    console.error(JSON.stringify(errors, null, 2));
  }
  process.exit(1);
}

const schemas = {
  money: loadJson("schemas/shared/v1/money.schema.json"),
  identifier: loadJson("schemas/shared/v1/identifier.schema.json"),
  timestamp: loadJson("schemas/shared/v1/timestamp.schema.json"),
  problemDetails: loadJson("schemas/shared/v1/problem-details.schema.json"),
  pagination: loadJson("schemas/shared/v1/pagination.schema.json"),
};

const validators = {
  money: ajv.compile(schemas.money),
  identifier: ajv.compile(schemas.identifier),
  timestamp: ajv.compile(schemas.timestamp),
  problemDetails: ajv.compile(schemas.problemDetails),
  paginationCursor: ajv.compile({
    $schema: schemas.pagination.$schema,
    $defs: schemas.pagination.$defs,
    $ref: "#/$defs/cursor",
  }),
  paginationLimit: ajv.compile({
    $schema: schemas.pagination.$schema,
    $defs: schemas.pagination.$defs,
    $ref: "#/$defs/limit",
  }),
  paginationMetadata: ajv.compile({
    $schema: schemas.pagination.$schema,
    $defs: schemas.pagination.$defs,
    $ref: "#/$defs/metadata",
  }),
};

const validCases = [
  ["money", validators.money, "tests/fixtures/valid/money.json"],
  ["identifier", validators.identifier, "tests/fixtures/valid/identifier.json"],
  ["timestamp", validators.timestamp, "tests/fixtures/valid/timestamp.json"],
  ["problem-details", validators.problemDetails, "tests/fixtures/valid/problem-details.json"],
  ["pagination-metadata", validators.paginationMetadata, "tests/fixtures/valid/pagination-metadata.json"],
  ["pagination-cursor", validators.paginationCursor, "tests/fixtures/valid/pagination-cursor.json"],
  ["pagination-limit", validators.paginationLimit, "tests/fixtures/valid/pagination-limit.json"],
];

const invalidCases = [
  ["money-number-amount", validators.money, "tests/fixtures/invalid/money-number-amount.json"],
  ["money-lowercase-currency", validators.money, "tests/fixtures/invalid/money-lowercase-currency.json"],
  ["identifier-uuidv4", validators.identifier, "tests/fixtures/invalid/identifier-uuidv4.json"],
  ["timestamp-offset", validators.timestamp, "tests/fixtures/invalid/timestamp-offset.json"],
  ["problem-details-missing-code", validators.problemDetails, "tests/fixtures/invalid/problem-details-missing-code.json"],
  ["problem-details-invalid-status", validators.problemDetails, "tests/fixtures/invalid/problem-details-invalid-status.json"],
  ["pagination-metadata-missing-has-more", validators.paginationMetadata, "tests/fixtures/invalid/pagination-metadata-missing-has-more.json"],
  ["pagination-cursor-empty", validators.paginationCursor, "tests/fixtures/invalid/pagination-cursor-empty.json"],
  ["pagination-limit-zero", validators.paginationLimit, "tests/fixtures/invalid/pagination-limit-zero.json"],
];

for (const [, validate, fixturePath] of validCases) {
  const value = loadJson(fixturePath);

  if (!validate(value)) {
    fail(`Expected valid fixture to pass: ${fixturePath}`, validate.errors);
  }

  console.log(`EXPECTED_VALID_PASS=${fixturePath}`);
}

for (const [, validate, fixturePath] of invalidCases) {
  const value = loadJson(fixturePath);

  if (validate(value)) {
    fail(`Expected invalid fixture to be rejected: ${fixturePath}`);
  }

  console.log(`EXPECTED_INVALID_REJECTED=${fixturePath}`);
}

console.log("POSITIVE_FIXTURES=PASS");
console.log("NEGATIVE_FIXTURES=PASS");
console.log("PROBLEM_DETAILS_VALIDATION=PASS");
console.log("PAGINATION_VALIDATION=PASS");
console.log("SCHEMA_VALIDATION=PASS");
