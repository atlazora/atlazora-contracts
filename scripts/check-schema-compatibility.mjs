import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function load(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function jsonEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function typeSet(value) {
  if (value === undefined) return null;
  return new Set(Array.isArray(value) ? value : [value]);
}

function compareSchema(base, revision, location = "$") {
  const problems = [];

  const baseTypes = typeSet(base.type);
  const revisionTypes = typeSet(revision.type);

  if (baseTypes === null && revisionTypes !== null) {
    problems.push(`${location}: type constraint added`);
  } else if (baseTypes !== null && revisionTypes !== null) {
    for (const oldType of baseTypes) {
      if (!revisionTypes.has(oldType)) {
        problems.push(`${location}: previously allowed type removed: ${oldType}`);
      }
    }
  }

  if (!hasOwn(base, "enum") && hasOwn(revision, "enum")) {
    problems.push(`${location}: enum constraint added`);
  } else if (hasOwn(base, "enum") && hasOwn(revision, "enum")) {
    for (const oldValue of base.enum) {
      if (!revision.enum.some((value) => jsonEqual(value, oldValue))) {
        problems.push(`${location}: previously allowed enum value removed: ${JSON.stringify(oldValue)}`);
      }
    }
  }

  if (hasOwn(revision, "const")) {
    if (!hasOwn(base, "const")) {
      problems.push(`${location}: const constraint added`);
    } else if (!jsonEqual(base.const, revision.const)) {
      problems.push(`${location}: const constraint changed`);
    }
  }

  const lowerBounds = ["minimum", "exclusiveMinimum", "minLength", "minItems", "minProperties"];

  for (const keyword of lowerBounds) {
    if (hasOwn(revision, keyword)) {
      if (!hasOwn(base, keyword)) {
        problems.push(`${location}: ${keyword} constraint added`);
      } else if (revision[keyword] > base[keyword]) {
        problems.push(`${location}: ${keyword} tightened from ${base[keyword]} to ${revision[keyword]}`);
      }
    }
  }

  const upperBounds = ["maximum", "exclusiveMaximum", "maxLength", "maxItems", "maxProperties"];

  for (const keyword of upperBounds) {
    if (hasOwn(revision, keyword)) {
      if (!hasOwn(base, keyword)) {
        problems.push(`${location}: ${keyword} constraint added`);
      } else if (revision[keyword] < base[keyword]) {
        problems.push(`${location}: ${keyword} tightened from ${base[keyword]} to ${revision[keyword]}`);
      }
    }
  }

  for (const keyword of ["pattern", "format"]) {
    if (hasOwn(revision, keyword)) {
      if (!hasOwn(base, keyword)) {
        problems.push(`${location}: ${keyword} constraint added`);
      } else if (!jsonEqual(base[keyword], revision[keyword])) {
        problems.push(`${location}: ${keyword} constraint changed`);
      }
    }
  }

  const baseRequired = new Set(base.required ?? []);
  const revisionRequired = new Set(revision.required ?? []);

  for (const property of revisionRequired) {
    if (!baseRequired.has(property)) {
      problems.push(`${location}: new required property: ${property}`);
    }
  }

  const baseProperties = base.properties ?? {};
  const revisionProperties = revision.properties ?? {};

  for (const property of Object.keys(baseProperties)) {
    if (!hasOwn(revisionProperties, property)) {
      problems.push(`${location}: property removed: ${property}`);
      continue;
    }

    problems.push(
      ...compareSchema(
        baseProperties[property],
        revisionProperties[property],
        `${location}.properties.${property}`
      )
    );
  }

  const baseAdditional = base.additionalProperties;
  const revisionAdditional = revision.additionalProperties;

  if (baseAdditional !== false && revisionAdditional === false) {
    problems.push(`${location}: additionalProperties changed from allowed to forbidden`);
  } else if (
    baseAdditional &&
    typeof baseAdditional === "object" &&
    revisionAdditional &&
    typeof revisionAdditional === "object"
  ) {
    problems.push(
      ...compareSchema(
        baseAdditional,
        revisionAdditional,
        `${location}.additionalProperties`
      )
    );
  } else if (
    (baseAdditional === true || baseAdditional === undefined) &&
    revisionAdditional &&
    typeof revisionAdditional === "object"
  ) {
    problems.push(`${location}: additionalProperties schema constraint added`);
  }

  const baseDefs = base.$defs ?? {};
  const revisionDefs = revision.$defs ?? {};

  for (const definition of Object.keys(baseDefs)) {
    if (!hasOwn(revisionDefs, definition)) {
      problems.push(`${location}: $defs entry removed: ${definition}`);
      continue;
    }

    problems.push(
      ...compareSchema(
        baseDefs[definition],
        revisionDefs[definition],
        `${location}.$defs.${definition}`
      )
    );
  }

  return problems;
}

function assertCompatible(basePath, revisionPath) {
  const problems = compareSchema(load(basePath), load(revisionPath));

  if (problems.length > 0) {
    throw new Error(`Expected compatible schema, found breaking changes:\n${problems.join("\n")}`);
  }
}

function assertBreaking(label, basePath, revisionPath) {
  const problems = compareSchema(load(basePath), load(revisionPath));

  if (problems.length === 0) {
    throw new Error(`Expected breaking schema fixture was accepted: ${revisionPath}`);
  }

  console.log(`SCHEMA_BREAKING_${label}=REJECTED`);
}

const base = "tests/fixtures/compatible/schema-base.json";

assertCompatible(base, "tests/fixtures/compatible/schema-compatible.json");
console.log("SCHEMA_COMPATIBLE_FIXTURE=PASS");

const breakingCases = [
  ["TYPE_CHANGE", "tests/fixtures/breaking/schema-type-change.json"],
  ["NEW_REQUIRED", "tests/fixtures/breaking/schema-new-required.json"],
  ["ENUM_NARROWING", "tests/fixtures/breaking/schema-enum-narrowing.json"],
  ["CONSTRAINT_TIGHTENING", "tests/fixtures/breaking/schema-constraint-tightening.json"],
  ["PROPERTY_REMOVAL", "tests/fixtures/breaking/schema-property-removal.json"]
];

for (const [label, revision] of breakingCases) {
  assertBreaking(label, base, revision);
}

console.log("SCHEMA_COMPATIBILITY_CHECK=PASS");
