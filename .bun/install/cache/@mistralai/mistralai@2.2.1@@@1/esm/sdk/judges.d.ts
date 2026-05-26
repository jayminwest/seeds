import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import * as operations from "../models/operations/index.js";
export declare class Judges extends ClientSDK {
    /**
     * Create a new judge
     */
    create(request: components.CreateJudgeRequest, options?: RequestOptions): Promise<components.Judge>;
    /**
     * Get judges with optional filtering and search
     */
    list(request?: operations.GetJudgesV1ObservabilityJudgesGetRequest | undefined, options?: RequestOptions): Promise<components.ListJudgesResponse>;
    /**
     * Get judge by id
     */
    fetch(request: operations.GetJudgeByIdV1ObservabilityJudgesJudgeIdGetRequest, options?: RequestOptions): Promise<components.Judge>;
    /**
     * Delete a judge
     */
    delete(request: operations.DeleteJudgeV1ObservabilityJudgesJudgeIdDeleteRequest, options?: RequestOptions): Promise<void>;
    /**
     * Update a judge
     */
    update(request: operations.UpdateJudgeV1ObservabilityJudgesJudgeIdPutRequest, options?: RequestOptions): Promise<void>;
    /**
     * Run a saved judge on a conversation
     */
    judgeConversation(request: operations.JudgeConversationV1ObservabilityJudgesJudgeIdLiveJudgingPostRequest, options?: RequestOptions): Promise<components.JudgeOutput>;
}
//# sourceMappingURL=judges.d.ts.map