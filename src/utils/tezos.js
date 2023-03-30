import { TezosToolkit } from "@taquito/taquito";
import { wallet } from "./wallet";

export const tezos = new TezosToolkit("https://ghostnet.smartpy.io");
export const CONTRACT_ADDRESS = "KT1GcNnV7iKZC61wzE1Rh7sRy52Tq2UV1gqN";

tezos.setWalletProvider(wallet);