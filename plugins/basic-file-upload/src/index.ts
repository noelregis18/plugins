import type {
  AmplicationPlugin,
  CreateAdminUIParams,
  CreateDTOsParams,
  CreateEntityControllerBaseParams,
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
import { builders, namedTypes } from "ast-types";
import { after, merge } from "lodash";
import { join, resolve } from "path";
import {
  envVariables,
  generateInvalidFileFieldError,
  serverPackageJsonValues,
  templatesPath,
} from "./constants";
import {
  addAutoGenerationComment,
  addImports,
  addInjectableDependency,
  getClassDeclarationById,
  interpolate,
} from "./utils";
import {
  EnumTemplateType,
  controllerMethodsIdsActionPairs,
} from "./utils/create-method-id-action-entity-map";
import { setFileUploadFields } from "./utils/set-endpoint-permissions";

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
      [EventNames.CreateEntityControllerBase]: {
        before: this.beforeCreateEntityControllerBase,
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
    const { entities, logger, serverDirectories } = context;

    // Independent Event

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

    if (Object.keys(entitiesWithOnlyFileFields).length === 0) {
      context.logger.warn(
        "No file fields found. Either add file fields or disable the plugin",
      );
      // TODO? Throw error over here and stop the process?
      return modules;
    }

    // Add the EntityFileArgs files
    if (Object.keys(entitiesWithOnlyFileFields).length > 0) {
      Object.keys(entitiesWithOnlyFileFields).forEach(async (entityName) => {
        logger.info(`Creating ${entityName}FileArgs.ts file...`);
        const entityNameToLower = entityName.toLowerCase();
        const template = await readFile(
          join(templatesPath, "entityFileArgs.template.ts"),
        );
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

        const filePath = `${serverDirectories.srcDirectory}/${entityNameToLower}/base/${entityName}FileArgs.ts`;

        addAutoGenerationComment(template);

        modules.set({
          code: print(template).code,
          path: filePath,
        });

        logger.info(`Created ${entityName}FileArgs.ts file...`);
      });
    }

    // Add FileHelper.ts for common file utilities
    const fileUploadUtilPath = resolve(__dirname, "./static/utils");
    const fileUploadUtilFile = await context.utils.importStaticModules(
      fileUploadUtilPath,
      serverDirectories.srcDirectory + "/util",
    );
    await modules.merge(fileUploadUtilFile);

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

  beforeCreateEntityControllerBase(
    context: DsgContext,
    eventParams: CreateEntityControllerBaseParams,
  ) {
    const { templateMapping, entity, template, controllerBaseId } = eventParams;

    interpolate(template, templateMapping);

    const classDeclaration = getClassDeclarationById(
      template,
      controllerBaseId,
    );

    const fileFieldsInterceptorImport = builders.importDeclaration(
      [builders.importSpecifier(builders.identifier("FileFieldsInterceptor"))],
      builders.stringLiteral("@nestjs/platform-express"),
    );

    // const defaultAuthGuardImport = builders.importDeclaration(
    //   [builders.importSpecifier(builders.identifier("defaultAuthGuard"))],
    //   builders.stringLiteral("../../auth/defaultAuth.guard"),
    // );

    // const ignoreComment = builders.commentLine("// @ts-ignore", false);

    // if (!defaultAuthGuardImport.comments) {
    //   defaultAuthGuardImport.comments = [];
    // }

    // defaultAuthGuardImport.comments.push(ignoreComment);

    addImports(
      eventParams.template,
      [fileFieldsInterceptorImport].filter(
        (x) => x, //remove nulls and undefined
      ) as namedTypes.ImportDeclaration[],
    );

    const swaggerDecorator = builders.decorator(
      builders.callExpression(
        builders.memberExpression(
          builders.identifier("swagger"),
          builders.identifier("SWAGGER_API_AUTH_FUNCTION"),
        ),
        [],
      ),
    );

    const guardDecorator = builders.decorator(
      builders.callExpression(
        builders.memberExpression(
          builders.identifier("common"),
          builders.identifier("UseGuards"),
        ),
        [
          builders.memberExpression(
            builders.identifier("defaultAuthGuard"),
            builders.identifier("DefaultAuthGuard"),
          ),
          builders.memberExpression(
            builders.identifier("nestAccessControl"),
            builders.identifier("ACGuard"),
          ),
        ],
      ),
    );

    //@ts-ignore
    classDeclaration.decorators = [swaggerDecorator, guardDecorator];

    if (classDeclaration) {
      controllerMethodsIdsActionPairs(templateMapping, entity).forEach(
        ({ methodId, action, entity, permissionType, methodName }) => {
          setFileUploadFields();
          // setAuthPermissions(
          //   classDeclaration,
          //   methodId,
          //   action,
          //   entity.name,
          //   true,
          //   EnumTemplateType.ControllerBase,
          //   permissionType,
          //   methodName,
          // );
          // if (permissionType === EnumEntityPermissionType.Public) {
          //   const classMethod = getClassMethodById(classDeclaration, methodId);
          //   classMethod?.decorators?.push(buildSwaggerForbiddenResponse());
          // }
        },
      );
    }

    return eventParams;
  }
}

export default BasicFileUploadPlugin;
