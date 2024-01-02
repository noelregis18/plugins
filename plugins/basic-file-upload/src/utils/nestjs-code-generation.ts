import { builders, namedTypes } from "ast-types";
import { classProperty, findConstructor } from "./ast";

export function buildNestJsFileInterceptorDecorator(
  entityFiles: namedTypes.Identifier,
  entityName: namedTypes.StringLiteral,
): namedTypes.Decorator {
  return builders.decorator(
    builders.callExpression(
      builders.memberExpression(
        builders.identifier("common"),
        builders.identifier("UseInterceptors"),
      ),
      [
        builders.callExpression(builders.identifier("FileFieldsInterceptor"), [
          builders.callExpression(builders.identifier("generateUploadFields"), [
            entityFiles,
          ]),
          builders.callExpression(
            builders.identifier("generateMulterOptions"),
            [entityName],
          ),
        ]),
      ],
    ),
  );
}

export function buildNessJsInterceptorDecorator(
  identifier: namedTypes.Identifier,
): namedTypes.Decorator {
  return builders.decorator(
    builders.callExpression(
      builders.memberExpression(
        builders.identifier("common"),
        builders.identifier("UseInterceptors"),
      ),
      [builders.identifier(identifier.name)],
    ),
  );
}

export function buildSwaggerMultipartFormData(): namedTypes.Decorator {
  return builders.decorator(
    builders.callExpression(
      builders.memberExpression(
        builders.identifier("swagger"),
        builders.identifier("ApiConsumes"),
      ),
      [builders.stringLiteral("multipart/form-data")],
    ),
  );
}

export function buildNestCreateFilesParameter() {
  //   (@common.UploadedFiles() files: { [key in UserFilesType]?: Express.Multer.File[]; })

  const createFilesProp = builders.tsParameterProperty.from({
    parameter: builders.identifier.from({
      name: "files",
      typeAnnotation: builders.tsTypeAnnotation(
        builders.tsMappedType.from({
          optional: true,
          typeParameter: builders.tsTypeParameter(
            "key",
            builders.tsTypeReference(builders.identifier("UserFilesType")),
          ),
          typeAnnotation: builders.tsArrayType(
            builders.tsTypeReference(
              builders.tsQualifiedName(
                builders.tsQualifiedName(
                  builders.identifier("Express"),
                  builders.identifier("Multer"),
                ),
                builders.identifier("File"),
              ),
            ),
          ),
        }),
      ),
    }),
  });

  //@ts-ignore
  createFilesProp.decorators = [
    builders.decorator(
      builders.callExpression(
        builders.memberExpression(
          builders.identifier("common"),
          builders.identifier("UploadedFiles"),
        ),
        [],
      ),
    ),
  ];

  return createFilesProp;
}

export function buildNestAccessControlDecorator(
  resource: string,
  action: string,
  possession: string,
): namedTypes.Decorator {
  return builders.decorator(
    builders.callExpression(
      builders.memberExpression(
        builders.identifier("nestAccessControl"),
        builders.identifier("UseRoles"),
      ),
      [
        builders.objectExpression([
          builders.objectProperty(
            builders.identifier("resource"),
            builders.stringLiteral(resource),
          ),
          builders.objectProperty(
            builders.identifier("action"),
            builders.stringLiteral(action),
          ),
          builders.objectProperty(
            builders.identifier("possession"),
            builders.stringLiteral(possession),
          ),
        ]),
      ],
    ),
  );
}

export function addInjectableDependency(
  classDeclaration: namedTypes.ClassDeclaration,
  name: string,
  typeId: namedTypes.Identifier,
  accessibility: "public" | "private" | "protected",
  decorators?: namedTypes.Decorator[],
): void {
  const constructor = findConstructor(classDeclaration);

  if (!constructor) {
    throw new Error("Could not find given class declaration constructor");
  }

  const propToInject = builders.tsParameterProperty.from({
    accessibility: accessibility,
    readonly: true,
    parameter: builders.identifier.from({
      name: name,
      typeAnnotation: builders.tsTypeAnnotation(
        builders.tsTypeReference(typeId),
      ),
    }),
  });

  //@ts-ignore
  propToInject.decorators = decorators;

  constructor.params.push(propToInject);
}
