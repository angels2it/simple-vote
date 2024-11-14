import { Address, beginCell, toNano } from 'ton-core';
import { Projects, Vote } from '../wrappers/Vote';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const vote = Vote.createFromConfig(
        {
            initiatorAddress:
                provider.sender().address ??
                Address.parseFriendly('EQBYxzHox8t7EdJe-9MM5WwNJT1UPI3jIP_yl4bDxzBawHuU').address,
            project_name: beginCell().storeStringTail(Projects.BTCPrice).endCell(),
        },
        await compile('Vote')
    );
    const contract = provider.open(vote);
    await contract.sendDeploy(provider.sender(), toNano('0.05'));

    // run methods on `openedContract
    console.log(await contract.getProjectName());
}
