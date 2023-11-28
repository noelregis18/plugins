import type {
  AmplicationPlugin,
  CreateAdminUIParams,
  CreateDTOsParams,
  CreateServerDotEnvParams,
  CreateServerMainParams,
  CreateServerPackageJsonParams,
  CreateServerParams,
  DsgContext,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import {
  formatCode,
  print,
  readFile,
  removeTSClassDeclares,
} from "@amplication/code-gen-utils";
import { EnumDataType, EventNames } from "@amplication/code-gen-types";
import { builders } from "ast-types";
import { after, merge } from "lodash";
import { join, resolve } from "path";
import {
  envVariables,
  generateInvalidFileFieldError,
  serverPackageJsonValues,
  templatesPath,
} from "./constants";
import { addImports, interpolate } from "./utils";

class BasicFileUploadPlugin implements AmplicationPlugin {
  /**
   * This is mandatory function that returns an object with the event name. Each event can have before or/and after
   */
  register(): Events {
    return {
      [EventNames.CreateServerDotEnv]: {
        before: this.beforeCreateServerDotEnv,
      },
      [EventNames.CreateServer]: {
        before: this.beforeCreateServer,
        after: this.afterCreateServer,
      },
      [EventNames.CreateServerPackageJson]: {
        before: this.beforeCreateServerPackageJson,
        // after: this.afterCreateServerPackageJson,
      },
      [EventNames.CreateDTOs]: {
        before: this.beforeCreateDTOs,
        // after: this.afterCreateDTOs,
      },
      [EventNames.CreateServerMain]: {
        after: this.afterCreateServerMain,
      },
    };
  }
  // You can combine many events in one plugin in order to change the related files.

  beforeCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams,
  ) {
    eventParams.envVariables = [...eventParams.envVariables, ...envVariables];

    return eventParams;
  }

  beforeCreateServer(context: DsgContext, eventParams: CreateServerParams) {
    // TODO: check if there aren't any file fields so that we can notify the user that the plugin is enabled but there are no file fields so either disable this plugin or add file fields
    context.entities?.forEach(({ name: entityName, fields }) => {
      const findInvalidFileType = fields.find(
        ({ name, dataType }) =>
          name.startsWith("file") && dataType !== EnumDataType.Json,
      );

      if (findInvalidFileType) {
        context.logger.error(
          generateInvalidFileFieldError(entityName, findInvalidFileType.name),
        );
        throw new Error(
          generateInvalidFileFieldError(entityName, findInvalidFileType.name),
        );
      }
    });
    return eventParams;
  }

  async afterCreateServer(
    context: DsgContext,
    eventParams: CreateServerParams,
    modules: ModuleMap,
  ): Promise<ModuleMap> {
    // Here you can get the context, eventParams and the modules that Amplication created.
    // Then you can manipulate the modules, add new ones, or create your own.
    const staticPath = resolve(__dirname, "./static");
    const staticsFiles = await context.utils.importStaticModules(
      staticPath,
      context.serverDirectories.srcDirectory + "/util",
    );
    await modules.merge(staticsFiles);

    // Independent Event
    const { entities } = context;

    // A map sort of all the entities which will store all the entities that have file fields
    const entitiesWithOnlyFileFields: { [key: string]: string[] } = {};
    entities?.forEach(({ name: entityName, fields }) => {
      fields.forEach(({ name: fieldName, dataType }) => {
        if (fieldName.startsWith("file")) {
          if (entitiesWithOnlyFileFields[entityName])
            entitiesWithOnlyFileFields[entityName].push(fieldName);
          else entitiesWithOnlyFileFields[entityName] = [fieldName];
        }
      });
    });

    // Add the EntityFileArgs files
    if (Object.keys(entitiesWithOnlyFileFields).length > 0) {
      Object.keys(entitiesWithOnlyFileFields).forEach(async (entityName) => {
        context.logger.info(`Creating ${entityName}FileArgs.ts file...`);
        const entityNameToLower = entityName.toLowerCase();
        const template = await readFile(
          join(templatesPath, "entityFileArgs.template.ts"),
        );
        // const entityFileArgsImport = importNames(
        //   [builders.identifier(entityName)],
        //   `../${entityNameToLower}/${entityNameToLower}.entity`,
        // );
        // const entityFileArgsImport =

        interpolate(template, {
          ENTITY_FILES_ARRAY: builders.arrayExpression(
            entitiesWithOnlyFileFields[entityName].map((fieldName) =>
              builders.stringLiteral(fieldName),
            ),
          ),
          ENTITY_FILES: builders.identifier(`${entityNameToLower}Files`),
          ENTITY_FILES_TYPE: builders.identifier(
            `${entityNameToLower}FilesTypes`,
          ),
        });

        modules.set({
          code: print(template).code,
          path: `${context.serverDirectories.srcDirectory}/${entityNameToLower}/base/${entityName}FileArgs.ts`,
        });

        context.logger.info(`Created ${entityName}FileArgs.ts file...`);
      });
    }

    return modules; // You must return the generated modules you want to generate at this part of the build.
  }

  beforeCreateServerPackageJson(
    context: DsgContext,
    eventParams: CreateServerPackageJsonParams,
  ) {
    eventParams.updateProperties.push(serverPackageJsonValues);

    return eventParams;
  }

  beforeCreateDTOs(context: DsgContext, eventParams: CreateDTOsParams) {
    // context.logger.warn("beforeCreateDTOs", {DTOS: eventParams.dtos});
    const { dtos } = eventParams;
    // iterate through this dtso
    // find the entity that has file field
    // add the file field to the dto

    // context.logger.warn("beforeCreateDTOs", { dtos: dtos[0] });

    // context.logger.warn("olleh", {
    //   updateARgs: eventParams.dtos["User"],
    //   updateInput: eventParams.dtos["User"],
    // });
    // context.logger.warn("beforeCreateDTOs", {
    //   // createInput: eventParams.dtos["User"].createInput,
    //   createInputArgs: eventParams.dtos["User"].create,
    // });

    return eventParams;
  }

  async afterCreateDTOs(
    context: DsgContext,
    eventParams: CreateDTOsParams,
    modules: ModuleMap,
  ) {
    // context.logger.warn("olleh", {
    //   updateARgs: eventParams.dtos["User"],
    //   updateInput: eventParams.dtos["User"],
    // });

    // context.entities?.forEach(({ name: entityName, fields }) => {

    //   context.logger.warn('afterCreateDTOs', {DTO: eventParams.dtos[entityName].updateInput.})

    // }
    // );
    return modules;
  }

  async afterCreateServerMain(
    context: DsgContext,
    eventPararms: CreateServerMainParams,
    modules: ModuleMap,
  ): Promise<ModuleMap> {
    const mainFilePath = join(
      context.serverDirectories.srcDirectory,
      "main.ts",
    );

    const mainModule = modules.get(mainFilePath);

    const lines = mainModule.code.split("\n");
    const insertIndex = lines.findIndex((line) =>
      line.includes("connectMicroservices(app)"),
    );

    const graphQlImportStatement = builders.importDeclaration(
      [builders.importSpecifier(builders.identifier("graphqlUploadExpress"))],
      builders.stringLiteral("graphql-upload"),
    );

    // Add the import statement to the module
    const graphQlImportStatementString = print(graphQlImportStatement).code;
    const indexOfLastImport = lines.findIndex((line) =>
      line.includes("import"),
    );
    lines.splice(indexOfLastImport + 1, 0, graphQlImportStatementString);

    // Make the above statement using builders
    const graphQlConfigStatement = builders.expressionStatement(
      builders.callExpression(
        builders.memberExpression(
          builders.identifier("app"),
          builders.identifier("use"),
        ),
        [
          builders.stringLiteral("/graphql"),
          builders.callExpression(builders.identifier("graphqlUploadExpress"), [
            builders.objectExpression([
              builders.objectProperty(
                builders.identifier("maxFileSize"),
                builders.numericLiteral(10000000),
              ),
              builders.objectProperty(
                builders.identifier("maxFiles"),
                builders.numericLiteral(10),
              ),
            ]),
          ]),
        ],
      ),
    );

    // convert the statment with string
    const graphQlConfigStatementString = print(graphQlConfigStatement).code;

    // add a line after the above  insertIndex
    lines.splice(insertIndex + 1, 0, graphQlConfigStatementString);
    context.logger.warn("afterCreateServerMain", {
      code: lines.join("\n"),
      modules: modules,
    });

    await modules.set({
      code: lines.join("\n"),
      path: mainFilePath,
    });

    await modules.replaceModulesCode((path, code) => formatCode(path, code));

    return modules;
  }
}

export default BasicFileUploadPlugin;
