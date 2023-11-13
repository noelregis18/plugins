import type {
  AmplicationPlugin,
  CreateAdminUIParams,
  CreateDTOsParams,
  CreateServerDotEnvParams,
  CreateServerPackageJsonParams,
  CreateServerParams,
  DsgContext,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import { EnumDataType, EventNames } from "@amplication/code-gen-types";
import { after, merge } from "lodash";
import { resolve } from "path";
import { envVariables } from "./constants";
import fs from 'fs';
import path from 'path';

class ExamplePlugin implements AmplicationPlugin {
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
        // before: this.beforeCreateDTOs,
        // after: this.afterCreateDTOs,
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
this.verifyEntitiesWithFileFields(context);
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
    return modules; // You must return the generated modules you want to generate at this part of the build.
  }

  beforeCreateServerPackageJson(
    context: DsgContext,
    eventParams: CreateServerPackageJsonParams,
  ) {
    const myValues = {
      dependencies: {
        "graphql-upload": "^13.0.0",
      },
      devDependencies: {
        "@types/graphql-upload": "^8.0.12",
        "@types/multer": "^1.4.8",
      },
    };

    eventParams.updateProperties.forEach((updateProperty) =>
      merge(updateProperty, myValues),
    );

    return eventParams;
  }

  verifyEntitiesWithFileFields(context: DsgContext) {
    return context.entities?.filter((entity) =>
      entity.fields.some((field) => field.name.startsWith("file")),
    );
  }

  findEntityFileFields(context: DsgContext) {
    const generateErrorMessage = (entityName: string, fieldName: string) =>
    `DataType of field: ${fieldName} should be JSON on entity: ${entityName}. As you've prefixed it with "file..." it should be a JSON field to store the file metadata else you can use any other prefix.`;

  context.entities?.forEach(({ name: entityName, fields }) => {
    debugger;

    const findInvalidFileType = fields.find(
      ({ name, dataType }) =>
        name.startsWith("file") && dataType !== EnumDataType.Json,
    );

    if (findInvalidFileType) {
      context.logger.error(
        generateErrorMessage(entityName, findInvalidFileType.name),
      );
      throw new Error(
        generateErrorMessage(entityName, findInvalidFileType.name),
      );
    }
  });
  }

  beforeCreateDTOs(context: DsgContext, eventParams: CreateDTOsParams) {
    // context.logger.warn("beforeCreateDTOs", {DTOS: eventParams.dtos});
    const { dtos } = eventParams;
    // iterate through this dtso
    // find the entity that has file field
    // add the file field to the dto

    context.logger.warn("beforeCreateDTOs", { dtos: dtos[0] });
    
    return eventParams;
  }

  // async afterCreateDTOs(
  //   context: DsgContext,
  //   eventParams: CreateDTOsParams,
  //   modules: ModuleMap,
  // ) {

  //   context.entities?.forEach(({ name: entityName, fields }) => {

  //     context.logger.warn('afterCreateDTOs', {DTO: eventParams.dtos[entityName].updateInput.})


      
  //   }
  //   );
  //   return modules;
  // }
}

export default ExamplePlugin;
