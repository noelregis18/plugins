import { DsgContext, EnumDataType } from "@amplication/code-gen-types";

export const findEntitiesWithFileFields = (context: DsgContext) => {
  return context.entities?.filter((entity) =>
    entity.fields.some((field) => field.name.startsWith("file")),
  );
};
