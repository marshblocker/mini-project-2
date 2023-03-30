import React from 'react';
import './Navbar.css';

const Navbar = ({account, onConnectWallet, loading}) => {
    return (
        <nav className="navbar navbar-expand-lg bg-dark" data-bs-theme="dark">
            <div className="container py-2">
                <a href="/" className="navbar-brand">
                    Tezos Escrow
                </a>
                { 
                    loading 
                    ? "" 
                    : <FunctionalPart account={account} onConnectWallet={onConnectWallet}/>
                }
            </div>
        </nav>
    );
}

const FunctionalPart = ({account, onConnectWallet}) => (
    <div className="d-flex align-items-center">
        <p className="text-primary ">
            { account.address ? `${account.address} (${account.type})` : "" }
        </p>
        <button onClick={onConnectWallet} className="btn btn-primary">
            { account.address ? "Disconnect Wallet" : "Connect Wallet" }
        </button>
    </div>
)

export default Navbar;