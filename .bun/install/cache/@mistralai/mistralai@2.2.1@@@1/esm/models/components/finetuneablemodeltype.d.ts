import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const FineTuneableModelType: {
    readonly Completion: "completion";
    readonly Classifier: "classifier";
};
export type FineTuneableModelType = ClosedEnum<typeof FineTuneableModelType>;
/** @internal */
export declare const FineTuneableModelType$outboundSchema: z.ZodEnum<typeof FineTuneableModelType>;
//# sourceMappingURL=finetuneablemodeltype.d.ts.map