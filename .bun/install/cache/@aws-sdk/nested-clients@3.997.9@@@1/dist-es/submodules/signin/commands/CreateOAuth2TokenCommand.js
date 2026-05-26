import { Command as $Command } from "@smithy/core/client";
import { getEndpointPlugin } from "@smithy/core/endpoints";
import { commonParams } from "../endpoint/EndpointParameters";
import { CreateOAuth2Token$ } from "../schemas/schemas_0";
export { $Command };
export class CreateOAuth2TokenCommand extends $Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("Signin", "CreateOAuth2Token", {})
    .n("SigninClient", "CreateOAuth2TokenCommand")
    .sc(CreateOAuth2Token$)
    .build() {
}
