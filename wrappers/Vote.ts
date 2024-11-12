import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    parseTuple,
    Sender,
    SendMode,
    toNano,
} from 'ton-core';
import { compile } from '@ton-community/blueprint';

export const Projects = {
    stonfi: 'STON.fi',
    dedust: 'DeDust',
    startupMarket: 'StartupMarketer',
    tonDiamonds: 'TonDiamonds',
    tegro: 'TegroFinance',
    megaton: 'MegatonFinance',
    tonApi: 'TonAPI',
    getgems: 'Getgems',
    tonstarter: 'Tonstarter',
    tonkeeper: 'Tonkeeper',
    tonhub: 'Tonhub',
    BTCPrice: 'Bet BTC Price',
};

export type VoteConfig = {
    initiatorAddress: Address;
    count?: number;
    timeWhenFinish?: number;
    item_code_hex: Cell;
    project_name: Cell;
};

export function voteConfigToCell(config: VoteConfig): Cell {
    return beginCell()
        .storeUint(config.count ?? 0, 32)
        .storeInt(config.timeWhenFinish ?? 0, 32)
        .storeAddress(config.initiatorAddress)
        .storeRef(config.item_code_hex)
        .storeRef(config.project_name)
        .storeUint(0, 32)
        .endCell();
}

export class Vote implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Vote(address);
    }

    static createFromConfig(config: VoteConfig, code: Cell, workchain = 0) {
        const data = voteConfigToCell(config);
        const init = { code, data };
        return new Vote(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATLY,
            body: beginCell().endCell(),
        });
    }

    async sendVote(provider: ContractProvider, via: Sender, vote: number, value?: bigint) {
        return await provider.internal(via, {
            value: value ?? toNano('0.1'),
            body: beginCell().storeUint(0, 32).storeStringTail(vote.toString()).endCell(),
        });
    }

    async sendTakeCommissions(provider: ContractProvider, via: Sender, value?: bigint) {
        return await provider.internal(via, {
            value: value ?? toNano('0.1'),
            body: beginCell().storeUint(202, 32).endCell(),
        });
    }

    sendBouncedItem(provider: ContractProvider, via: Sender, vote: boolean, value?: bigint) {
        return provider.internal(via, {
            bounce: true,
            value: value ?? toNano(1),
            body: beginCell()
                .storeUint(0, 32)
                .storeInt(vote ? -1 : 0, 3)
                .endCell(),
        });
    }

    async getVotes(provider: ContractProvider) {
        const result = await provider.get('get_votes', []);
        return [result.stack.readNumber()];
    }

    async getProjectName(provider: ContractProvider) {
        const result = await provider.get('get_project_name', []);
        return [result.stack.readString()];
    }

    async getMyVoteAddress(provider: ContractProvider, userAddress: Address) {
        const result = await provider.get('get_vote_addr', [
            { type: 'slice', cell: beginCell().storeAddress(userAddress).endCell() },
        ]);
        return result.stack.readAddress();
    }
}
