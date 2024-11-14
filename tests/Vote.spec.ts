import { Blockchain } from '@ton-community/sandbox';
import { Address, beginCell, Cell, fromNano, toNano } from 'ton-core';
import { Projects, Vote } from '../wrappers/Vote';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Vote', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Vote');
    });

    it('default test with votes', async () => {
        const blockchain = await Blockchain.create();
        blockchain.verbosity = {
            blockchainLogs: false,
            vmLogs: 'none',
            debugLogs: true,
        };
        const initiator = await blockchain.treasury('initiator');
        const user = await blockchain.treasury('user');
        const user2 = await blockchain.treasury('user2');
        const vote = blockchain.openContract(
            Vote.createFromConfig(
                {
                    initiatorAddress: initiator.address,
                    project_name: beginCell().storeStringTail(Projects.BTCPrice).endCell(),
                },
                code
            )
        );

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await vote.sendDeploy(deployer.getSender(), toNano('0.1'));
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: vote.address,
            deploy: true,
        });
        const [project] = await vote.getProjectName();
        console.log(project)
        await vote.sendVote(user.getSender(), 12);
        await vote.sendVote(user2.getSender(), 13);
        const [myVote, value] = await vote.getMyVote(user.address!);
        console.log(myVote, fromNano(value))

        const [myVote2, value2] = await vote.getMyVote(user2.address!);
        console.log(myVote2, fromNano(value2))
        console.log('set result')
        await vote.sendResult(initiator.getSender(), 12);
        const [isFinish, result, addres] = await vote.getIsFinish();
        console.log('isFinish', isFinish, result, addres);
    });

    // it('bounce test', async () => {
    //     const blockchain = await Blockchain.create();
    //     const initiator = await blockchain.treasury('initiator')
    //     const user = await blockchain.treasury('user')
    //     const voteItem = await blockchain.treasury('vote_item')
    //     const vote = blockchain.openContract(Vote.createFromConfig({
    //         initiatorAddress: initiator.address,
    //         item_code_hex: await compile('VoteItem'),
    //         project_name: beginCell().storeStringTail('Ston.fi').endCell()
    //     }, code));
    //
    //     const deployer = await blockchain.treasury('deployer');
    //     await vote.sendDeploy(deployer.getSender(), toNano('0.05'));
    //     await vote.sendVote(user.getSender(), true)
    //     await vote.sendVote(user.getSender(), true)
    //     const result = await vote.sendBouncedItem(voteItem.getSender(), true)
    //     expect(result.transactions).toHaveTransaction({
    //         to: vote.address,
    //         from: voteItem.address,
    //         aborted: true,
    //     })
    //     console.log(result.transactions[1])
    //     const votes = await vote.getVotes()
    //     expect(votes[0]).toEqual(1)
    //     expect(votes[1]).toEqual(0)
    // });
});
