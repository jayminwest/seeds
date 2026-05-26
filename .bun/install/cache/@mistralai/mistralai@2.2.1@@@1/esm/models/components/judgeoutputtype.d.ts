import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const JudgeOutputType: {
    readonly Regression: "REGRESSION";
    readonly Classification: "CLASSIFICATION";
};
export type JudgeOutputType = ClosedEnum<typeof JudgeOutputType>;
/** @internal */
export declare const JudgeOutputType$outboundSchema: z.ZodEnum<typeof JudgeOutputType>;
//# sourceMappingURL=judgeoutputtype.d.ts.map