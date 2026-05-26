import { ClientSDK } from "../lib/sdks.js";
import { BetaAgents } from "./betaagents.js";
import { Connectors } from "./connectors.js";
import { Conversations } from "./conversations.js";
import { Libraries } from "./libraries.js";
import { Observability } from "./observability.js";
import { Rag } from "./rag.js";
export declare class Beta extends ClientSDK {
    private _conversations?;
    get conversations(): Conversations;
    private _agents?;
    get agents(): BetaAgents;
    private _libraries?;
    get libraries(): Libraries;
    private _observability?;
    get observability(): Observability;
    private _connectors?;
    get connectors(): Connectors;
    private _rag?;
    get rag(): Rag;
}
//# sourceMappingURL=beta.d.ts.map