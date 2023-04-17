export const contractAddressInCookie = () => {
	return document.cookie.split(";").some((c) => {
		return c.trim().startsWith("contract_address=");
	});
};

export const getContractAddressInCookie = () => {
	let contractAddress = '';
	document.cookie.split(';').forEach((el) => {
		let [k, v] = el.split('=');
		if (k.trim() === 'contract_address') {
			contractAddress = v;
		}
	})

	return contractAddress;
}