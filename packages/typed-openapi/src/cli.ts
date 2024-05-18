import SwaggerParser from "@apidevtools/swagger-parser";
import { cac } from "cac";
import type { OpenAPIObject } from "openapi3-ts/oas31";
import { join } from "pathe";
import { z } from "zod";

import { writeFile } from "fs/promises";
import { name, version } from "../package.json";
import { allowedRuntimes, generateFile } from "./generator";
import { mapOpenApiEndpoints } from "./map-openapi-endpoints";

const cwd = process.cwd();
const cli = cac(name);
const now = new Date();

const optionsSchema = z.object({ output: z.string().optional(), runtime: allowedRuntimes });

cli
  .command("<input>", "Generate")
  .option("-o, --output <path>", "Output path for the api client ts file (defaults to `<input>.<runtime>.ts`)")
  .option(
    "-r, --runtime <name>",
    `Runtime to use for validation; defaults to \`none\`; available: ${allowedRuntimes.options}`,
    { default: "none" },
  )
  .action(async (input, _options) => {
    // console.log(_options);
    // console.log(allowedRuntimes.options);
    const { success, data: options, error } = optionsSchema.safeParse(_options);
    if (!success) {
      const errors = error.format();
      console.error(errors);
      process.exit(1);
    }

    const openApiDoc = (await SwaggerParser.bundle(input)) as OpenAPIObject;

    const ctx = mapOpenApiEndpoints(openApiDoc);
    console.log(`Found ${ctx.endpointList.length} endpoints`);

    const content = generateFile({ ...ctx, runtime: options.runtime });
    const output = join(
      cwd,
      options.output ?? input + `.${options.runtime === "none" ? "client" : options.runtime}.ts`,
    );

    console.log("Generating...", output);
    await writeFile(output, content);
    console.log(`Done in ${new Date().getTime() - now.getTime()}ms !`);
  });

cli.help();
cli.version(version);
cli.parse();
