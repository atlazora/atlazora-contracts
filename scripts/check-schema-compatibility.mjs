import fs from "node:fs";

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function normalizeType(value) {
  if (value === undefined) return null;
  return Array.isArray(value) ? [...value].sort() : [value];
}

function sameArray(a, b) {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function checkNode(base, revision, path, issues) {
  const baseType = normalizeType(base.type);
  const revisionType = normalizeType(revision.type);

  if (!sameArray(baseType, revisionType)) {
    issues.push(`${path}: incompatible type change`);
  }

  if (Array.isArray(base.enum)) {
    if (!Array.isArray(revision.enum)) {
      issues.push(`${path}: enum removed or changed incompatibly`);
    } else {
      const revisionValues = new Set(revision.enum.map(value => JSON.stringify(value)));
      for (const value of base.enum) {
        if (!revisionValues.has(JSON.stringify(value))) {
          issues.push(`${path}: enum narrowing removed ${JSON.stringify(value)}`);
        }
      }
    }
  }

  const lowerBounds = ["minimum", "exclusiveMinimum", "minLength", "minItems", "minProperties"];
  for (const key of lowerBounds) {
    if (base[key] !== undefined && revision[key] !== undefined && revision[key] > base[key]) {
      issues.push(`${path}: ${key} tightened`);
    }
  }

  const upperBounds = ["maximum", "exclusiveMaximum", "maxLength", "maxItems", "maxProperties"];
  for (const key of upperBounds) {
    if (base[key] !== undefined && revision[key] !== undefined && revision[key] < base[key]) {
      issues.push(`${path}: ${key} tightened`);
    }
  }

  if (base.pattern !== undefined && revision.pattern !== base.pattern) {
    issues.push(`${path}: pattern changed conservatively`);
  }

  if (base.format !== undefined && revision.format !== base.format) {
    issues.push(`${path}: format changed conservatively`);
  }

  if (base.additionalProperties !== false && revision.additionalProperties === false) {
    issues.push(`${path}: additionalProperties tightened to false`);
  }

  const baseRequired = new Set(base.required ?? []);
  const revisionRequired = new Set(revision.required ?? []);

  for (const name of revisionRequired) {
    if (!baseRequired.has(name)) {
      issues.push(`${path}: new required property ${name}`);
    }
  }

  const baseProperties = base.properties ?? {};
  const revisionProperties = revision.properties ?? {};

  for (const [name, child] of Object.entries(baseProperties)) {
    if (!(name in revisionProperties)) {
      issues.push(`${path}: established property removed ${name}`);
      continue;
    }

    checkNode(
      child,
      revisionProperties[name],
      `${path}.properties.${name}`,
      issues
    );
  }

  const baseDefs = base.$defs ?? {};
  const revisionDefs = revision.$defs ?? {};

  for (const [name, child] of Object.entries(baseDefs)) {
    if (!(name in revisionDefs)) {
      issues.push(`${path}: established $defs entry removed ${name}`);
      continue;
    }

    checkNode(
      child,
      revisionDefs[name],
      `${path}.$defs.${name}`,
      issues
    );
  }
}

function compare(basePath, revisionPath) {
  const issues = [];
  checkNode(readJson(basePath), readJson(revisionPath), "$", issues);
  return issues;
}

const base = "tests/fixtures/compatible/schema-base.json";

const compatible = compare(
  base,
  "tests/fixtures/compatible/schema-compatible.json"
);

if (compatible.length !== 0) {
  console.error("Compatible schema fixture was rejected:");
  for (const issue of compatible) console.error(issue);
  process.exit(1);
}

console.log("SCHEMA_COMPATIBLE_FIXTURE=PASS");

const breakingCases = [
  ["TYPE_CHANGE", "tests/fixtures/breaking/schema-type-change.json"],
  ["NEW_REQUIRED", "tests/fixtures/breaking/schema-new-required.json"],
  ["ENUM_NARROWING", "tests/fixtures/breaking/schema-enum-narrowing.json"],
  ["CONSTRAINT_TIGHTENING", "tests/fixtures/breaking/schema-constraint-tightening.json"]
];

for (const [name, path] of breakingCases) {
  const issues = compare(base, path);

  if (issues.length === 0) {
    console.error(`Breaking schema fixture was not detected: ${name}`);
    process.exit(1);
  }

  console.log(`SCHEMA_BREAKING_${name}=REJECTED`);
}

console.log("SCHEMA_COMPATIBILITY_CHECK=PASS");
