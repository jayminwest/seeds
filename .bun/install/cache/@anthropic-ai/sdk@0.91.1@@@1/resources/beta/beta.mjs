// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../core/resource.mjs";
import * as EnvironmentsAPI from "./environments.mjs";
import { Environments, } from "./environments.mjs";
import * as FilesAPI from "./files.mjs";
import { Files, } from "./files.mjs";
import * as ModelsAPI from "./models.mjs";
import { Models, } from "./models.mjs";
import * as UserProfilesAPI from "./user-profiles.mjs";
import { UserProfiles, } from "./user-profiles.mjs";
import * as AgentsAPI from "./agents/agents.mjs";
import { Agents, } from "./agents/agents.mjs";
import * as MemoryStoresAPI from "./memory-stores/memory-stores.mjs";
import { MemoryStores, } from "./memory-stores/memory-stores.mjs";
import * as MessagesAPI from "./messages/messages.mjs";
import { Messages, } from "./messages/messages.mjs";
import * as SessionsAPI from "./sessions/sessions.mjs";
import { Sessions, } from "./sessions/sessions.mjs";
import * as SkillsAPI from "./skills/skills.mjs";
import { Skills, } from "./skills/skills.mjs";
import * as VaultsAPI from "./vaults/vaults.mjs";
import { Vaults, } from "./vaults/vaults.mjs";
export class Beta extends APIResource {
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
Beta.Models = Models;
Beta.Messages = Messages;
Beta.Agents = Agents;
Beta.Environments = Environments;
Beta.Sessions = Sessions;
Beta.Vaults = Vaults;
Beta.MemoryStores = MemoryStores;
Beta.Files = Files;
Beta.Skills = Skills;
Beta.UserProfiles = UserProfiles;
//# sourceMappingURL=beta.mjs.map