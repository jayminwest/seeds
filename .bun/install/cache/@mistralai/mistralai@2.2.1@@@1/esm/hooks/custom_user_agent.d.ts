import { BeforeRequestContext, BeforeRequestHook, Awaitable } from "./types.js";
export declare class CustomUserAgentHook implements BeforeRequestHook {
    beforeRequest(_: BeforeRequestContext, request: Request): Awaitable<Request>;
}
//# sourceMappingURL=custom_user_agent.d.ts.map