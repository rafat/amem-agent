import { SeiAgentKit } from "../../agent";
import { TwitterAccountDetailsSchema } from "../../tools";
import { StructuredTool } from "langchain/tools";
import { z } from "zod";
import { CallbackManagerForToolRun } from "@langchain/core/callbacks/manager";

export class SeiGetAccountDetailsTool extends StructuredTool<typeof TwitterAccountDetailsSchema> {
    name = "get_account_details";
    description =
     `This tool will return account details for the currently authenticated Twitter (X) user context.

A successful response will return a message with the api response as a json payload:
    {"data": {"id": "1853889445319331840", "name": "CDP AgentKit", "username": "CDPAgentKit"}}

A failure response will return a message with a Twitter API request error:
    Error retrieving authenticated user account: 429 Too Many Requests`;
    schema = TwitterAccountDetailsSchema;

    constructor(private readonly seiKit: SeiAgentKit) {
        super();
    }

    async _call(
        arg: z.input<typeof TwitterAccountDetailsSchema>,
        runManager?: CallbackManagerForToolRun
    ): Promise<string> {
        return this.seiKit.getAccountDetails();
    }
}
