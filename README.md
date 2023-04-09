## CS 173 Mini Project 2 - Escrow Website
Built with Taquito, Smartpy, and React.

### How to Run Locally
```
    > git clone https://github.com/marshblocker/mini-project-2.git
    > cd path/to/mini-project-2
    > npm build
    > npm start
```

You can change the initial contract address in the `CONTRACT_ADDRESS` constant in `App.js`.

### Features
Up to **Milestone 5**.

### Video Documentation
[Youtube link](https://youtu.be/O9sv8O_8Ndg)

### Implementation specifics
- When the owner/counter withdraws the fund or cancels the escrow, the contract will be terminated and its endpoints would be unusable.
- Refreshing the website will return the user to the contract set in `CONTRACT_ADDRESS` in `App.js`.