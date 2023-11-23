import { InputType, Field } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

@InputType()
// class UserWhereDownloadInput {
class ENTITY_DOWNLOAD_INPUT {
  @ApiProperty({
    required: true,
    type: String,
  })
  @IsString()
  @Field(() => String)
  fileName!: string;
}

export { ENTITY_DOWNLOAD_INPUT as ENTITY_DOWNLOAD_INPUT };
