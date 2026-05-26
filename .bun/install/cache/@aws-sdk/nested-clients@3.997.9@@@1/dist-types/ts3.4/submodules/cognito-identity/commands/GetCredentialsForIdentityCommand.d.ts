import { Command as $Command } from "@smithy/core/client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityClient";
import {
  GetCredentialsForIdentityInput,
  GetCredentialsForIdentityResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface GetCredentialsForIdentityCommandInput
  extends GetCredentialsForIdentityInput {}
export interface GetCredentialsForIdentityCommandOutput
  extends GetCredentialsForIdentityResponse,
    __MetadataBearer {}
declare const GetCredentialsForIdentityCommand_base: {
  new (
    input: GetCredentialsForIdentityCommandInput
  ): import("@smithy/core/client").CommandImpl<
    GetCredentialsForIdentityCommandInput,
    GetCredentialsForIdentityCommandOutput,
    CognitoIdentityClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: GetCredentialsForIdentityCommandInput
  ): import("@smithy/core/client").CommandImpl<
    GetCredentialsForIdentityCommandInput,
    GetCredentialsForIdentityCommandOutput,
    CognitoIdentityClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): {
    [x: string]: unknown;
  };
};
export declare class GetCredentialsForIdentityCommand extends GetCredentialsForIdentityCommand_base {
  protected static __types: {
    api: {
      input: GetCredentialsForIdentityInput;
      output: GetCredentialsForIdentityResponse;
    };
    sdk: {
      input: GetCredentialsForIdentityCommandInput;
      output: GetCredentialsForIdentityCommandOutput;
    };
  };
}
