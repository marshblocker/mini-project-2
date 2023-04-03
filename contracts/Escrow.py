# Changes
# - Create new endpoints (cancelOwner, cancelCounterparty, revert) and
#   new storage variables (admin, cancelOwner, cancelCounterparty) for
#   Milestone 4.
# - Added new scenarios in test() to test the new endpoints
# - Updated claim() method to reset cancelOwner and cancelCounterparty
#   to false when the owner/counterparty claims the escrow fund.
# - Added contractTerminated to contract storage as indicator whether
#   the contract has been terminated. Added checks in most entrypoints
#   to prevent them being called when the contract is already terminated.

import smartpy as sp

class Escrow(sp.Contract):
    def __init__(self, owner, fromOwner, counterparty, fromCounterparty, epoch, hashedSecret, admin):
        self.init(fromOwner           = fromOwner,
                  fromCounterparty    = fromCounterparty,
                  balanceOwner        = sp.tez(0),
                  balanceCounterparty = sp.tez(0),
                  hashedSecret        = hashedSecret,
                  epoch               = epoch,
                  owner               = owner,
                  counterparty        = counterparty,
                  admin               = admin,
                  cancelOwner         = False,
                  cancelCounterparty  = False,
                  contractTerminated  = False)

    @sp.entry_point
    def addBalanceOwner(self):
        sp.verify(self.data.balanceOwner == sp.tez(0))
        sp.verify(sp.amount == self.data.fromOwner)
        sp.verify(self.data.contractTerminated == False, 'Contract is already terminated.')
        self.data.balanceOwner = self.data.fromOwner

    @sp.entry_point
    def addBalanceCounterparty(self):
        sp.verify(self.data.balanceCounterparty == sp.tez(0))
        sp.verify(sp.amount == self.data.fromCounterparty)
        sp.verify(self.data.contractTerminated == False, 'Contract is already terminated.')
        self.data.balanceCounterparty = self.data.fromCounterparty

    def claim(self, identity):
        sp.verify(sp.sender == identity)
        sp.send(identity, self.data.balanceOwner + self.data.balanceCounterparty)
        self.data.balanceOwner = sp.tez(0)
        self.data.balanceCounterparty = sp.tez(0)
        self.data.cancelOwner = False
        self.data.cancelCounterparty = False
        self.data.contractTerminated = True

    @sp.entry_point
    def claimCounterparty(self, params):
        sp.verify(sp.now < self.data.epoch)
        sp.verify(self.data.hashedSecret == sp.blake2b(params.secret))
        sp.verify(self.data.contractTerminated == False, 'Contract is already terminated.')
        self.claim(self.data.counterparty)

    @sp.entry_point
    def claimOwner(self):
        sp.verify(self.data.epoch < sp.now)
        sp.verify(self.data.contractTerminated == False, 'Contract is already terminated.')
        self.claim(self.data.owner)

    @sp.entry_point
    def cancelOwner(self):
        sp.verify(sp.sender == self.data.owner, "You are not the owner!")
        sp.verify(self.data.balanceOwner != sp.tez(0), "No owner balance to cancel!")
        sp.verify(self.data.contractTerminated == False, 'Contract is already terminated.')
        self.data.cancelOwner = True

    @sp.entry_point
    def cancelCounterparty(self):
        sp.verify(sp.sender == self.data.counterparty, "You are not the counterparty!")
        sp.verify(self.data.balanceCounterparty != sp.tez(0), "No counterparty balance to cancel!")
        sp.verify(self.data.contractTerminated == False, 'Contract is already terminated.')
        self.data.cancelCounterparty = True

    @sp.entry_point
    def revert(self):
        sp.verify(sp.sender == self.data.admin, "Only the contract admin can revert the escrow.")
        sp.verify(self.data.contractTerminated == False, 'Contract is already terminated.')
        sp.if ~(self.data.cancelOwner & self.data.cancelCounterparty):
            sp.verify(False, "Both the owner and the counterparty must agree on reverting the escrow.")

        
        sp.send(self.data.owner, self.data.balanceOwner)
        self.data.balanceOwner = sp.tez(0)
        
        sp.send(self.data.counterparty, self.data.balanceCounterparty)
        self.data.balanceCounterparty = sp.tez(0)

        self.data.cancelOwner = False
        self.data.cancelCounterparty = False
        self.data.contractTerminated = True
        

@sp.add_test(name = "Escrow")
def test():
    scenario = sp.test_scenario()
    scenario.h1("Escrow")
    hashSecret = sp.blake2b(sp.bytes("0x01223344"))
    alice = sp.test_account("Alice")
    bob = sp.test_account("Bob")
    admin = sp.test_account("Admin")
    c1 = Escrow(alice.address, sp.tez(50), bob.address, sp.tez(4), sp.timestamp(123), hashSecret, admin.address)
    scenario += c1
    c1.addBalanceOwner().run(sender = alice, amount = sp.tez(50))
    c1.addBalanceCounterparty().run(sender = bob, amount = sp.tez(4))
    scenario.h3("Erronous secret")
    c1.claimCounterparty(secret = sp.bytes("0x01223343"))    .run(sender = bob, valid = False)
    scenario.h3("Correct secret")
    c1.claimCounterparty(secret = sp.bytes("0x01223344")).run(sender = bob)

    scenario.h4("Revert (success)")
    c1 = Escrow(alice.address, sp.tez(50), bob.address, sp.tez(4), sp.timestamp(123), hashSecret, admin.address)
    scenario += c1
    c1.addBalanceOwner().run(sender = alice, amount = sp.tez(50))
    c1.addBalanceCounterparty().run(sender = bob, amount = sp.tez(4))
    c1.cancelOwner().run(sender = alice)
    c1.cancelCounterparty().run(sender = bob)
    c1.revert().run(sender = admin)

    scenario.h4("Revert (fail since revert() is not called by admin)")
    c1 = Escrow(alice.address, sp.tez(50), bob.address, sp.tez(4), sp.timestamp(123), hashSecret, admin.address)
    scenario += c1
    c1.addBalanceOwner().run(sender = alice, amount = sp.tez(50))
    c1.addBalanceCounterparty().run(sender = bob, amount = sp.tez(4))
    c1.cancelOwner().run(sender = alice)
    c1.cancelCounterparty().run(sender = bob)
    c1.revert().run(sender = bob, valid = False)
    scenario.h4("Reset scenario")
    c1.revert().run(sender = admin)

    scenario.h4("Revert (fail since owner did not call cancelOwner())")
    c1 = Escrow(alice.address, sp.tez(50), bob.address, sp.tez(4), sp.timestamp(123), hashSecret, admin.address)
    scenario += c1
    c1.addBalanceOwner().run(sender = alice, amount = sp.tez(50))
    c1.addBalanceCounterparty().run(sender = bob, amount = sp.tez(4))
    c1.cancelCounterparty().run(sender = bob)
    c1.revert().run(sender = admin, valid = False)
    scenario.h4("Reset scenario")
    c1.cancelOwner().run(sender = alice)
    c1.revert().run(sender = admin)

    scenario.h4("Alice and Bob will add balance again even if the contract is already terminated (Fail)")
    c1 = Escrow(alice.address, sp.tez(50), bob.address, sp.tez(4), sp.timestamp(123), hashSecret, admin.address)
    scenario += c1
    c1.addBalanceOwner().run(sender = alice, amount = sp.tez(50))
    c1.addBalanceCounterparty().run(sender = bob, amount = sp.tez(4))
    c1.claimCounterparty(secret = sp.bytes("0x01223344")).run(sender = bob)
    c1.addBalanceOwner().run(sender = alice, amount = sp.tez(50), valid = False)
    c1.addBalanceOwner().run(sender = bob, amount = sp.tez(4), valid = False)
    

sp.add_compilation_target("escrow", 
    Escrow(owner=sp.address("tz1YscREcfGvPGfZM3hVsT6j99j3FpEVWywB"), 
           fromOwner=sp.tez(50), 
           counterparty=sp.address("tz1eyfyBApsCWsdxCtC4TizLZ5eYoDsWmb8b"), 
           fromCounterparty=sp.tez(4), 
           epoch=sp.timestamp(1880071243), 
           hashedSecret=sp.bytes("0xc2e588e23a6c8b8192da64af45b7b603ac420aefd57cc1570682350154e9c04e"),
           admin=sp.address("tz1fcNTRug7RXfixJWttCcReTVXSLt2UozSU")
    )
)