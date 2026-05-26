import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import * as operations from "../models/operations/index.js";
export declare class Connectors extends ClientSDK {
    /**
     * Create a new connector.
     *
     * @remarks
     * Create a new MCP connector. You can customize its visibility, url and auth type.
     */
    create(request: components.CreateConnectorRequest, options?: RequestOptions): Promise<components.Connector>;
    /**
     * List all connectors.
     *
     * @remarks
     * List all your custom connectors with keyset pagination and filters.
     */
    list(request?: operations.ConnectorListV1Request | undefined, options?: RequestOptions): Promise<components.PaginatedConnectors>;
    /**
     * Get the auth URL for a connector.
     *
     * @remarks
     * Get the OAuth2 authorization URL for a connector to initiate user authentication.
     */
    getAuthUrl(request: operations.ConnectorGetAuthUrlV1Request, options?: RequestOptions): Promise<components.AuthUrlResponse>;
    /**
     * Call Connector Tool
     *
     * @remarks
     * Call a tool on an MCP connector.
     */
    callTool(request: operations.ConnectorCallToolV1Request, options?: RequestOptions): Promise<components.ConnectorToolCallResponse>;
    /**
     * List tools for a connector.
     *
     * @remarks
     * List all tools available for an MCP connector.
     */
    listTools(request: operations.ConnectorListToolsV1Request, options?: RequestOptions): Promise<operations.ResponseConnectorListToolsV1>;
    /**
     * Get authentication methods for a connector.
     *
     * @remarks
     * Get the authentication schema for a connector. Returns the list of supported authentication methods and their required headers.
     */
    getAuthenticationMethods(request: operations.ConnectorGetAuthenticationMethodsV1Request, options?: RequestOptions): Promise<Array<components.PublicAuthenticationMethod>>;
    /**
     * List organization credentials for a connector.
     *
     * @remarks
     * List all credentials configured at the organization level for a given connector.
     */
    listOrganizationCredentials(request: operations.ConnectorListOrganizationCredentialsV1Request, options?: RequestOptions): Promise<components.CredentialsResponse>;
    /**
     * Create or update organization credentials for a connector.
     *
     * @remarks
     * Create or update credentials at the organization level for a given connector.
     */
    createOrUpdateOrganizationCredentials(request: operations.ConnectorCreateOrUpdateOrganizationCredentialsV1Request, options?: RequestOptions): Promise<components.MessageResponse>;
    /**
     * List workspace credentials for a connector.
     *
     * @remarks
     * List all credentials configured at the workspace level for a given connector.
     */
    listWorkspaceCredentials(request: operations.ConnectorListWorkspaceCredentialsV1Request, options?: RequestOptions): Promise<components.CredentialsResponse>;
    /**
     * Create or update workspace credentials for a connector.
     *
     * @remarks
     * Create or update credentials at the workspace level for a given connector.
     */
    createOrUpdateWorkspaceCredentials(request: operations.ConnectorCreateOrUpdateWorkspaceCredentialsV1Request, options?: RequestOptions): Promise<components.MessageResponse>;
    /**
     * List user credentials for a connector.
     *
     * @remarks
     * List all credentials configured at the user level for a given connector.
     */
    listUserCredentials(request: operations.ConnectorListUserCredentialsV1Request, options?: RequestOptions): Promise<components.CredentialsResponse>;
    /**
     * Create or update user credentials for a connector.
     *
     * @remarks
     * Create or update credentials at the user level for a given connector.
     */
    createOrUpdateUserCredentials(request: operations.ConnectorCreateOrUpdateUserCredentialsV1Request, options?: RequestOptions): Promise<components.MessageResponse>;
    /**
     * Delete organization credentials for a connector.
     *
     * @remarks
     * Delete credentials at the organization level for a given connector.
     */
    deleteOrganizationCredentials(request: operations.ConnectorDeleteOrganizationCredentialsV1Request, options?: RequestOptions): Promise<components.MessageResponse>;
    /**
     * Delete workspace credentials for a connector.
     *
     * @remarks
     * Delete credentials at the workspace level for a given connector.
     */
    deleteWorkspaceCredentials(request: operations.ConnectorDeleteWorkspaceCredentialsV1Request, options?: RequestOptions): Promise<components.MessageResponse>;
    /**
     * Delete user credentials for a connector.
     *
     * @remarks
     * Delete credentials at the user level for a given connector.
     */
    deleteUserCredentials(request: operations.ConnectorDeleteUserCredentialsV1Request, options?: RequestOptions): Promise<components.MessageResponse>;
    /**
     * Get a connector.
     *
     * @remarks
     * Get a connector by its ID or name.
     */
    get(request: operations.ConnectorGetV1Request, options?: RequestOptions): Promise<components.Connector>;
    /**
     * Update a connector.
     *
     * @remarks
     * Update a connector by its ID.
     */
    update(request: operations.ConnectorUpdateV1Request, options?: RequestOptions): Promise<components.Connector>;
    /**
     * Delete a connector.
     *
     * @remarks
     * Delete a connector by its ID.
     */
    delete(request: operations.ConnectorDeleteV1Request, options?: RequestOptions): Promise<components.MessageResponse>;
}
//# sourceMappingURL=connectors.d.ts.map