import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { z } from 'zod';

import * as requestSchemas from '../lib/api/request-validation';

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const apiDir = path.join(rootDir, 'app/api');
const contractPath = path.join(rootDir, 'docs/api-contract-v1.md');
const generatedStart = '<!-- API-CONTRACT-GENERATED:START -->';
const generatedEnd = '<!-- API-CONTRACT-GENERATED:END -->';

type RouteOperation = {
  method: string;
  path: string;
  bodySchema?: string;
  querySchema?: string;
};

function findRouteFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return findRouteFiles(entryPath);
    }

    return entry.name === 'route.ts' ? [entryPath] : [];
  });
}

function apiPathForRouteFile(filePath: string): string {
  const relativePath = path.relative(apiDir, path.dirname(filePath));
  const route = relativePath.split(path.sep).filter(Boolean).join('/');

  return route ? `/api/${route}` : '/api';
}

function schemaArgument(
  node: ts.CallExpression,
  methodName: 'readJsonBody' | 'readSearchParams'
): string | undefined {
  if (
    !ts.isIdentifier(node.expression) ||
    node.expression.text !== methodName
  ) {
    return undefined;
  }

  const schema = node.arguments[1];
  return schema && ts.isIdentifier(schema) ? schema.text : undefined;
}

function findOperationsInRoute(filePath: string): RouteOperation[] {
  const source = readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true
  );
  const routePath = apiPathForRouteFile(filePath);
  const operations: RouteOperation[] = [];

  for (const statement of sourceFile.statements) {
    if (
      !ts.isFunctionDeclaration(statement) ||
      !statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
      ) ||
      !statement.name ||
      !/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(statement.name.text)
    ) {
      continue;
    }

    const operation: RouteOperation = {
      method: statement.name.text,
      path: routePath,
    };

    function inspect(node: ts.Node) {
      if (ts.isCallExpression(node)) {
        const bodySchema = schemaArgument(node, 'readJsonBody');
        const querySchema = schemaArgument(node, 'readSearchParams');
        if (bodySchema) operation.bodySchema = bodySchema;
        if (querySchema) operation.querySchema = querySchema;

        const receiver = ts.isPropertyAccessExpression(node.expression)
          ? node.expression.expression
          : undefined;
        const directlyReadsBody =
          ts.isPropertyAccessExpression(node.expression) &&
          ['json', 'text'].includes(node.expression.name.text) &&
          receiver !== undefined &&
          ts.isIdentifier(receiver) &&
          ['req', 'request'].includes(receiver.text);
        const directlyReadsQuery =
          ts.isPropertyAccessExpression(node.expression) &&
          node.expression.name.text === 'get' &&
          receiver !== undefined &&
          ((ts.isIdentifier(receiver) && receiver.text === 'searchParams') ||
            (ts.isPropertyAccessExpression(receiver) &&
              receiver.name.text === 'searchParams'));

        if (directlyReadsBody || directlyReadsQuery) {
          throw new Error(
            `${path.relative(rootDir, filePath)} exports ${operation.method} with direct request parsing; use request-validation helpers`
          );
        }
      }

      ts.forEachChild(node, inspect);
    }

    if (statement.body) inspect(statement.body);
    operations.push(operation);
  }

  return operations;
}

function collectOperations(): RouteOperation[] {
  const operations = findRouteFiles(apiDir).flatMap(findOperationsInRoute);
  operations.sort(
    (a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method)
  );

  for (const operation of operations) {
    for (const schemaName of [operation.bodySchema, operation.querySchema]) {
      if (schemaName && !(schemaName in requestSchemas)) {
        throw new Error(
          `${operation.method} ${operation.path} references unknown schema ${schemaName}`
        );
      }
    }
  }

  return operations;
}

function getRequestSchema(schemaName: string): z.ZodType {
  const schema = requestSchemas[schemaName as keyof typeof requestSchemas];
  if (!(schema instanceof z.ZodType)) {
    throw new Error(`${schemaName} is not an exported Zod schema`);
  }

  return schema;
}

function renderGeneratedSection(operations: RouteOperation[]): string {
  const schemaNames = [
    ...new Set(
      operations.flatMap((operation) =>
        [operation.bodySchema, operation.querySchema].filter(
          (schemaName): schemaName is string => Boolean(schemaName)
        )
      )
    ),
  ].sort();

  const rows = operations.map(
    ({ method, path: routePath, bodySchema, querySchema }) =>
      `| ${method} | \`${routePath}\` | ${bodySchema ? `\`${bodySchema}\`` : '—'} | ${querySchema ? `\`${querySchema}\`` : '—'} |`
  );

  const schemas = schemaNames.map((schemaName) => {
    const jsonSchema = z.toJSONSchema(getRequestSchema(schemaName), {
      unrepresentable: 'any',
    });

    return [
      `<details>`,
      `<summary><code>${schemaName}</code></summary>`,
      '',
      '```json',
      JSON.stringify(jsonSchema, null, 2),
      '```',
      '',
      '</details>',
    ].join('\n');
  });

  return [
    generatedStart,
    '## Generated route and request-schema inventory',
    '',
    'Generated from `app/api/**/route.ts` handlers and the Zod schemas they use.',
    'Run `npm run api:contract` after changing routes or request schemas;',
    '`npm run api:contract:check` verifies this section and runs as part of',
    '`npm run verify`. Response examples and endpoint behavior remain documented',
    'manually above. Zod refinements may enforce additional runtime rules not',
    'expressible in JSON Schema.',
    '',
    '| Method | Route | JSON body schema | Query schema |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
    ...schemas,
    generatedEnd,
  ].join('\n');
}

function updateContract(mode: 'check' | 'write') {
  const contract = readFileSync(contractPath, 'utf8');
  const start = contract.indexOf(generatedStart);
  const end = contract.indexOf(generatedEnd);

  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      `Add ${generatedStart} and ${generatedEnd} markers to ${path.relative(rootDir, contractPath)}`
    );
  }

  const generated = renderGeneratedSection(collectOperations());
  const updated =
    contract.slice(0, start) +
    generated +
    contract.slice(end + generatedEnd.length);

  if (mode === 'write') {
    writeFileSync(contractPath, updated);
    console.log(`Updated ${path.relative(rootDir, contractPath)}`);
    return;
  }

  if (updated !== contract) {
    throw new Error(
      `${path.relative(rootDir, contractPath)} is out of date. Run npm run api:contract.`
    );
  }

  console.log('API contract route and request-schema inventory is up to date.');
}

const mode = process.argv[2];
if (mode !== '--check' && mode !== '--write') {
  throw new Error('Usage: tsx scripts/api-contract.ts --check|--write');
}

updateContract(mode === '--check' ? 'check' : 'write');
