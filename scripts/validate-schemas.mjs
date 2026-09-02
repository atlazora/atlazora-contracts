import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");

const ajv = new Ajv2020({
  strict: true,
  allErrors: true
});

addFormats(ajv);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

const schemas = {
  money: readJson("schemas/shared/v1/money.schema.json"),
  identifier: readJson("schemas/shared/v1/identifier.schema.json"),
  timestamp: readJson("schemas/shared/v1/timestamp.schema.json")
};

const validators = {
  money: ajv.compile(schemas.money),
  identifier: ajv.compile(schemas.identifier),
  timestamp: ajv.compile(schemas.timestamp)
};

const positiveCases = [
  ["money", "tests/fixtures/valid/money.json"],
  ["identifier", "tests/fixtures/valid/identifier.json"],
  ["timestamp", "tests/fixtures/valid/timestamp.json"]
];

const negativeCases = [
  ["money", "tests/fixtures/invalid/money-number-amount.json"],
  ["money", "tests/fixtures/invalid/money-lowercase-currency.json"],
  ["identifier", "tests/fixtures/invalid/identifier-uuidv4.json"],
  ["timestamp", "tests/fixtures/invalid/timestamp-offset.json"]
];

let failures = 0;

for (const [schemaName, fixturePath] of positiveCases) {
  const validate = validators[schemaName];
  const data = readJson(fixturePath);

  if (!validate(data)) {
    failures += 1;
    console.error("EXPECTED_VALID_FAILED=" + fixturePath);
    console.error(JSON.stringify(validate.errors, null, 2));
  } else {
    console.log("EXPECTED_VALID_PASS=" + fixturePath);
  }
}

for (const [schemaName, fixturePath] of negativeCases) {
  const validate = validators[schemaName];
  const data = readJson(fixturePath);

  if (validate(data)) {
    failures += 1;
    console.error("EXPECTED_INVALID_PASSED=" + fixturePath);
  } else {
    console.log("EXPECTED_INVALID_REJECTED=" + fixturePath);
  }
}

if (failures !== 0) {
  console.error("SCHEMA_VALIDATION_FAILURES=" + failures);
  process.exit(1);
}

console.log("POSITIVE_FIXTURES=PASS");
console.log("NEGATIVE_FIXTURES=PASS");
console.log("SCHEMA_VALIDATION=PASS");
