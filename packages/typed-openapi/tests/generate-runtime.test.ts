import { describe, expect, test } from "vitest";
import SwaggerParser from "@apidevtools/swagger-parser";
import type { OpenAPIObject } from "openapi3-ts/oas31";
import { mapOpenApiEndpoints } from "../src/map-openapi-endpoints";
import { allowedRuntimes, generateFile } from "../src/generator";

const samples = ["petstore", "docker.openapi"];

samples.forEach((sample) => {
  describe(`generate-rutime-${sample}`, async () => {
    const filePath = `${__dirname}/samples/${sample}.yaml`;
    const openApiDoc = (await SwaggerParser.parse(filePath)) as OpenAPIObject;
    const ctx = mapOpenApiEndpoints(openApiDoc);

    allowedRuntimes.options.forEach((runtime) => {
      test(`generate ${runtime}`, () => {
        const tsRouter = generateFile({ ...ctx, runtime: runtime as any });
        const runtimeName = runtime === "none" ? "client" : runtime;
        expect(tsRouter).toMatchFileSnapshot(`./snapshots/${sample}.` + runtimeName + ".ts");
      });
    });
  });
});
