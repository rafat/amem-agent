import CitrexSDK from '../../../node_modules/citrex-sdk/lib/index.js'
import { Config, KlineOptionalArgs, KlinesReturnType } from '../../../node_modules/citrex-sdk/lib/types.js'
import { ProductSymbol } from '../../../node_modules/citrex-sdk/lib/types.js'
import * as dotenv from 'dotenv'

dotenv.config()

export async function citrexGetKlines(
    productSymbol: ProductSymbol,
    optionalArgs?: KlineOptionalArgs
): Promise<KlinesReturnType | undefined> {
    const MY_PRIVATE_KEY = process.env.SEI_PRIVATE_KEY

    try {
        const CONFIG = {
            debug: false,
            environment: 'testnet',
            rpc: 'https://evm-rpc-testnet.sei-apis.com',
            subAccountId: 0,
        }
        const Client = new CitrexSDK(MY_PRIVATE_KEY as `0x${string}`, CONFIG as Config)
        const result = await Client.getKlines(productSymbol, optionalArgs)
        return result
    } catch (error) {
        console.error(error)
        return
    }
} 