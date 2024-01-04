import { builders, namedTypes } from "ast-types";
import { classProperty, findConstructor } from "./ast";

export function buildNestFileInterceptorCaller(
  entityFiles: namedTypes.Identifier,
  entityName: namedTypes.StringLiteral,
) {
  return builders.callExpression(builders.identifier("FileFieldsInterceptor"), [
    builders.callExpression(builders.identifier("generateUploadFields"), [
      entityFiles,
    ]),
    builders.callExpression(builders.identifier("generateMulterOptions"), [
      entityName,
    ]),
  ]);
}

export function buildNestFileInterceptorDecorator(
  entityFiles: namedTypes.Identifier,
  entityName: namedTypes.StringLiteral,
): namedTypes.Decorator {
  return builders.decorator(
    builders.callExpression(
      builders.memberExpression(
        builders.identifier("common"),
        builders.identifier("UseInterceptors"),
      ),
      [buildNestFileInterceptorCaller(entityFiles, entityName)],
    ),
  );
}

// export function buildNessJsInterceptorDecorator(
//   identifier: namedTypes.Identifier,
// ): namedTypes.Decorator {
//   return builders.decorator(
//     builders.callExpression(
//       builders.memberExpression(
//         builders.identifier("common"),
//         builders.identifier("UseInterceptors"),
//       ),
//       [builders.identifier(identifier.name)],
//     ),
//   );
// }

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

export function buildNestJsonControllerBody() {
  return [
    builders.variableDeclaration("const", [
      builders.variableDeclarator(
        builders.identifier("modifiedJSON"),
        builders.callExpression(
          builders.memberExpression(
            builders.identifier("JSON"),
            builders.identifier("parse"),
          ),
          [
            builders.tsAsExpression(
              builders.identifier("data.roles"),
              builders.tsStringKeyword(),
            ),
          ],
        ),
      ),
    ]),
    builders.expressionStatement(
      builders.assignmentExpression(
        "=",
        builders.memberExpression(
          builders.identifier("data"),
          builders.identifier("roles"),
        ),
        builders.identifier("modifiedJSON"),
      ),
    ),
  ];
}

export function buildNestFileToJsonControllerBody() {
  // const modifiedJSON = JSON.parse(data.roles as string);

  // data.roles = modifiedJSON;

  //  builders.expressionStatement(
  //   builders.assignmentExpression(
  //     "=",
  //     builders.memberExpression(
  //       builders.identifier("data"),
  //       builders.identifier("roles"),
  //     ),
  //     builders.identifier("modifiedJSON"),
  //   ),
  // );

  // builders.variableDeclaration("const", [
  //   builders.variableDeclarator(
  //     builders.identifier("modifiedJSON"),
  //     builders.callExpression(
  //       builders.memberExpression(
  //         builders.identifier("JSON"),
  //         builders.identifier("parse"),
  //       ),
  //       [
  //         builders.tsAsExpression(
  //           builders.identifier("data.roles"),
  //           builders.tsStringKeyword(),
  //         ),
  //       ],
  //     ),
  //   ),
  // ]);

  return [
    // fileToJSON<UserCreateInput>(data, userFiles, files);
    builders.expressionStatement(
      builders.callExpression.from({
        arguments: [
          builders.identifier("data"),
          builders.identifier("userFiles"),
          builders.identifier("files"),
        ],
        callee: builders.identifier("fileToJSON"),
        // typeArguments: [
        //   builders.tsTypeReference(builders.identifier("UserCreateInput")),
        // ],
      }),
    ),
  ];
}

// ---- Not needed for the snippet ----

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
