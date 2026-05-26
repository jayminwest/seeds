import * as z from "zod/v4";
import { FTClassifierLossFunction } from "./ftclassifierlossfunction.js";
export type ClassifierTarget = {
    name: string;
    labels: Array<string>;
    weight?: number | undefined;
    lossFunction?: FTClassifierLossFunction | null | undefined;
};
/** @internal */
export type ClassifierTarget$Outbound = {
    name: string;
    labels: Array<string>;
    weight: number;
    loss_function?: string | null | undefined;
};
/** @internal */
export declare const ClassifierTarget$outboundSchema: z.ZodType<ClassifierTarget$Outbound, ClassifierTarget>;
export declare function classifierTargetToJSON(classifierTarget: ClassifierTarget): string;
//# sourceMappingURL=classifiertarget.d.ts.map