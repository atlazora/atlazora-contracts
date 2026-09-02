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

const dollar = String.fromCharCode(36);
const idKey = dollar + "id";

const identifier = loadJson("schemas/shared/v1/identifier.schema.json");
const timestamp = loadJson("schemas/shared/v1/timestamp.schema.json");
const envelope = loadJson("schemas/events/v1/event-envelope.schema.json");

const identifierForValidation = { ...identifier };
identifierForValidation[idKey] = "https://validation.local/schemas/shared/v1/identifier.schema.json";

const timestampForValidation = { ...timestamp };
timestampForValidation[idKey] = "https://validation.local/schemas/shared/v1/timestamp.schema.json";

const envelopeForValidation = { ...envelope };
envelopeForValidation[idKey] = "https://validation.local/schemas/events/v1/event-envelope.schema.json";

ajv.addSchema(identifierForValidation);
ajv.addSchema(timestampForValidation);

const validateEnvelope = ajv.compile(envelopeForValidation);

const validFixtures = [
  "tests/fixtures/valid/event-envelope.json",
];

const invalidFixtures = [
  "tests/fixtures/invalid/event-envelope-uuidv4.json",
  "tests/fixtures/invalid/event-envelope-time-offset.json",
  "tests/fixtures/invalid/event-envelope-content-type.json",
  "tests/fixtures/invalid/event-envelope-missing-dataschema.json",
  "tests/fixtures/invalid/event-envelope-specversion.json",
];

for (const fixturePath of validFixtures) {
  const value = loadJson(fixturePath);

  if (!validateEnvelope(value)) {
    fail(`Expected valid event fixture to pass: ${fixturePath}`, validateEnvelope.errors);
  }

  console.log(`EXPECTED_EVENT_VALID_PASS=${fixturePath}`);
}

for (const fixturePath of invalidFixtures) {
  const value = loadJson(fixturePath);

  if (validateEnvelope(value)) {
    fail(`Expected invalid event fixture to be rejected: ${fixturePath}`);
  }

  console.log(`EXPECTED_EVENT_INVALID_REJECTED=${fixturePath}`);
}

console.log("EVENT_POSITIVE_FIXTURES=PASS");
console.log("EVENT_NEGATIVE_FIXTURES=PASS");
console.log("EVENT_SCHEMA_VALIDATION=PASS");
