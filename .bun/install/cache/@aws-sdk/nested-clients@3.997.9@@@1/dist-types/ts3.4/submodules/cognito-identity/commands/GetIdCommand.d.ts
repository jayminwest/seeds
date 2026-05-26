import { Command as $Command } from "@smithy/core/client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityClient";
import { GetIdInput, GetIdResponse } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface GetIdCommandInput extends GetIdInput {}
export interface GetIdCommandOutput extends GetIdResponse, __MetadataBearer {}
declare const GetIdCommand_base: {
  new (input: GetIdCommandInput): import("@smithy/core/client").CommandImpl<
    GetIdCommandInput,
    GetIdCommandOutput,
    CognitoIdentityClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (input: GetIdCommandInput): import("@smithy/core/client").CommandImpl<
    GetIdCommandInput,
    GetIdCommandOutput,
    CognitoIdentityClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): {
    [x: string]: unknown;
  };
};
export declare class GetIdCommand extends GetIdCommand_base {
  protected static __types: {
    api: {
      input: GetIdInput;
      output: GetIdResponse;
    };
    sdk: {
      input: GetIdCommandInput;
      output: GetIdCommandOutput;
    };
  };
}
