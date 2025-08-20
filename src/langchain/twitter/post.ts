import { SeiAgentKit } from "../../agent";
import { TwitterPostTweetSchema } from "../../tools";
import { StructuredTool } from "langchain/tools";
import { z } from "zod";
import { CallbackManagerForToolRun } from "@langchain/core/callbacks/manager";

export class SeiPostTweetTool extends StructuredTool<typeof TwitterPostTweetSchema> {
    name = "post_tweet";
    description = "Posts a tweet to Twitter";
    schema = TwitterPostTweetSchema;
    
    constructor(private readonly seiKit: SeiAgentKit) {
        super();
    }

    async _call(
        args: z.input<typeof TwitterPostTweetSchema>,
        runManager?: CallbackManagerForToolRun
    ): Promise<string> {
        return this.seiKit.postTweet(args);
    }
}