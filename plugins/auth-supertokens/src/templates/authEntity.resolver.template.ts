import * as graphql from "@nestjs/graphql";
import { AuthService } from "../auth/auth.service";

declare class ENTITY {}

declare interface SERVICE {}

declare const ENTITY_NAME: string;

declare class RESOLVER_BASE {
  protected readonly service: SERVICE;
  constructor(service: SERVICE);
}

@graphql.Resolver(() => ENTITY)
export class RESOLVER extends RESOLVER_BASE {
  constructor(protected readonly service: SERVICE, protected readonly authService: AuthService) {
    super(service);
  }
}
