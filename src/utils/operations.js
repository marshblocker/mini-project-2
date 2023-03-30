import { CONTRACT_ADDRESS, tezos } from "./tezos"
import { fetchStorageData } from "./tzkt";

export const depositFund = async (accountAddress) => {
    try {
        const contract = await tezos.wallet.at(CONTRACT_ADDRESS);
        const storageData = await fetchStorageData();

        if (accountAddress === storageData.owner) {
            const fromOwner = storageData.fromOwner;

            const op = await contract
                .methods
                .addBalanceOwner()
                .send({
                    amount: fromOwner / 1000000,
                    mutez: false
                });

            return op.confirmation(1);
        }
        else if (accountAddress === storageData.counterparty) {
            const fromCounterparty = storageData.fromCounterparty;

            const op = await contract
                .methods
                .addBalanceCounterparty()
                .send({
                    amount: fromCounterparty / 1000000,
                    mutez: false
                });

            return op.confirmation(1);
        }
        else {
            throw Error('Registered account is not the owner or counterparty of the contract.');
        }
    } catch (error) {
        throw error;
    }
}

export const claimFund = async (accountAddress, secret) => {
    try {
        const contract = await tezos.wallet.at(CONTRACT_ADDRESS);
        const storageData = await fetchStorageData();

        if (accountAddress === storageData.owner) {
            const op = await contract
                .methods
                .claimOwner()
                .send();

            return op.confirmation(1);
        }
        else if (accountAddress === storageData.counterparty) {
            const op = await contract
                .methods
                .claimCounterparty(secret)
                .send();

            return op.confirmation(1);
        }
        else {
            throw Error('Only the owner or counterparty can claim fund.');
        }
    } catch (error) {
        throw error;
    }
}

// Called by owner or counterparty.
export const cancelEscrow = async (accountAddress) => {
    try {
        const contract = await tezos.wallet.at(CONTRACT_ADDRESS);
        const storageData = await fetchStorageData();

        if (accountAddress === storageData.owner) {
            const op = await contract
                .methods
                .cancelOwner()
                .send();

            return op.confirmation(1);
        }
        else if (accountAddress === storageData.counterparty) {
            const op = await contract
                .methods
                .cancelCounterparty()
                .send();

            return op.confirmation(1);
        } else {
            throw Error('Only the owner or counterparty can cancel the escrow.');
        }
    } catch (error) {
        throw error;
    }
}

// Called by admin.
export const revertEscrow = async (accountAddress) => {
    try {
        const contract = await tezos.wallet.at(CONTRACT_ADDRESS);
        const storageData = await fetchStorageData();

        if (accountAddress !== storageData.admin) {
            throw Error('Only the admin can revert the escrow.');
        }

        const op = await contract
                .methods
                .revert()
                .send();

            return op.confirmation(1);        
    } catch (error) {
        throw error;
    }
}