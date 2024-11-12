import { Blockchain } from '@ton-community/sandbox';
import { Address, beginCell, Cell, toNano } from 'ton-core';
import { Vote } from '../wrappers/Vote';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { VoteItem } from '../wrappers/VoteItem';

describe('Vote', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Vote');
    });

    it('default test with votes', async () => {
        const blockchain = await Blockchain.create();
        blockchain.verbosity = {
            blockchainLogs: false,
            vmLogs: "none",
            debugLogs: true,
        }
        const initiator = await blockchain.treasury('initiator');
        const user = await blockchain.treasury('user');
        const vote = blockchain.openContract(
            Vote.createFromConfig(
                {
                    initiatorAddress: initiator.address,
                    item_code_hex: await compile('VoteItem'),
                    project_name: beginCell().storeStringTail('Ston.fi').endCell(),
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
        console.log(project);
        const result = await vote.sendVote(user.getSender(), 12);
        const vote1 = await vote.getVotes();
        console.log(vote1);
        const voteAddress = await vote.getMyVoteAddress(user.getSender().address);
        console.log(voteAddress);

        const voteItem = blockchain.openContract(VoteItem.createFromAddress(voteAddress));
        const myvote = await voteItem.getMyVote();
        console.log(myvote);
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
