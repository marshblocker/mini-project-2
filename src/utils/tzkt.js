import axios from "axios"

export const fetchStorageData = async (contractAddress) => {
    try {
        const res = await axios.get(
            `https://api.ghostnet.tzkt.io/v1/contracts/${contractAddress}/storage`
        );
    
        return {
            owner: res.data.owner,
            counterparty: res.data.counterparty,
            balanceOwner: +res.data.balanceOwner,
            balanceCounterparty: +res.data.balanceCounterparty,
            fromOwner: +res.data.fromOwner,
            fromCounterparty: +res.data.fromCounterparty,
            epoch: res.data.epoch,
            admin: res.data.admin,
            cancelOwner: res.data.cancelOwner,
            cancelCounterparty: res.data.cancelCounterparty,
            contractTerminated: res.data.contractTerminated
        };
    } catch (error) {
        throw error;        
    }
};