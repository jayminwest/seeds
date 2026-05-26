"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Beta = void 0;
const tslib_1 = require("../../internal/tslib.js");
const resource_1 = require("../../core/resource.js");
const EnvironmentsAPI = tslib_1.__importStar(require("./environments.js"));
const environments_1 = require("./environments.js");
const FilesAPI = tslib_1.__importStar(require("./files.js"));
const files_1 = require("./files.js");
const ModelsAPI = tslib_1.__importStar(require("./models.js"));
const models_1 = require("./models.js");
const UserProfilesAPI = tslib_1.__importStar(require("./user-profiles.js"));
const user_profiles_1 = require("./user-profiles.js");
const AgentsAPI = tslib_1.__importStar(require("./agents/agents.js"));
const agents_1 = require("./agents/agents.js");
const MemoryStoresAPI = tslib_1.__importStar(require("./memory-stores/memory-stores.js"));
const memory_stores_1 = require("./memory-stores/memory-stores.js");
const MessagesAPI = tslib_1.__importStar(require("./messages/messages.js"));
const messages_1 = require("./messages/messages.js");
const SessionsAPI = tslib_1.__importStar(require("./sessions/sessions.js"));
const sessions_1 = require("./sessions/sessions.js");
const SkillsAPI = tslib_1.__importStar(require("./skills/skills.js"));
const skills_1 = require("./skills/skills.js");
const VaultsAPI = tslib_1.__importStar(require("./vaults/vaults.js"));
const vaults_1 = require("./vaults/vaults.js");
class Beta extends resource_1.APIResource {
    constructor() {
        super(...arguments);
        this.models = new ModelsAPI.Models(this._client);
        this.messages = new MessagesAPI.Messages(this._client);
        this.agents = new AgentsAPI.Agents(this._client);
        this.environments = new EnvironmentsAPI.Environments(this._client);
        this.sessions = new SessionsAPI.Sessions(this._client);
        this.vaults = new VaultsAPI.Vaults(this._client);
        this.memoryStores = new MemoryStoresAPI.MemoryStores(this._client);
        this.files = new FilesAPI.Files(this._client);
        this.skills = new SkillsAPI.Skills(this._client);
        this.userProfiles = new UserProfilesAPI.UserProfiles(this._client);
    }
}
exports.Beta = Beta;
Beta.Models = models_1.Models;
Beta.Messages = messages_1.Messages;
Beta.Agents = agents_1.Agents;
Beta.Environments = environments_1.Environments;
Beta.Sessions = sessions_1.Sessions;
Beta.Vaults = vaults_1.Vaults;
Beta.MemoryStores = memory_stores_1.MemoryStores;
Beta.Files = files_1.Files;
Beta.Skills = skills_1.Skills;
Beta.UserProfiles = user_profiles_1.UserProfiles;
//# sourceMappingURL=beta.js.map