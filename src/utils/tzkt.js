import axios from "axios"
import { CONTRACT_ADDRESS } from "./tezos";

export const fetchStorageData = async () => {
    try {
        const res = await axios.get(
            `https://api.ghostnet.tzkt.io/v1/contracts/${CONTRACT_ADDRESS}/storage`
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