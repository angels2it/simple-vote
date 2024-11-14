import { Address, beginCell, toNano } from 'ton-core';
import { Projects, Vote } from '../wrappers/Vote';
import { compile, NetworkProvider } from '@ton-community/blueprint';
import { VoteItem } from '../wrappers/VoteItem';

export async function run(provider: NetworkProvider) {
    const vote = await Vote.createFromConfig(
        {
            initiatorAddress:
                provider.sender().address ??
                Address.parseFriendly('EQBYxzHox8t7EdJe-9MM5WwNJT1UPI3jIP_yl4bDxzBawHuU').address,
            project_name: beginCell().storeStringTail(Projects.BTCPrice).endCell(),
        },
        await compile('Vote')
    );

    const openedContract = provider.open(vote);

    const [isFinish, result, winnerAddress] = await openedContract.getIsFinish();
    console.log(isFinish, result, winnerAddress);
}
