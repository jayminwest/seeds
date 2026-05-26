import { Command as $Command } from "@smithy/core/client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  GetRoleCredentialsRequest,
  GetRoleCredentialsResponse,
} from "../models/models_0";
import { SSOClientResolvedConfig } from "../SSOClient";
export { __MetadataBearer };
export { $Command };
export interface GetRoleCredentialsCommandInput
  extends GetRoleCredentialsRequest {}
export interface GetRoleCredentialsCommandOutput
  extends GetRoleCredentialsResponse,
    __MetadataBearer {}
declare const GetRoleCredentialsCommand_base: {
  new (
    input: GetRoleCredentialsCommandInput
  ): import("@smithy/core/client").CommandImpl<
    GetRoleCredentialsCommandInput,
    GetRoleCredentialsCommandOutput,
    SSOClientResolvedConfig,
    GetRoleCredentialsCommandInput,
    GetRoleCredentialsCommandOutput
  >;
  new (
    input: GetRoleCredentialsCommandInput
  ): import("@smithy/core/client").CommandImpl<
    GetRoleCredentialsCommandInput,
    GetRoleCredentialsCommandOutput,
    SSOClientResolvedConfig,
    GetRoleCredentialsCommandInput,
    GetRoleCredentialsCommandOutput
  >;
  getEndpointParameterInstructions(): {
    [x: string]: unknown;
  };
};
export declare class GetRoleCredentialsCommand extends GetRoleCredentialsCommand_base {
  protected static __types: {
    api: {
      input: GetRoleCredentialsRequest;
      output: GetRoleCredentialsResponse;
    };
    sdk: {
      input: GetRoleCredentialsCommandInput;
      output: GetRoleCredentialsCommandOutput;
    };
  };
}
