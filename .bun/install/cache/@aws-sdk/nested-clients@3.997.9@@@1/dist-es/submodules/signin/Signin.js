import { createAggregatedClient } from "@smithy/core/client";
import { CreateOAuth2TokenCommand, } from "./commands/CreateOAuth2TokenCommand";
import { SigninClient } from "./SigninClient";
const commands = {
    CreateOAuth2TokenCommand,
};
export class Signin extends SigninClient {
}
createAggregatedClient(commands, Signin);
