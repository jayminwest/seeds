import { APIResource } from "../../../core/resource.mjs";
import * as BetaAPI from "../beta.mjs";
import * as MemoriesAPI from "./memories.mjs";
import { BetaManagedAgentsConflictError, BetaManagedAgentsContentSha256Precondition, BetaManagedAgentsDeletedMemory, BetaManagedAgentsError, BetaManagedAgentsMemory, BetaManagedAgentsMemoryListItem, BetaManagedAgentsMemoryListItemsPageCursor, BetaManagedAgentsMemoryPathConflictError, BetaManagedAgentsMemoryPreconditionFailedError, BetaManagedAgentsMemoryPrefix, BetaManagedAgentsMemoryView, BetaManagedAgentsPrecondition, Memories, MemoryCreateParams, MemoryDeleteParams, MemoryListParams, MemoryRetrieveParams, MemoryUpdateParams } from "./memories.mjs";
import * as MemoryVersionsAPI from "./memory-versions.mjs";
import { BetaManagedAgentsAPIActor, BetaManagedAgentsActor, BetaManagedAgentsMemoryVersion, BetaManagedAgentsMemoryVersionOperation, BetaManagedAgentsMemoryVersionsPageCursor, BetaManagedAgentsSessionActor, BetaManagedAgentsUserActor, MemoryVersionListParams, MemoryVersionRedactParams, MemoryVersionRetrieveParams, MemoryVersions } from "./memory-versions.mjs";
import { APIPromise } from "../../../core/api-promise.mjs";
import { PageCursor, type PageCursorParams, PagePromise } from "../../../core/pagination.mjs";
import { RequestOptions } from "../../../internal/request-options.mjs";
export declare class MemoryStores extends APIResource {
    memories: MemoriesAPI.Memories;
    memoryVersions: MemoryVersionsAPI.MemoryVersions;
    /**
     * CreateMemoryStore
     *
     * @example
     * ```ts
     * const betaManagedAgentsMemoryStore =
     *   await client.beta.memoryStores.create({ name: 'x' });
     * ```
     */
    create(params: MemoryStoreCreateParams, options?: RequestOptions): APIPromise<BetaManagedAgentsMemoryStore>;
    /**
     * GetMemoryStore
     *
     * @example
     * ```ts
     * const betaManagedAgentsMemoryStore =
     *   await client.beta.memoryStores.retrieve(
     *     'memory_store_id',
     *   );
     * ```
     */
    retrieve(memoryStoreID: string, params?: MemoryStoreRetrieveParams | null | undefined, options?: RequestOptions): APIPromise<BetaManagedAgentsMemoryStore>;
    /**
     * UpdateMemoryStore
     *
     * @example
     * ```ts
     * const betaManagedAgentsMemoryStore =
     *   await client.beta.memoryStores.update('memory_store_id');
     * ```
     */
    update(memoryStoreID: string, params: MemoryStoreUpdateParams, options?: RequestOptions): APIPromise<BetaManagedAgentsMemoryStore>;
    /**
     * ListMemoryStores
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaManagedAgentsMemoryStore of client.beta.memoryStores.list()) {
     *   // ...
     * }
     * ```
     */
    list(params?: MemoryStoreListParams | null | undefined, options?: RequestOptions): PagePromise<BetaManagedAgentsMemoryStoresPageCursor, BetaManagedAgentsMemoryStore>;
    /**
     * DeleteMemoryStore
     *
     * @example
     * ```ts
     * const betaManagedAgentsDeletedMemoryStore =
     *   await client.beta.memoryStores.delete('memory_store_id');
     * ```
     */
    delete(memoryStoreID: string, params?: MemoryStoreDeleteParams | null | undefined, options?: RequestOptions): APIPromise<BetaManagedAgentsDeletedMemoryStore>;
    /**
     * ArchiveMemoryStore
     *
     * @example
     * ```ts
     * const betaManagedAgentsMemoryStore =
     *   await client.beta.memoryStores.archive('memory_store_id');
     * ```
     */
    archive(memoryStoreID: string, params?: MemoryStoreArchiveParams | null | undefined, options?: RequestOptions): APIPromise<BetaManagedAgentsMemoryStore>;
}
export type BetaManagedAgentsMemoryStoresPageCursor = PageCursor<BetaManagedAgentsMemoryStore>;
export interface BetaManagedAgentsDeletedMemoryStore {
    id: string;
    type: 'memory_store_deleted';
}
export interface BetaManagedAgentsMemoryStore {
    id: string;
    /**
     * A timestamp in RFC 3339 format
     */
    created_at: string;
    name: string;
    type: 'memory_store';
    /**
     * A timestamp in RFC 3339 format
     */
    updated_at: string;
    /**
     * A timestamp in RFC 3339 format
     */
    archived_at?: string | null;
    description?: string;
    metadata?: {
        [key: string]: string;
    };
}
export interface MemoryStoreCreateParams {
    /**
     * Body param
     */
    name: string;
    /**
     * Body param
     */
    description?: string;
    /**
     * Body param
     */
    metadata?: {
        [key: string]: string;
    };
    /**
     * Header param: Optional header to specify the beta version(s) you want to use.
     */
    betas?: Array<BetaAPI.AnthropicBeta>;
}
export interface MemoryStoreRetrieveParams {
    /**
     * Optional header to specify the beta version(s) you want to use.
     */
    betas?: Array<BetaAPI.AnthropicBeta>;
}
export interface MemoryStoreUpdateParams {
    /**
     * Body param
     */
    description?: string | null;
    /**
     * Body param: Metadata patch. Set a key to a string to upsert it, or to null to
     * delete it. Omit the field to preserve. The stored bag is limited to 16 keys (up
     * to 64 chars each) with values up to 512 chars.
     */
    metadata?: {
        [key: string]: string | null;
    } | null;
    /**
     * Body param
     */
    name?: string | null;
    /**
     * Header param: Optional header to specify the beta version(s) you want to use.
     */
    betas?: Array<BetaAPI.AnthropicBeta>;
}
export interface MemoryStoreListParams extends PageCursorParams {
    /**
     * Query param: Return stores created at or after this time (inclusive).
     */
    'created_at[gte]'?: string;
    /**
     * Query param: Return stores created at or before this time (inclusive).
     */
    'created_at[lte]'?: string;
    /**
     * Query param: Query parameter for include_archived
     */
    include_archived?: boolean;
    /**
     * Header param: Optional header to specify the beta version(s) you want to use.
     */
    betas?: Array<BetaAPI.AnthropicBeta>;
}
export interface MemoryStoreDeleteParams {
    /**
     * Optional header to specify the beta version(s) you want to use.
     */
    betas?: Array<BetaAPI.AnthropicBeta>;
}
export interface MemoryStoreArchiveParams {
    /**
     * Optional header to specify the beta version(s) you want to use.
     */
    betas?: Array<BetaAPI.AnthropicBeta>;
}
export declare namespace MemoryStores {
    export { type BetaManagedAgentsDeletedMemoryStore as BetaManagedAgentsDeletedMemoryStore, type BetaManagedAgentsMemoryStore as BetaManagedAgentsMemoryStore, type BetaManagedAgentsMemoryStoresPageCursor as BetaManagedAgentsMemoryStoresPageCursor, type MemoryStoreCreateParams as MemoryStoreCreateParams, type MemoryStoreRetrieveParams as MemoryStoreRetrieveParams, type MemoryStoreUpdateParams as MemoryStoreUpdateParams, type MemoryStoreListParams as MemoryStoreListParams, type MemoryStoreDeleteParams as MemoryStoreDeleteParams, type MemoryStoreArchiveParams as MemoryStoreArchiveParams, };
    export { Memories as Memories, type BetaManagedAgentsConflictError as BetaManagedAgentsConflictError, type BetaManagedAgentsContentSha256Precondition as BetaManagedAgentsContentSha256Precondition, type BetaManagedAgentsDeletedMemory as BetaManagedAgentsDeletedMemory, type BetaManagedAgentsError as BetaManagedAgentsError, type BetaManagedAgentsMemory as BetaManagedAgentsMemory, type BetaManagedAgentsMemoryListItem as BetaManagedAgentsMemoryListItem, type BetaManagedAgentsMemoryPathConflictError as BetaManagedAgentsMemoryPathConflictError, type BetaManagedAgentsMemoryPreconditionFailedError as BetaManagedAgentsMemoryPreconditionFailedError, type BetaManagedAgentsMemoryPrefix as BetaManagedAgentsMemoryPrefix, type BetaManagedAgentsMemoryView as BetaManagedAgentsMemoryView, type BetaManagedAgentsPrecondition as BetaManagedAgentsPrecondition, type BetaManagedAgentsMemoryListItemsPageCursor as BetaManagedAgentsMemoryListItemsPageCursor, type MemoryCreateParams as MemoryCreateParams, type MemoryRetrieveParams as MemoryRetrieveParams, type MemoryUpdateParams as MemoryUpdateParams, type MemoryListParams as MemoryListParams, type MemoryDeleteParams as MemoryDeleteParams, };
    export { MemoryVersions as MemoryVersions, type BetaManagedAgentsActor as BetaManagedAgentsActor, type BetaManagedAgentsAPIActor as BetaManagedAgentsAPIActor, type BetaManagedAgentsMemoryVersion as BetaManagedAgentsMemoryVersion, type BetaManagedAgentsMemoryVersionOperation as BetaManagedAgentsMemoryVersionOperation, type BetaManagedAgentsSessionActor as BetaManagedAgentsSessionActor, type BetaManagedAgentsUserActor as BetaManagedAgentsUserActor, type BetaManagedAgentsMemoryVersionsPageCursor as BetaManagedAgentsMemoryVersionsPageCursor, type MemoryVersionRetrieveParams as MemoryVersionRetrieveParams, type MemoryVersionListParams as MemoryVersionListParams, type MemoryVersionRedactParams as MemoryVersionRedactParams, };
}
//# sourceMappingURL=memory-stores.d.mts.map