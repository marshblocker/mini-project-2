import { BeaconWallet } from "@taquito/beacon-wallet";
import { NetworkType } from "@airgap/beacon-types";

export const wallet = new BeaconWallet({
    name: "Tezos Wallet",
    preferredNetwork: NetworkType.GHOSTNET
});

export const connectWallet = async () => {
    try {
        await wallet.client.requestPermissions({
            network: { type: NetworkType.GHOSTNET}
        });
    } catch (error) {
        throw error;
    }
}

export const disconnectWallet = async () => {
    try {
        await wallet.clearActiveAccount();
    } catch (error) {
        throw error;        
    }
}

export const getAccount = async () => {
    try {
        const connectedWallet = await wallet.client.getActiveAccount();
        if (connectedWallet) {
            return connectedWallet.address;
        } else {
            return "";
        }
    } catch (error) {
        throw error;
    }
}