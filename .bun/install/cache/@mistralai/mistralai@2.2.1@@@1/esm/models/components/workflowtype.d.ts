import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const WorkflowType: {
    readonly Code: "code";
};
export type WorkflowType = ClosedEnum<typeof WorkflowType>;
/** @internal */
export declare const WorkflowType$inboundSchema: z.ZodEnum<typeof WorkflowType>;
//# sourceMappingURL=workflowtype.d.ts.map