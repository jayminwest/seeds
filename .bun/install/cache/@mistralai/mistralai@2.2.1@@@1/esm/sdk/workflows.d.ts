import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import * as operations from "../models/operations/index.js";
import { PageIterator } from "../types/operations.js";
import { Deployments } from "./deployments.js";
import { Executions } from "./executions.js";
import { Metrics } from "./metrics.js";
import { Runs } from "./runs.js";
import { Schedules } from "./schedules.js";
import { WorkflowsEvents } from "./workflowsevents.js";
export declare class Workflows extends ClientSDK {
    private _executions?;
    get executions(): Executions;
    private _metrics?;
    get metrics(): Metrics;
    private _runs?;
    get runs(): Runs;
    private _schedules?;
    get schedules(): Schedules;
    private _events?;
    get events(): WorkflowsEvents;
    private _deployments?;
    get deployments(): Deployments;
    /**
     * Get Workflows
     */
    getWorkflows(request?: operations.GetWorkflowsV1WorkflowsGetRequest | undefined, options?: RequestOptions): Promise<PageIterator<operations.GetWorkflowsV1WorkflowsGetResponse, {
        cursor: string;
    }>>;
    /**
     * Get Workflow Registrations
     */
    getWorkflowRegistrations(request?: operations.GetWorkflowRegistrationsV1WorkflowsRegistrationsGetRequest | undefined, options?: RequestOptions): Promise<components.WorkflowRegistrationListResponse>;
    /**
     * Execute Workflow
     */
    executeWorkflow(request: operations.ExecuteWorkflowV1WorkflowsWorkflowIdentifierExecutePostRequest, options?: RequestOptions): Promise<operations.ResponseExecuteWorkflowV1WorkflowsWorkflowIdentifierExecutePost>;
    /**
     * Execute Workflow Registration
     *
     * @deprecated method: This will be removed in a future release, please migrate away from it as soon as possible.
     */
    executeWorkflowRegistration(request: operations.ExecuteWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdExecutePostRequest, options?: RequestOptions): Promise<operations.ResponseExecuteWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdExecutePost>;
    /**
     * Get Workflow
     */
    getWorkflow(request: operations.GetWorkflowV1WorkflowsWorkflowIdentifierGetRequest, options?: RequestOptions): Promise<components.WorkflowGetResponse>;
    /**
     * Update Workflow
     */
    updateWorkflow(request: operations.UpdateWorkflowV1WorkflowsWorkflowIdentifierPutRequest, options?: RequestOptions): Promise<components.WorkflowUpdateResponse>;
    /**
     * Get Workflow Registration
     */
    getWorkflowRegistration(request: operations.GetWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdGetRequest, options?: RequestOptions): Promise<components.WorkflowRegistrationGetResponse>;
    /**
     * Archive Workflow
     */
    archiveWorkflow(request: operations.ArchiveWorkflowV1WorkflowsWorkflowIdentifierArchivePutRequest, options?: RequestOptions): Promise<components.WorkflowArchiveResponse>;
    /**
     * Unarchive Workflow
     */
    unarchiveWorkflow(request: operations.UnarchiveWorkflowV1WorkflowsWorkflowIdentifierUnarchivePutRequest, options?: RequestOptions): Promise<components.WorkflowUnarchiveResponse>;
}
//# sourceMappingURL=workflows.d.ts.map