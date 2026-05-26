import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
export declare class IngestionPipelineConfigurations extends ClientSDK {
    /**
     * List ingestion pipeline configurations
     *
     * @remarks
     * For the current workspace, lists all of the registered ingestion pipeline configurations.
     */
    list(options?: RequestOptions): Promise<Array<components.IngestionPipelineConfiguration>>;
}
//# sourceMappingURL=ingestionpipelineconfigurations.d.ts.map