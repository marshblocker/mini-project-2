// TODO: Improve UI

import React, { useEffect, useState } from "react";
import { fetchStorageData } from "./utils/tzkt";
import { connectWallet, disconnectWallet, getAccount } from "./utils/wallet";
import "./App.css";
import Navbar from "./Navbar";
import {
	cancelEscrow,
	claimFund,
	depositFund,
	revertEscrow,
} from "./utils/operations";

const CONTRACT_ADDRESS = "KT1BeXMCMuFumx6Sv82YLHa7BmvaKtb6af23";

const AccountType = {
	Owner: "Owner",
	Counterparty: "Counterparty",
	Admin: "Admin",
	Viewer: "Viewer",
};

const App = () => {
	const [account, setAccount] = useState({
		address: "",
		type: AccountType.Viewer,
		hasDeposited: false,
	});
	const [contractData, setContractData] = useState({
		owner: "",
		counterparty: "",
		admin: "",
		balanceOwner: 0,
		balanceCounterparty: 0,
		fromOwner: 0,
		fromCounterparty: 0,
		epoch: "",
		cancelOwner: false,
		cancelCounterparty: false,
		contractTerminated: false,
	});
	const [loading, setLoading] = useState(false);
	const [contractAddress, setContractAddress] = useState(CONTRACT_ADDRESS);

	const totalBalance =
		contractData.balanceOwner + contractData.balanceCounterparty;
	const adminCanRevert =
		contractData.cancelOwner && contractData.cancelCounterparty;

	useEffect(() => {
		(async () => {
			setLoading(true);
			const accountAddress = await getAccount();
			const storageData = await fetchStorageData(contractAddress);
			const contractData = await getContractData(storageData);

			const accountType = getAccountType(accountAddress, storageData);
			const hasDeposited = getHasDeposited(accountType, storageData);

			setAccount({
				address: accountAddress,
				type: accountType,
				hasDeposited: hasDeposited,
			});
			setContractData(contractData);
			setLoading(false);
		})();
	}, []);

	useEffect(() => {
		setLoading(false);
	}, [contractData]);

	useEffect(() => {
		(async () => {
			setLoading(true);
			const accountAddress = await getAccount();
			const storageData = await fetchStorageData(contractAddress);
			const contractData = await getContractData(storageData);

			const accountType = getAccountType(accountAddress, storageData);
			const hasDeposited = getHasDeposited(accountType, storageData);

			setAccount({
				address: accountAddress,
				type: accountType,
				hasDeposited: hasDeposited,
			});
			setContractData(contractData);
			setLoading(false);
		})();
	}, [contractAddress]);

	const onConnectWallet = async () => {
		try {
			if (account.address === "") {
				await connectWallet();
				const accountAddress = await getAccount();

				const storageData = await fetchStorageData(contractAddress);
				const accountType = getAccountType(accountAddress, storageData);
				const hasDeposited = getHasDeposited(accountType, storageData);
				setAccount({
					address: accountAddress,
					type: accountType,
					hasDeposited: hasDeposited,
				});
			} else {
				if (
					window.confirm(
						"Are you sure you want to disconnect your wallet?"
					)
				) {
					await disconnectWallet();
					setAccount({
						address: "",
						type: AccountType.Viewer,
						hasDeposited: false,
					});
				}
			}
		} catch (error) {
			throw error;
		}
	};

	const onDeposit = async () => {
		try {
			setLoading(true);
			await depositFund(account.address, contractAddress);

			// Update account state.
			setAccount({
				...account,
				hasDeposited: true,
			});

			// Update contract data state.
			const storageData = await fetchStorageData(contractAddress);
			const contractData = await getContractData(storageData);
			setTimeout(() => setContractData(contractData), 1000);
		} catch (error) {
			setLoading(false);
			throw error;
		}
	};

	const onClaim = async (e) => {
		try {
			setLoading(true);

			if (account.type === AccountType.Counterparty) {
				e.preventDefault();

				const form = e.target;
				const formData = new FormData(form);
				const formJson = Object.fromEntries(formData.entries());
				const secret = formJson.secret;

				await claimFund(account.address, secret, contractAddress);
			} else {
				await claimFund(account.address, contractAddress);
			}

			setAccount({
				...account,
				hasDeposited: false,
			});

			const storageData = await fetchStorageData(contractAddress);
			const contractData = await getContractData(storageData);
			setTimeout(() => setContractData(contractData), 1000);
		} catch (error) {
			setLoading(false);
			throw error;
		}
	};

	// Called by owner or counterparty.
	const onCancel = async () => {
		try {
			setLoading(true);
			await cancelEscrow(account.address, contractAddress);

			const storageData = await fetchStorageData(contractAddress);
			const contractData = await getContractData(storageData);
			setTimeout(() => setContractData(contractData), 1000);
		} catch (error) {
			setLoading(false);
			throw error;
		}
	};

	// Called by admin.
	const onRevert = async () => {
		try {
			setLoading(true);
			await revertEscrow(account.address, contractAddress);

			const storageData = await fetchStorageData(contractAddress);
			const contractData = await getContractData(storageData);
			setTimeout(() => setContractData(contractData), 1000);
		} catch (error) {
			setLoading(false);
			throw error;
		}
	};

	const onChangeContract = () => {
		const newContractAddress = prompt(
			"Contract Address: ",
			contractAddress
		);

		if (newContractAddress === null) {
			console.log("new contract address is null!");
			return;
		}

		setContractAddress(newContractAddress);
	};

	return (
		<div className="h-100">
			<Navbar
				account={account}
				onConnectWallet={onConnectWallet}
				loading={loading}
			/>
			{contractData.contractTerminated ? (
				<div className="d-flex flex-column justify-content-center align-items-center">
					<h3>This contract has already terminated.</h3>
				</div>
			) : loading ? (
				<div className="d-flex flex-column justify-content-center align-items-center">
					<h3>Loading...</h3>
				</div>
			) : (
				<MainContent
					account={account}
					totalBalance={totalBalance}
					contractData={contractData}
					onDeposit={onDeposit}
					onClaim={onClaim}
					onCancel={onCancel}
					adminCanRevert={adminCanRevert}
					onRevert={onRevert}
				/>
			)}
			<div
				style={{
					position: "fixed",
					bottom: "0",
					marginBottom: "10px",
					marginLeft: "50px",
				}}
			>
				<p>
					<b>Contract Address:</b> {contractAddress}
				</p>
				<button onClick={onChangeContract} className="btn btn-primary">
					Change Contract
				</button>
			</div>
		</div>
	);
};

const getContractData = async (storageData) => {
	return {
		owner: storageData.owner,
		counterparty: storageData.counterparty,
		admin: storageData.admin,
		balanceOwner: storageData.balanceOwner,
		balanceCounterparty: storageData.balanceCounterparty,
		fromOwner: storageData.fromOwner,
		fromCounterparty: storageData.fromCounterparty,
		cancelOwner: storageData.cancelOwner,
		cancelCounterparty: storageData.cancelCounterparty,
		epoch: storageData.epoch,
		contractTerminated: storageData.contractTerminated,
	};
};

const getAccountType = (accountAddress, storageData) => {
	let type = AccountType.Viewer;

	switch (accountAddress) {
		case storageData.owner:
			type = AccountType.Owner;
			break;
		case storageData.counterparty:
			type = AccountType.Counterparty;
			break;
		case storageData.admin:
			type = AccountType.Admin;
			break;
		default:
			break;
	}

	return type;
};

const getHasDeposited = (accountType, storageData) => {
	if (
		(accountType === AccountType.Owner && storageData.balanceOwner !== 0) ||
		(accountType === AccountType.Counterparty &&
			storageData.balanceCounterparty !== 0)
	) {
		return true;
	}

	return false;
};

const Buttons = ({
	account,
	contractData,
	totalBalance,
	onDeposit,
	onClaim,
	onCancel,
}) => {
	const haveCancelled = () => {
		return (
			(account.type === AccountType.Owner && contractData.cancelOwner) ||
			(account.type === AccountType.Counterparty &&
				contractData.cancelCounterparty)
		);
	};
	const getCurrentTimestamp = () => Math.floor(new Date().getTime() / 1000);
	const epochUnixTimestamp = Math.floor(
		new Date(contractData.epoch).getTime() / 1000
	);
	return (
		<div className="d-flex flex-column">
			{account.hasDeposited ? (
				<div className="d-flex flex-column justify-content-center align-items-center">
					{haveCancelled() ? (
						<p>
							<i>
								Waiting for the other party to cancel the escrow
								or maybe waiting for the admin to approve the
								cancellation of escrow.
							</i>
						</p>
					) : (
						""
					)}
					<button
						onClick={onCancel}
						disabled={haveCancelled()}
						className="btn btn-primary"
					>
						{haveCancelled()
							? "Already cancelled escrow"
							: "Cancel escrow"}
					</button>
				</div>
			) : (
				<button onClick={onDeposit} className="btn btn-primary">
					Deposit
				</button>
			)}
			<hr></hr>
			<form
				method="post"
				onSubmit={onClaim}
				className="d-flex flex-column justify-content-center align-items-center"
			>
				<label hidden={account.type === AccountType.Owner}>
					Secret:{" "}
					<input
						name="secret"
						pattern="0x[0-9a-fA-F]+"
						title="Must be hex, i.e. 0x[0-9a-fA-F]+"
						disabled={totalBalance === 0}
						type="text"
					></input>
				</label>
				{account.type === AccountType.Owner ? (
					<div className="d-flex flex-column justify-content-center align-items-center">
						{totalBalance !== 0 &&
						getCurrentTimestamp() <= epochUnixTimestamp ? (
							<p>
								<i>
									Cannot claim fund when the contract epoch
									has not yet been reached.
								</i>
							</p>
						) : (
							""
						)}
						<button
							disabled={
								totalBalance === 0 ||
								getCurrentTimestamp() <= epochUnixTimestamp
							}
							type="submit"
							className="btn btn-primary"
						>
							{totalBalance === 0
								? "No fund to claim"
								: "Claim Fund"}
						</button>
					</div>
				) : (
					<div className="d-flex flex-column justify-content-center align-items-center">
						{totalBalance !== 0 &&
						getCurrentTimestamp() >= epochUnixTimestamp ? (
							<p>
								<i>
									Cannot claim fund when the contract epoch
									has elapsed.
								</i>
							</p>
						) : (
							""
						)}
						<button
							disabled={
								totalBalance === 0 ||
								getCurrentTimestamp() >= epochUnixTimestamp
							}
							type="submit"
							className="btn btn-primary"
						>
							{totalBalance === 0
								? "No fund to claim"
								: "Claim Fund"}
						</button>
					</div>
				)}
			</form>
		</div>
	);
};

const AdminButton = ({ adminCanRevert, onRevert }) => (
	<div className="d-flex flex-column justify-content-center align-items-center">
		{adminCanRevert ? (
			""
		) : (
			<p>
				<i>
					Both the owner and the counterparty must consent to the
					cancellation of this escrow.
				</i>
			</p>
		)}
		<button
			disabled={!adminCanRevert}
			onClick={onRevert}
			className="btn btn-primary"
		>
			{adminCanRevert ? "Revert escrow" : "Cannot revert escrow yet"}
		</button>
	</div>
);

const MainContent = ({
	account,
	totalBalance,
	contractData,
	onDeposit,
	onClaim,
	onCancel,
	adminCanRevert,
	onRevert,
}) => (
	<div className="d-flex flex-column justify-content-center align-items-center pt-3">
		<ul>
			<li>
				<b>Contract Admin:</b> {contractData.admin}
			</li>
			<li>
				<b>Contract Epoch:</b> {contractData.epoch}{" "}
			</li>
			<li>
				<b>Owner:</b> {contractData.owner}
			</li>
			<li>
				<b>Owner Balance:</b> {contractData.balanceOwner / 1000000} Tez
			</li>
			<li>
				<b>Counterparty:</b> {contractData.counterparty}
			</li>
			<li>
				<b>Counterparty Balance:</b>{" "}
				{contractData.balanceCounterparty / 1000000} Tez
			</li>
		</ul>
		{[AccountType.Owner, AccountType.Counterparty].includes(
			account.type
		) ? (
			<Buttons
				account={account}
				contractData={contractData}
				totalBalance={totalBalance}
				onDeposit={onDeposit}
				onClaim={onClaim}
				onCancel={onCancel}
			/>
		) : account.type === AccountType.Admin ? (
			<AdminButton adminCanRevert={adminCanRevert} onRevert={onRevert} />
		) : (
			<p>
				<i>
					View mode only since you are not the owner or the
					couterparty of this contract.
				</i>
			</p>
		)}
	</div>
);

export default App;
