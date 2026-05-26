import { Command as $Command } from "@smithy/core/client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  AssumeRoleWithWebIdentityRequest,
  AssumeRoleWithWebIdentityResponse,
} from "../models/models_0";
import {
  ServiceInputTypes,
  ServiceOutputTypes,
  STSClientResolvedConfig,
} from "../STSClient";
export { __MetadataBearer };
export { $Command };
export interface AssumeRoleWithWebIdentityCommandInput
  extends AssumeRoleWithWebIdentityRequest {}
export interface AssumeRoleWithWebIdentityCommandOutput
  extends AssumeRoleWithWebIdentityResponse,
    __MetadataBearer {}
declare const AssumeRoleWithWebIdentityCommand_base: {
  new (
    input: AssumeRoleWithWebIdentityCommandInput
  ): import("@smithy/core/client").CommandImpl<
    AssumeRoleWithWebIdentityCommandInput,
    AssumeRoleWithWebIdentityCommandOutput,
    STSClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AssumeRoleWithWebIdentityCommandInput
  ): import("@smithy/core/client").CommandImpl<
    AssumeRoleWithWebIdentityCommandInput,
    AssumeRoleWithWebIdentityCommandOutput,
    STSClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): {
    [x: string]: unknown;
  };
};
export declare class AssumeRoleWithWebIdentityCommand extends AssumeRoleWithWebIdentityCommand_base {
  protected static __types: {
    api: {
      input: AssumeRoleWithWebIdentityRequest;
      output: AssumeRoleWithWebIdentityResponse;
    };
    sdk: {
      input: AssumeRoleWithWebIdentityCommandInput;
      output: AssumeRoleWithWebIdentityCommandOutput;
    };
  };
}
