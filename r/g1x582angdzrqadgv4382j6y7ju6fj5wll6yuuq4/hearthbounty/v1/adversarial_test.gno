package hearthbounty

import (
	"chain"
	"strconv"
	"strings"
	"testing"

	"gno.land/p/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthcore/v0"
	"gno.land/p/nt/testutils/v0"
	"gno.land/p/nt/uassert/v0"
	"gno.land/r/gnoland/wugnot"
)

func assertStatusCountsConserved(t *testing.T) {
	t.Helper()
	s := GetStats()
	sum := s.OpenCount + s.ClaimedCount + s.SubmittedCount + s.DisputedCount + s.SettledCount + s.CancelledCount
	uassert.Equal(t, s.TotalBounties, sum)
}

// Verifies double-claim rejection and terminal-state replay protection across
// Settled, Cancelled, and Dispute-resolved bounties.
func TestDoubleClaimAndTerminalStateReplayGuards(cur realm, t *testing.T) {
	arb := testutils.TestAddress("adv_dc_arb")
	sponsor := testutils.TestAddress("adv_dc_sponsor")
	hunterA := testutils.TestAddress("adv_dc_hunter_a")
	hunterB := testutils.TestAddress("adv_dc_hunter_b")
	bystander := testutils.TestAddress("adv_dc_bystander")
	realmAddr := chain.PackageAddress(testRealmPath)

	testing.SetRealm(testing.NewUserRealm(arb))
	resetState(arb)
	baseRealmBal := EscrowBalance(realmAddr)

	// Non-existent bounty IDs must abort cleanly.
	testing.SetOriginCaller(hunterA)
	testing.SetRealm(testing.NewUserRealm(hunterA))
	uassert.AbortsWithMessage(t, cur, "hearthbounty: bounty not found", func() {
		ClaimBounty(cross(cur), 0, "zero id")
	})
	uassert.AbortsWithMessage(t, cur, "hearthbounty: bounty not found", func() {
		ClaimBounty(cross(cur), 999, "missing id")
	})

	// Bounty #1 & #2: Post -> Claim -> Double-Claim blocked -> Submit -> Settle -> Replays blocked.
	testing.SetRealm(testing.NewUserRealm(sponsor))
	prepCoins(sponsor, 2000000)
	wugnot.Deposit(cross(cur))
	testing.SetOriginSend(chain.Coins{})
	wugnot.Approve(cross(cur), realmAddr, 2000000)
	id1 := PostBounty(cross(cur), "Double-Claim & Replay Guard", "Verify no second claim or second payout can occur.", "audit", 1000000, 30)
	id2 := PostBounty(cross(cur), "Cancel Replay Guard", "Verify cancelled bounty rejects every subsequent transition.", "tool", 1000000, 30)

	testing.SetOriginCaller(hunterA)
	testing.SetRealm(testing.NewUserRealm(hunterA))
	ClaimBounty(cross(cur), id1, "First claim")

	// Second claim by same hunter or different hunter must abort.
	uassert.AbortsWithMessage(t, cur, "hearthbounty: bounty is not open for claiming", func() {
		ClaimBounty(cross(cur), id1, "Same hunter retry")
	})
	testing.SetOriginCaller(hunterB)
	testing.SetRealm(testing.NewUserRealm(hunterB))
	uassert.AbortsWithMessage(t, cur, "hearthbounty: bounty is not open for claiming", func() {
		ClaimBounty(cross(cur), id1, "Competing hunter double-claim")
	})

	// Submit proof -> ClaimBounty still blocked.
	testing.SetOriginCaller(hunterA)
	testing.SetRealm(testing.NewUserRealm(hunterA))
	SubmitProof(cross(cur), id1, "https://github.com/hearthbounty/v1/pull/101", "sha256:aaaaaaaaaaaaaaaa", "Submitted proof for replay check.")
	testing.SetOriginCaller(hunterB)
	testing.SetRealm(testing.NewUserRealm(hunterB))
	uassert.AbortsWithMessage(t, cur, "hearthbounty: bounty is not open for claiming", func() {
		ClaimBounty(cross(cur), id1, "Claim during submitted")
	})

	// Sponsor approves & settles Bounty #1.
	hunterABefore := EscrowBalance(hunterA)
	testing.SetOriginCaller(sponsor)
	testing.SetRealm(testing.NewUserRealm(sponsor))
	ApproveAndSettle(cross(cur), id1, 5, "Settled once.")
	uassert.Equal(t, hunterABefore+1000000, EscrowBalance(hunterA))

	// All replay attempts on Settled Bounty #1 must abort with zero balance drift.
	uassert.AbortsWithMessage(t, cur, "hearthbounty: bounty is not awaiting approval", func() {
		ApproveAndSettle(cross(cur), id1, 5, "double settle")
	})
	uassert.AbortsWithMessage(t, cur, "hearthbounty: bounty has no pending submission", func() {
		ExpireSubmission(cross(cur), id1)
	})
	uassert.AbortsWithMessage(t, cur, "hearthbounty: only open bounties can be cancelled", func() {
		CancelBounty(cross(cur), id1)
	})
	uassert.AbortsWithMessage(t, cur, "hearthbounty: disputes can only be opened on submitted bounties", func() {
		OpenDispute(cross(cur), id1, "late dispute")
	})
	uassert.AbortsWithMessage(t, cur, "hearthbounty: bounty has no pending submission", func() {
		RequestRevision(cross(cur), id1, "late revision")
	})
	uassert.PanicsWithMessage(t, cur, "hearthbounty: can only top up open or claimed bounties", func() {
		validateTopUpTarget(bystander, id1, 100000)
	})

	// Cancel Bounty #2 -> all replay attempts must abort.
	sponsorBefore := EscrowBalance(sponsor)
	CancelBounty(cross(cur), id2)
	uassert.Equal(t, sponsorBefore+1000000, EscrowBalance(sponsor))
	uassert.AbortsWithMessage(t, cur, "hearthbounty: only open bounties can be cancelled", func() {
		CancelBounty(cross(cur), id2)
	})
	testing.SetOriginCaller(hunterB)
	testing.SetRealm(testing.NewUserRealm(hunterB))
	uassert.AbortsWithMessage(t, cur, "hearthbounty: bounty is not open for claiming", func() {
		ClaimBounty(cross(cur), id2, "claim cancelled")
	})
	uassert.PanicsWithMessage(t, cur, "hearthbounty: can only top up open or claimed bounties", func() {
		validateTopUpTarget(bystander, id2, 100000)
	})

	// Dispute double-resolve and post-resolve ExpireDispute must abort.
	testing.SetRealm(testing.NewUserRealm(sponsor))
	prepCoins(sponsor, 1000000)
	wugnot.Deposit(cross(cur))
	testing.SetOriginSend(chain.Coins{})
	wugnot.Approve(cross(cur), realmAddr, 1000000)
	id3 := PostBounty(cross(cur), "Dispute Replay Guard", "Verify resolved dispute cannot be replayed or expired.", "audit", 1000000, 20)
	testing.SetOriginCaller(hunterA)
	testing.SetRealm(testing.NewUserRealm(hunterA))
	ClaimBounty(cross(cur), id3, "Working on dispute replay test")
	SubmitProof(cross(cur), id3, "https://github.com/hearthbounty/v1/pull/102", "sha256:bbbbbbbbbbbbbbbb", "Submitted for dispute replay guard.")
	OpenDispute(cross(cur), id3, "Escalating to test replay guard.")

	testing.SetOriginCaller(arb)
	testing.SetRealm(testing.NewUserRealm(arb))
	ResolveDispute(cross(cur), id3, 6000, "Resolved 60/40 once.")
	uassert.AbortsWithMessage(t, cur, "hearthbounty: bounty is not disputed", func() {
		ResolveDispute(cross(cur), id3, 6000, "double resolve")
	})
	testing.SkipHeights(25)
	uassert.AbortsWithMessage(t, cur, "hearthbounty: bounty is not disputed", func() {
		ExpireDispute(cross(cur), id3)
	})

	assertEscrowInvariant(t, realmAddr, baseRealmBal)
	assertStatusCountsConserved(t)
	uassert.Equal(t, int64(0), GetStats().TotalEscrowUgnot)
}

// Exhaustive authorization and input-validation matrix across all crossing roles.
func TestUnauthorizedAccessControlMatrix(cur realm, t *testing.T) {
	arb := testutils.TestAddress("adv_ac_arb")
	sponsor := testutils.TestAddress("adv_ac_sponsor")
	donor := testutils.TestAddress("adv_ac_donor")
	hunter := testutils.TestAddress("adv_ac_hunter")
	bystander := testutils.TestAddress("adv_ac_bystander")
	realmAddr := chain.PackageAddress(testRealmPath)

	testing.SetRealm(testing.NewUserRealm(arb))
	resetState(arb)
	baseRealmBal := EscrowBalance(realmAddr)

	// SetArbiter: non-arbiter and invalid address rejected.
	testing.SetOriginCaller(bystander)
	testing.SetRealm(testing.NewUserRealm(bystander))
	uassert.AbortsWithMessage(t, cur, "hearthbounty: only current arbiter may transfer arbiter role", func() {
		SetArbiter(cross(cur), bystander)
	})
	testing.SetOriginCaller(arb)
	testing.SetRealm(testing.NewUserRealm(arb))
	uassert.AbortsWithMessage(t, cur, "hearthbounty: next arbiter address is invalid", func() {
		SetArbiter(cross(cur), address(""))
	})
	uassert.AbortsWithMessage(t, cur, "hearthbounty: next arbiter address is invalid", func() {
		SetArbiter(cross(cur), address("not_a_valid_address"))
	})

	// Post and crowd-fund a bounty.
	testing.SetRealm(testing.NewUserRealm(sponsor))
	prepCoins(sponsor, 1000000)
	wugnot.Deposit(cross(cur))
	testing.SetOriginSend(chain.Coins{})
	wugnot.Approve(cross(cur), realmAddr, 1000000)
	id := PostBounty(cross(cur), "Access Control Matrix Quest", "Exercise every role authorization boundary cleanly.", "audit", 1000000, 30)

	testing.SetRealm(testing.NewUserRealm(donor))
	prepCoins(donor, 200000)
	wugnot.Deposit(cross(cur))
	testing.SetOriginSend(chain.Coins{})
	wugnot.Approve(cross(cur), realmAddr, 200000)
	TopUpBounty(cross(cur), id, 200000)

	// Non-sponsor cannot cancel an Open bounty (donor, hunter, arbiter, bystander).
	for _, bad := range []address{donor, hunter, arb, bystander} {
		testing.SetOriginCaller(bad)
		testing.SetRealm(testing.NewUserRealm(bad))
		uassert.AbortsWithMessage(t, cur, "hearthbounty: only the sponsor may cancel", func() {
			CancelBounty(cross(cur), id)
		})
	}

	// Claim by hunter.
	testing.SetOriginCaller(hunter)
	testing.SetRealm(testing.NewUserRealm(hunter))
	ClaimBounty(cross(cur), id, "Authorized claimant")

	// SubmitProof rejected for sponsor, bystander, donor.
	for _, bad := range []address{sponsor, bystander, donor} {
		testing.SetOriginCaller(bad)
		testing.SetRealm(testing.NewUserRealm(bad))
		uassert.AbortsWithMessage(t, cur, "hearthbounty: only the active claimant may submit proof", func() {
			SubmitProof(cross(cur), id, "https://github.com/org/repo/pull/1", "sha256:12345678", "Unauthorized submit")
		})
	}

	// SubmitProof rejects non-https URLs, whitespace, and short URLs.
	testing.SetOriginCaller(hunter)
	testing.SetRealm(testing.NewUserRealm(hunter))
	uassert.AbortsWithMessage(t, cur, "hearthbounty: proof URL must start with https://", func() {
		SubmitProof(cross(cur), id, "javascript:alert(1)", "sha256:12345678", "XSS scheme attempt")
	})
	uassert.AbortsWithMessage(t, cur, "hearthbounty: proof URL must not contain whitespace", func() {
		SubmitProof(cross(cur), id, "https://github.com/org/repo/pull/1 evil", "sha256:12345678", "Space in URL")
	})
	uassert.AbortsWithMessage(t, cur, "hearthbounty: proof URL is too short", func() {
		SubmitProof(cross(cur), id, "https://a.b", "sha256:12345678", "Too short URL")
	})
	SubmitProof(cross(cur), id, "https://github.com/hearthbounty/v1/pull/200", "sha256:cccccccccccccccc", "Valid HTTPS proof submission.")

	// RequestRevision rejected for non-sponsor.
	for _, bad := range []address{hunter, bystander, arb} {
		testing.SetOriginCaller(bad)
		testing.SetRealm(testing.NewUserRealm(bad))
		uassert.AbortsWithMessage(t, cur, "hearthbounty: only the sponsor may request a revision", func() {
			RequestRevision(cross(cur), id, "Unauthorized revision")
		})
	}

	// ApproveAndSettle rejected for non-sponsor and invalid ratings (0, 6).
	for _, bad := range []address{hunter, donor, arb, bystander} {
		testing.SetOriginCaller(bad)
		testing.SetRealm(testing.NewUserRealm(bad))
		uassert.AbortsWithMessage(t, cur, "hearthbounty: only the sponsor may approve and settle", func() {
			ApproveAndSettle(cross(cur), id, 5, "unauthorized settle")
		})
	}
	testing.SetOriginCaller(sponsor)
	testing.SetRealm(testing.NewUserRealm(sponsor))
	uassert.AbortsWithMessage(t, cur, "hearthcore: rating must be between 1 and 5", func() {
		ApproveAndSettle(cross(cur), id, 0, "zero rating")
	})
	uassert.AbortsWithMessage(t, cur, "hearthcore: rating must be between 1 and 5", func() {
		ApproveAndSettle(cross(cur), id, 6, "six rating")
	})

	// OpenDispute rejected for non-parties (arbiter, donor, bystander); allowed for sponsor.
	for _, bad := range []address{arb, donor, bystander} {
		testing.SetOriginCaller(bad)
		testing.SetRealm(testing.NewUserRealm(bad))
		uassert.AbortsWithMessage(t, cur, "hearthbounty: only sponsor or claimant may open a dispute", func() {
			OpenDispute(cross(cur), id, "Third-party dispute attempt")
		})
	}
	testing.SetOriginCaller(sponsor)
	testing.SetRealm(testing.NewUserRealm(sponsor))
	OpenDispute(cross(cur), id, "Sponsor escalating incomplete deliverable.")

	// ResolveDispute rejected for non-arbiter and out-of-range bps.
	uassert.AbortsWithMessage(t, cur, "hearthbounty: only the arbiter may resolve disputes", func() {
		ResolveDispute(cross(cur), id, 5000, "sponsor cannot arbitrate")
	})
	testing.SetOriginCaller(arb)
	testing.SetRealm(testing.NewUserRealm(arb))
	uassert.AbortsWithMessage(t, cur, "hearthcore: hunterBps exceeds 10000", func() {
		ResolveDispute(cross(cur), id, 10001, "overflow bps")
	})

	// Conflicted arbiter == sponsor must ALSO be rejected.
	SetArbiter(cross(cur), sponsor)
	testing.SetOriginCaller(sponsor)
	testing.SetRealm(testing.NewUserRealm(sponsor))
	uassert.AbortsWithMessage(t, cur, "hearthbounty: arbiter cannot resolve a bounty they are party to", func() {
		ResolveDispute(cross(cur), id, 0, "sponsor-as-arbiter self refund attempt")
	})

	// Rotate arbiter back to neutral party and resolve cleanly.
	SetArbiter(cross(cur), arb)
	testing.SetOriginCaller(arb)
	testing.SetRealm(testing.NewUserRealm(arb))
	ResolveDispute(cross(cur), id, 5000, "Neutral arbiter split.")
	assertEscrowInvariant(t, realmAddr, baseRealmBal)
	assertStatusCountsConserved(t)
}

// Table-driven conservation test across awkward prime contributions and every
// extreme basis-point split (0, 1, 333, 3333, 5000, 6667, 9999, 10000).
// Proves sum(payouts + refunds) == exact escrow to the last single 1 wugnot.
func TestMultiDonorProRataAccountingConservationTable(cur realm, t *testing.T) {
	arb := testutils.TestAddress("adv_cons_arb")
	sponsor := testutils.TestAddress("adv_cons_sponsor")
	donor1 := testutils.TestAddress("adv_cons_d1")
	donor2 := testutils.TestAddress("adv_cons_d2")
	donor3 := testutils.TestAddress("adv_cons_d3")
	hunter := testutils.TestAddress("adv_cons_hunter")
	realmAddr := chain.PackageAddress(testRealmPath)

	testing.SetRealm(testing.NewUserRealm(arb))
	resetState(arb)
	baseRealmBal := EscrowBalance(realmAddr)

	bpsCases := []uint64{0, 1, 333, 3333, 5000, 6667, 9999, 10000}
	const (
		spAmt int64 = 100001
		d1Amt int64 = 100003
		d2Amt int64 = 100007
		d3Amt int64 = 100009
		total int64 = spAmt + d1Amt + d2Amt + d3Amt // 400,020
	)

	expectedSettledCount := uint64(0)
	for i, bps := range bpsCases {
		testing.SetRealm(testing.NewUserRealm(sponsor))
		prepCoins(sponsor, spAmt)
		wugnot.Deposit(cross(cur))
		testing.SetOriginSend(chain.Coins{})
		wugnot.Approve(cross(cur), realmAddr, spAmt)
		id := PostBounty(cross(cur), "Conservation Case #"+strconv.Itoa(i), "Prime-amount multi-donor dispute split conservation check.", "audit", spAmt, 20)

		testing.SetRealm(testing.NewUserRealm(donor1))
		prepCoins(donor1, d1Amt)
		wugnot.Deposit(cross(cur))
		testing.SetOriginSend(chain.Coins{})
		wugnot.Approve(cross(cur), realmAddr, d1Amt)
		TopUpBounty(cross(cur), id, d1Amt)

		testing.SetRealm(testing.NewUserRealm(donor2))
		prepCoins(donor2, d2Amt)
		wugnot.Deposit(cross(cur))
		testing.SetOriginSend(chain.Coins{})
		wugnot.Approve(cross(cur), realmAddr, d2Amt)
		TopUpBounty(cross(cur), id, d2Amt)

		testing.SetRealm(testing.NewUserRealm(donor3))
		prepCoins(donor3, d3Amt)
		wugnot.Deposit(cross(cur))
		testing.SetOriginSend(chain.Coins{})
		wugnot.Approve(cross(cur), realmAddr, d3Amt)
		TopUpBounty(cross(cur), id, d3Amt)

		testing.SetOriginCaller(hunter)
		testing.SetRealm(testing.NewUserRealm(hunter))
		ClaimBounty(cross(cur), id, "Testing exact conservation")
		SubmitProof(cross(cur), id, "https://github.com/hearthbounty/v1/pull/"+strconv.Itoa(300+i), "sha256:dddddddddddddddd", "Proof for prime split test.")
		OpenDispute(cross(cur), id, "Testing pro-rata conservation across 4 contributors.")

		hBefore := EscrowBalance(hunter)
		sBefore := EscrowBalance(sponsor)
		d1Before := EscrowBalance(donor1)
		d2Before := EscrowBalance(donor2)
		d3Before := EscrowBalance(donor3)

		testing.SetOriginCaller(arb)
		testing.SetRealm(testing.NewUserRealm(arb))
		ResolveDispute(cross(cur), id, bps, "Prime split verification")

		hDelta := EscrowBalance(hunter) - hBefore
		sDelta := EscrowBalance(sponsor) - sBefore
		d1Delta := EscrowBalance(donor1) - d1Before
		d2Delta := EscrowBalance(donor2) - d2Before
		d3Delta := EscrowBalance(donor3) - d3Before

		// Exact 1-wugnot conservation: zero dust lost or created.
		uassert.True(t, hDelta >= 0 && sDelta >= 0 && d1Delta >= 0 && d2Delta >= 0 && d3Delta >= 0)
		uassert.Equal(t, total, hDelta+sDelta+d1Delta+d2Delta+d3Delta)

		if bps == 0 {
			uassert.Equal(t, int64(0), hDelta)
			uassert.Equal(t, spAmt, sDelta)
			uassert.Equal(t, d1Amt, d1Delta)
			uassert.Equal(t, d2Amt, d2Delta)
			uassert.Equal(t, d3Amt, d3Delta)
		} else if bps == 10000 {
			uassert.Equal(t, total, hDelta)
			uassert.Equal(t, int64(0), sDelta+d1Delta+d2Delta+d3Delta)
		}

		if hDelta > 0 {
			expectedSettledCount++
		}
		hp, _ := GetProfile(hunter)
		uassert.Equal(t, expectedSettledCount, hp.SettledCount)
		assertEscrowInvariant(t, realmAddr, baseRealmBal)
	}

	uassert.Equal(t, int64(0), GetStats().TotalEscrowUgnot)
	assertStatusCountsConserved(t)
}

// Verifies sponsor self-top-up, exact MaxExternalDonors (20) cap, repeat top-ups
// by existing donors, MaxEscrowUgnot overflow ceiling, and zero/negative guards.
func TestSponsorSelfTopUpExternalDonorCapAndCeiling(cur realm, t *testing.T) {
	arb := testutils.TestAddress("adv_cap_arb")
	sponsor := testutils.TestAddress("adv_cap_sponsor")
	realmAddr := chain.PackageAddress(testRealmPath)

	testing.SetRealm(testing.NewUserRealm(arb))
	resetState(arb)
	baseRealmBal := EscrowBalance(realmAddr)

	// Zero, negative, dust, and above-ceiling amounts must abort before state mutation.
	uassert.PanicsWithMessage(t, cur, "hearthbounty: escrow amount is below minimum required (100000 wugnot)", func() {
		validateEscrowAmount(0, hearthcore.MinRewardUgnot)
	})
	uassert.PanicsWithMessage(t, cur, "hearthbounty: escrow amount is below minimum required (100000 wugnot)", func() {
		validateEscrowAmount(-500000, hearthcore.MinRewardUgnot)
	})
	uassert.PanicsWithMessage(t, cur, "hearthbounty: escrow amount exceeds single-bounty safety ceiling", func() {
		validateEscrowAmount(MaxEscrowUgnot+1, hearthcore.MinRewardUgnot)
	})

	// Sponsor posts 0.50 GNOT and tops up +0.30 GNOT (SponsorFundedUgnot = 0.80 GNOT).
	testing.SetRealm(testing.NewUserRealm(sponsor))
	prepCoins(sponsor, 800000)
	wugnot.Deposit(cross(cur))
	testing.SetOriginSend(chain.Coins{})
	wugnot.Approve(cross(cur), realmAddr, 800000)
	id := PostBounty(cross(cur), "External Donor Cap Verification", "Fill all 20 external donor slots and verify 21st aborts.", "realm", 500000, 50)
	TopUpBounty(cross(cur), id, 300000)

	b, _ := GetBounty(id)
	uassert.Equal(t, int64(800000), b.SponsorFundedUgnot)
	uassert.Equal(t, int64(0), b.ExternalTopUpUgnot)
	uassert.Equal(t, 0, b.ExternalDonorCount)

	// Fill all 20 distinct external donor slots (100,000 wugnot each).
	donors := make([]address, MaxExternalDonors)
	for i := 0; i < MaxExternalDonors; i++ {
		d := testutils.TestAddress("adv_cap_donor_" + strconv.Itoa(i))
		donors[i] = d
		testing.SetRealm(testing.NewUserRealm(d))
		prepCoins(d, 100000)
		wugnot.Deposit(cross(cur))
		testing.SetOriginSend(chain.Coins{})
		wugnot.Approve(cross(cur), realmAddr, 100000)
		TopUpBounty(cross(cur), id, 100000)
	}

	b, _ = GetBounty(id)
	uassert.Equal(t, MaxExternalDonors, b.ExternalDonorCount)
	uassert.Equal(t, int64(2000000), b.ExternalTopUpUgnot)
	uassert.Equal(t, int64(2800000), b.EscrowUgnot)

	// 21st distinct external donor must be rejected by MaxExternalDonors cap.
	donor21 := testutils.TestAddress("adv_cap_donor_21")
	uassert.PanicsWithMessage(t, cur, "hearthbounty: external donor cap reached for this bounty", func() {
		validateTopUpTarget(donor21, id, 100000)
	})

	// Exceeding MaxEscrowUgnot cumulative ceiling must be rejected.
	uassert.PanicsWithMessage(t, cur, "hearthbounty: escrow total exceeds single-bounty safety ceiling", func() {
		validateTopUpTarget(donors[0], id, MaxEscrowUgnot-2700000)
	})

	// Existing donor #0 CAN still top up again even when 20 donor slots are full.
	testing.SetRealm(testing.NewUserRealm(donors[0]))
	prepCoins(donors[0], 150000)
	wugnot.Deposit(cross(cur))
	testing.SetOriginSend(chain.Coins{})
	wugnot.Approve(cross(cur), realmAddr, 150000)
	TopUpBounty(cross(cur), id, 150000)
	uassert.Equal(t, int64(250000), GetDonorContribution(id, donors[0]))
	uassert.Equal(t, int64(2950000), GetStats().TotalEscrowUgnot)

	// CancelBounty refunds Sponsor 800,000 and all 20 donors their exact amounts.
	spBefore := EscrowBalance(sponsor)
	d0Before := EscrowBalance(donors[0])
	d19Before := EscrowBalance(donors[19])

	testing.SetOriginCaller(sponsor)
	testing.SetRealm(testing.NewUserRealm(sponsor))
	CancelBounty(cross(cur), id)

	uassert.Equal(t, spBefore+800000, EscrowBalance(sponsor))
	uassert.Equal(t, d0Before+250000, EscrowBalance(donors[0]))
	uassert.Equal(t, d19Before+100000, EscrowBalance(donors[19]))
	uassert.Equal(t, int64(0), GetStats().TotalEscrowUgnot)
	assertEscrowInvariant(t, realmAddr, baseRealmBal)
	assertStatusCountsConserved(t)
}

// Verifies voluntary early claim step-down by claimant, exact off-by-one deadline
// release checks, donor custody preservation across reclaims, and full settlement.
func TestVoluntaryClaimReleaseAndReclaimPreservesDonorCustody(cur realm, t *testing.T) {
	arb := testutils.TestAddress("adv_rel_arb")
	sponsor := testutils.TestAddress("adv_rel_sponsor")
	donor := testutils.TestAddress("adv_rel_donor")
	hunterA := testutils.TestAddress("adv_rel_hunter_a")
	hunterB := testutils.TestAddress("adv_rel_hunter_b")
	bystander := testutils.TestAddress("adv_rel_bystander")
	realmAddr := chain.PackageAddress(testRealmPath)

	testing.SetRealm(testing.NewUserRealm(arb))
	resetState(arb)
	baseRealmBal := EscrowBalance(realmAddr)

	testing.SetRealm(testing.NewUserRealm(sponsor))
	prepCoins(sponsor, 600000)
	wugnot.Deposit(cross(cur))
	testing.SetOriginSend(chain.Coins{})
	wugnot.Approve(cross(cur), realmAddr, 600000)
	id := PostBounty(cross(cur), "Reclaim Custody Preservation", "Verify voluntary step-down and reclaim preserve donor shares.", "tool", 600000, 15)

	testing.SetRealm(testing.NewUserRealm(donor))
	prepCoins(donor, 400000)
	wugnot.Deposit(cross(cur))
	testing.SetOriginSend(chain.Coins{})
	wugnot.Approve(cross(cur), realmAddr, 400000)
	TopUpBounty(cross(cur), id, 400000)

	// Hunter A claims, then voluntarily steps down BEFORE deadline.
	testing.SetOriginCaller(hunterA)
	testing.SetRealm(testing.NewUserRealm(hunterA))
	ClaimBounty(cross(cur), id, "Will step down voluntarily")
	ReleaseExpiredClaim(cross(cur), id)

	hpA, _ := GetProfile(hunterA)
	uassert.Equal(t, uint64(0), hpA.ClaimedCount)
	uassert.Equal(t, int64(400000), GetDonorContribution(id, donor))

	// Hunter B claims; bystander fails at DeadlineHeight - 1, succeeds at exact DeadlineHeight.
	testing.SetOriginCaller(hunterB)
	testing.SetRealm(testing.NewUserRealm(hunterB))
	ClaimBounty(cross(cur), id, "Second claimant")

	testing.SkipHeights(14)
	testing.SetOriginCaller(bystander)
	testing.SetRealm(testing.NewUserRealm(bystander))
	uassert.AbortsWithMessage(t, cur, "hearthbounty: claim deadline has not expired yet", func() {
		ReleaseExpiredClaim(cross(cur), id)
	})

	testing.SkipHeights(1) // now at exact DeadlineHeight (+15)
	ReleaseExpiredClaim(cross(cur), id)
	hpB, _ := GetProfile(hunterB)
	uassert.Equal(t, uint64(0), hpB.ClaimedCount)

	// Hunter A reclaims, submits, and sponsor settles -> receives full 1.00 GNOT (sponsor + donor).
	testing.SetOriginCaller(hunterA)
	testing.SetRealm(testing.NewUserRealm(hunterA))
	ClaimBounty(cross(cur), id, "Reclaiming after expiry")
	SubmitProof(cross(cur), id, "https://github.com/hearthbounty/v1/pull/401", "sha256:eeeeeeeeeeeeeeee", "Completed after reclaim.")

	hABefore := EscrowBalance(hunterA)
	testing.SetOriginCaller(sponsor)
	testing.SetRealm(testing.NewUserRealm(sponsor))
	ApproveAndSettle(cross(cur), id, 5, "Great recovery.")
	uassert.Equal(t, hABefore+1000000, EscrowBalance(hunterA))
	assertEscrowInvariant(t, realmAddr, baseRealmBal)
}

// Verifies off-by-one timeout boundaries for ExpireSubmission and ExpireDispute,
// RequestRevision deadline reset, and zero-rating preservation on auto-settle.
func TestReviewAndDisputeTimeoutOffByOneBoundaries(cur realm, t *testing.T) {
	arb := testutils.TestAddress("adv_to_arb")
	sponsor := testutils.TestAddress("adv_to_sponsor")
	donor1 := testutils.TestAddress("adv_to_d1")
	donor2 := testutils.TestAddress("adv_to_d2")
	hunter := testutils.TestAddress("adv_to_hunter")
	bystander := testutils.TestAddress("adv_to_bystander")
	realmAddr := chain.PackageAddress(testRealmPath)

	testing.SetRealm(testing.NewUserRealm(arb))
	resetState(arb)
	baseRealmBal := EscrowBalance(realmAddr)

	// Bounty 1: Submission -> RequestRevision clears ReviewDeadline -> Resubmit -> Expire at exact +20.
	testing.SetRealm(testing.NewUserRealm(sponsor))
	prepCoins(sponsor, 1000000)
	wugnot.Deposit(cross(cur))
	testing.SetOriginSend(chain.Coins{})
	wugnot.Approve(cross(cur), realmAddr, 1000000)
	id1 := PostBounty(cross(cur), "Review Boundary Test", "Check exact ReviewDeadlineHeight-1 rejection and exact expiry.", "realm", 1000000, 20)

	testing.SetOriginCaller(hunter)
	testing.SetRealm(testing.NewUserRealm(hunter))
	ClaimBounty(cross(cur), id1, "Working")
	SubmitProof(cross(cur), id1, "https://github.com/hearthbounty/v1/pull/501", "sha256:1111111111111111", "First proof draft.")

	testing.SetOriginCaller(sponsor)
	testing.SetRealm(testing.NewUserRealm(sponsor))
	RequestRevision(cross(cur), id1, "Expand boundary tests.")
	b1, _ := GetBounty(id1)
	uassert.Equal(t, int64(0), b1.ReviewDeadlineHeight)

	// ExpireSubmission must fail while back in Claimed status.
	testing.SetOriginCaller(bystander)
	testing.SetRealm(testing.NewUserRealm(bystander))
	uassert.AbortsWithMessage(t, cur, "hearthbounty: bounty has no pending submission", func() {
		ExpireSubmission(cross(cur), id1)
	})

	testing.SetOriginCaller(hunter)
	testing.SetRealm(testing.NewUserRealm(hunter))
	SubmitProof(cross(cur), id1, "https://github.com/hearthbounty/v1/pull/502", "sha256:2222222222222222", "Second proof with full tests.")

	// Height = ReviewDeadlineHeight - 1 must abort.
	testing.SkipHeights(19)
	testing.SetOriginCaller(bystander)
	testing.SetRealm(testing.NewUserRealm(bystander))
	uassert.AbortsWithMessage(t, cur, "hearthbounty: submission review window has not expired yet", func() {
		ExpireSubmission(cross(cur), id1)
	})

	// Height = ReviewDeadlineHeight -> settles 100% with Rating == 0 (unrated).
	hBefore := EscrowBalance(hunter)
	testing.SkipHeights(1)
	ExpireSubmission(cross(cur), id1)
	uassert.Equal(t, hBefore+1000000, EscrowBalance(hunter))
	hp, _ := GetProfile(hunter)
	uassert.Equal(t, uint64(0), hp.RatingCount)
	uassert.Equal(t, uint64(0), hp.RatingSum)

	// Bounty 2: Dispute timeout off-by-one with 2 external donors -> exact 50/50 pro-rata split.
	testing.SetRealm(testing.NewUserRealm(sponsor))
	prepCoins(sponsor, 600000)
	wugnot.Deposit(cross(cur))
	testing.SetOriginSend(chain.Coins{})
	wugnot.Approve(cross(cur), realmAddr, 600000)
	id2 := PostBounty(cross(cur), "Dispute Boundary Test", "Check exact DisputeDeadlineHeight-1 rejection and 50/50 multi-donor split.", "audit", 600000, 15)

	testing.SetRealm(testing.NewUserRealm(donor1))
	prepCoins(donor1, 300000)
	wugnot.Deposit(cross(cur))
	testing.SetOriginSend(chain.Coins{})
	wugnot.Approve(cross(cur), realmAddr, 300000)
	TopUpBounty(cross(cur), id2, 300000)

	testing.SetRealm(testing.NewUserRealm(donor2))
	prepCoins(donor2, 100000)
	wugnot.Deposit(cross(cur))
	testing.SetOriginSend(chain.Coins{})
	wugnot.Approve(cross(cur), realmAddr, 100000)
	TopUpBounty(cross(cur), id2, 100000)

	testing.SetOriginCaller(hunter)
	testing.SetRealm(testing.NewUserRealm(hunter))
	ClaimBounty(cross(cur), id2, "Claiming for dispute timeout")
	SubmitProof(cross(cur), id2, "https://github.com/hearthbounty/v1/pull/503", "sha256:3333333333333333", "Dispute timeout deliverable.")
	OpenDispute(cross(cur), id2, "Sponsor unresponsive; opening dispute.")

	testing.SkipHeights(14)
	testing.SetOriginCaller(bystander)
	testing.SetRealm(testing.NewUserRealm(bystander))
	uassert.AbortsWithMessage(t, cur, "hearthbounty: dispute resolution window has not expired yet", func() {
		ExpireDispute(cross(cur), id2)
	})

	hB2 := EscrowBalance(hunter)
	sB2 := EscrowBalance(sponsor)
	d1B2 := EscrowBalance(donor1)
	d2B2 := EscrowBalance(donor2)

	testing.SkipHeights(1)
	ExpireDispute(cross(cur), id2)

	// 50% of 1.00 GNOT = 500k hunter; 50% refunds: 300k sponsor, 150k donor1, 50k donor2.
	uassert.Equal(t, hB2+500000, EscrowBalance(hunter))
	uassert.Equal(t, sB2+300000, EscrowBalance(sponsor))
	uassert.Equal(t, d1B2+150000, EscrowBalance(donor1))
	uassert.Equal(t, d2B2+50000, EscrowBalance(donor2))
	assertEscrowInvariant(t, realmAddr, baseRealmBal)
	assertStatusCountsConserved(t)
}

// Verifies SponsoredUgnot accounting remains isolated across multiple bounties
// when one bounty is cancelled and another settles via partial dispute split.
func TestCrossBountySponsoredCreditIsolation(cur realm, t *testing.T) {
	arb := testutils.TestAddress("adv_cred_arb")
	sponsor := testutils.TestAddress("adv_cred_sponsor")
	donor := testutils.TestAddress("adv_cred_donor")
	hunter := testutils.TestAddress("adv_cred_hunter")
	realmAddr := chain.PackageAddress(testRealmPath)

	testing.SetRealm(testing.NewUserRealm(arb))
	resetState(arb)
	baseRealmBal := EscrowBalance(realmAddr)

	testing.SetRealm(testing.NewUserRealm(sponsor))
	prepCoins(sponsor, 3000000)
	wugnot.Deposit(cross(cur))
	testing.SetOriginSend(chain.Coins{})
	wugnot.Approve(cross(cur), realmAddr, 3000000)
	id1 := PostBounty(cross(cur), "Credit Isolation #1", "First bounty to be cancelled.", "docs", 1000000, 20)
	id2 := PostBounty(cross(cur), "Credit Isolation #2", "Second bounty to settle 40/60 via dispute.", "realm", 2000000, 20)

	testing.SetRealm(testing.NewUserRealm(donor))
	prepCoins(donor, 1200000)
	wugnot.Deposit(cross(cur))
	testing.SetOriginSend(chain.Coins{})
	wugnot.Approve(cross(cur), realmAddr, 1200000)
	TopUpBounty(cross(cur), id1, 500000)
	TopUpBounty(cross(cur), id2, 700000)

	sp, _ := GetProfile(sponsor)
	dp, _ := GetProfile(donor)
	uassert.Equal(t, int64(3000000), sp.SponsoredUgnot)
	uassert.Equal(t, int64(1200000), dp.SponsoredUgnot)

	// Cancel Bounty #1 -> subtract only Bounty #1 contributions.
	testing.SetOriginCaller(sponsor)
	testing.SetRealm(testing.NewUserRealm(sponsor))
	CancelBounty(cross(cur), id1)

	sp, _ = GetProfile(sponsor)
	dp, _ = GetProfile(donor)
	uassert.Equal(t, int64(2000000), sp.SponsoredUgnot)
	uassert.Equal(t, int64(700000), dp.SponsoredUgnot)

	// Settle Bounty #2 via 40% hunter / 60% refund dispute -> subtract only refunded 60%.
	testing.SetOriginCaller(hunter)
	testing.SetRealm(testing.NewUserRealm(hunter))
	ClaimBounty(cross(cur), id2, "Claiming #2")
	SubmitProof(cross(cur), id2, "https://github.com/hearthbounty/v1/pull/601", "sha256:4444444444444444", "Partial deliverable.")
	OpenDispute(cross(cur), id2, "Requesting 40/60 split.")

	testing.SetOriginCaller(arb)
	testing.SetRealm(testing.NewUserRealm(arb))
	ResolveDispute(cross(cur), id2, 4000, "40% paid to hunter, 60% refunded.")

	// Net kept: 40% of 2,000,000 = 800,000 (sponsor); 40% of 700,000 = 280,000 (donor).
	sp, _ = GetProfile(sponsor)
	dp, _ = GetProfile(donor)
	uassert.Equal(t, int64(800000), sp.SponsoredUgnot)
	uassert.Equal(t, int64(280000), dp.SponsoredUgnot)
	assertEscrowInvariant(t, realmAddr, baseRealmBal)
}

// Verifies Render(path) XSS, HTML, Markdown-table, TeX-math, and multi-Unicode
// <gno-*> directive neutralization across EVERY user-controlled text field.
func TestRenderXSSMarkdownAndUnicodeInjectionMatrix(cur realm, t *testing.T) {
	arb := testutils.TestAddress("adv_xss_arb")
	sponsor := testutils.TestAddress("adv_xss_sponsor")
	hunter := testutils.TestAddress("adv_xss_hunter")
	realmAddr := chain.PackageAddress(testRealmPath)

	testing.SetRealm(testing.NewUserRealm(arb))
	resetState(arb)

	// Multi-Unicode expanding fold stress checks on NeutralizeGnoTags.
	vectors := []string{
		`İ<gno-form exec="Drain"></gno-form>`,
		`İİİ<GNO-BUTTON href="/r/evil" />`,
		`ßİ<gNo-CoLuMnS>hack</gNo-CoLuMnS>`,
		`prefix İ<gno-input name="x" /> suffix İ</gno-frame>`,
	}
	for _, v := range vectors {
		out := NeutralizeGnoTags(v)
		lower := strings.ToLower(out)
		uassert.False(t, strings.Contains(lower, "<gno-"))
		uassert.False(t, strings.Contains(lower, "</gno-"))
	}

	// Register adversarial profile fields for hunter.
	testing.SetOriginCaller(hunter)
	testing.SetRealm(testing.NewUserRealm(hunter))
	RegisterProfile(
		cross(cur),
		`İ<gno-button/>|evil`,
		`İ<gno-form exec="Drain">bio</gno-form> <script>alert(1)</script> $$x+y$$`,
		`gno,İ<gno-input/>,$GNOT`,
		`mcp://İ<gno-form/>`,
	)

	testing.SetRealm(testing.NewUserRealm(sponsor))
	prepCoins(sponsor, 1000000)
	wugnot.Deposit(cross(cur))
	testing.SetOriginSend(chain.Coins{})
	wugnot.Approve(cross(cur), realmAddr, 1000000)
	id := PostBounty(
		cross(cur),
		`İ<gno-form exec="Steal"/> | col | $100`,
		"İİ<gno-form exec=\"Drain\">\n</gno-form>\n<script>alert(1)</script> <img src=x onerror=alert(1)> $$1+1$$",
		"audit",
		1000000,
		30,
	)

	testing.SetOriginCaller(hunter)
	testing.SetRealm(testing.NewUserRealm(hunter))
	ClaimBounty(cross(cur), id, `Plan: İ<gno-button href="/r/evil" /> $GNOT`)
	SubmitProof(cross(cur), id, "https://github.com/hearthbounty/v1/pull/777", "sha256:5555555555555555", `İ<gno-form exec="Drain">summary</gno-form> $50`)

	testing.SetOriginCaller(sponsor)
	testing.SetRealm(testing.NewUserRealm(sponsor))
	RequestRevision(cross(cur), id, `Fix İ<gno-button href="/r/evil" />`)

	testing.SetOriginCaller(hunter)
	testing.SetRealm(testing.NewUserRealm(hunter))
	SubmitProof(cross(cur), id, "https://github.com/hearthbounty/v1/pull/777", "sha256:6666666666666666", `Clean İ<gno-form exec="Drain"/>`)
	OpenDispute(cross(cur), id, `Reason İ<gno-button href="/r/evil" />`)

	// Check disputed detail page before resolving: every <gno-*> directive and
	// TeX math delimiter across Title, Spec, ClaimNote, ProofSummary, RevisionFeedback,
	// and DisputeReason must be neutralized (while safeInline/safeCell also escapes HTML <script>).
	disputedView := Render("bounty/1")
	uassert.False(t, strings.Contains(disputedView, `<gno-form exec="Drain"`))
	uassert.False(t, strings.Contains(disputedView, `<gno-form exec="Steal"`))
	uassert.False(t, strings.Contains(disputedView, `<gno-button href="/r/evil"`))
	uassert.True(t, strings.Contains(disputedView, `\$100`))
	uassert.True(t, strings.Contains(disputedView, `\$\$1+1\$\$`))

	testing.SetOriginCaller(arb)
	testing.SetRealm(testing.NewUserRealm(arb))
	ResolveDispute(cross(cur), id, 5000, `Resolved İ<gno-form exec="Drain"/> <script>alert(1)</script>`)

	pages := []string{
		Render(""),
		Render("bounty/1"),
		Render("leaderboard"),
		Render("profile/" + string(hunter)),
		Render(`unknown/İ<gno-form exec="Steal"/> <script>alert(2)</script>`),
	}
	for _, p := range pages {
		uassert.False(t, strings.Contains(p, `<gno-form exec="Drain"`))
		uassert.False(t, strings.Contains(p, `<gno-form exec="Steal"`))
		uassert.False(t, strings.Contains(p, `<gno-button href="/r/evil"`))
		uassert.False(t, strings.Contains(p, `<gno-input/>`))
	}
	// Inline/table-cell slots also escape raw HTML tags and pipes directly.
	uassert.False(t, strings.Contains(Render(`unknown/<script>alert(2)</script>`), `<script>alert(2)</script>`))
	uassert.False(t, strings.Contains(Render("bounty/1"), `Resolved İ&lt;gno-form exec="Drain"/&gt; <script>`))
	uassert.True(t, strings.Contains(Render(""), `\| col \|`))
}

// Verifies paginated gnoweb board rendering across > BoardPageSize (20) bounties
// and safe NotFound handling on malformed routes.
func TestBoardPaginationAndNotFoundRoutes(cur realm, t *testing.T) {
	arb := testutils.TestAddress("adv_pg_arb")
	sponsor := testutils.TestAddress("adv_pg_sponsor")
	realmAddr := chain.PackageAddress(testRealmPath)

	testing.SetRealm(testing.NewUserRealm(arb))
	resetState(arb)

	// Post 22 bounties (exceeds BoardPageSize = 20).
	const totalBounties = 22
	testing.SetRealm(testing.NewUserRealm(sponsor))
	prepCoins(sponsor, totalBounties*100000)
	wugnot.Deposit(cross(cur))
	testing.SetOriginSend(chain.Coins{})
	wugnot.Approve(cross(cur), realmAddr, totalBounties*100000)
	for i := 1; i <= totalBounties; i++ {
		PostBounty(
			cross(cur),
			"Paginated Quest #"+strconv.Itoa(i),
			"Deterministic pagination test bounty specification number "+strconv.Itoa(i)+".",
			"realm",
			100000,
			50,
		)
	}

	page1 := Render("")
	uassert.True(t, strings.Contains(page1, "Bounty Board (Page 1)"))
	uassert.True(t, strings.Contains(page1, `Paginated Quest \#22`))
	uassert.True(t, strings.Contains(page1, `Paginated Quest \#3`))
	uassert.False(t, strings.Contains(page1, `Paginated Quest \#2**`))
	uassert.True(t, strings.Contains(page1, `label="Next Page"`))
	uassert.False(t, strings.Contains(page1, `label="Previous Page"`))

	page2 := Render("page/2")
	uassert.True(t, strings.Contains(page2, "Bounty Board (Page 2)"))
	uassert.True(t, strings.Contains(page2, `Paginated Quest \#2`))
	uassert.True(t, strings.Contains(page2, `Paginated Quest \#1`))
	uassert.True(t, strings.Contains(page2, `label="Previous Page"`))
	uassert.False(t, strings.Contains(page2, `label="Next Page"`))

	page3 := Render("page/3")
	uassert.True(t, strings.Contains(page3, "No Bounties on This View"))

	for _, badRoute := range []string{"page/0", "page/-1", "page/abc", "bounty/0", "bounty/abc", "bounty/999", "category/bogus", "profile/g1missing"} {
		uassert.True(t, strings.Contains(Render(badRoute), "Route Not Found"), "route: "+badRoute)
	}
}

// Verifies RegisterProfile AgentCount transitions and deterministic 4-level
// leaderboard sorting (Earned -> SettledCount -> SponsoredUgnot -> Address).
func TestProfileAgentToggleAndLeaderboardTieBreaking(cur realm, t *testing.T) {
	arb := testutils.TestAddress("adv_lb_arb")
	u1 := testutils.TestAddress("adv_lb_u1")
	u2 := testutils.TestAddress("adv_lb_u2")
	u3 := testutils.TestAddress("adv_lb_u3")
	realmAddr := chain.PackageAddress(testRealmPath)

	testing.SetRealm(testing.NewUserRealm(arb))
	resetState(arb)

	// Toggle human -> agent -> agent -> human -> agent; AgentCount must stay exact.
	testing.SetOriginCaller(u1)
	testing.SetRealm(testing.NewUserRealm(u1))
	RegisterProfile(cross(cur), "u1-human", "bio", "gno", "")
	uassert.Equal(t, 0, GetStats().AgentCount)
	RegisterProfile(cross(cur), "u1-agent", "bio", "gno", "mcp://u1.local/v1")
	uassert.Equal(t, 1, GetStats().AgentCount)
	RegisterProfile(cross(cur), "u1-agent-v2", "bio", "gno", "mcp://u1.local/v2")
	uassert.Equal(t, 1, GetStats().AgentCount)
	RegisterProfile(cross(cur), "u1-back-human", "bio", "gno", "")
	uassert.Equal(t, 0, GetStats().AgentCount)
	RegisterProfile(cross(cur), "u1-agent-again", "bio", "gno", "mcp://u1.local/v3")
	uassert.Equal(t, 1, GetStats().AgentCount)

	// u2 sponsors 2.00 GNOT, u3 sponsors 1.00 GNOT -> both 0 earned, u2 ranks ahead of u3.
	testing.SetRealm(testing.NewUserRealm(u2))
	prepCoins(u2, 2000000)
	wugnot.Deposit(cross(cur))
	testing.SetOriginSend(chain.Coins{})
	wugnot.Approve(cross(cur), realmAddr, 2000000)
	id := PostBounty(cross(cur), "Leaderboard Tie-Break Quest", "Verify deterministic multi-key leaderboard sorting.", "tool", 2000000, 30)

	testing.SetRealm(testing.NewUserRealm(u3))
	prepCoins(u3, 1000000)
	wugnot.Deposit(cross(cur))
	testing.SetOriginSend(chain.Coins{})
	wugnot.Approve(cross(cur), realmAddr, 1000000)
	PostBounty(cross(cur), "Second Tie-Break Quest", "Secondary sponsorship for tie-break check.", "docs", 1000000, 30)

	// u1 earns 2.00 GNOT -> u1 must rank #1, u2 #2 (higher SponsoredUgnot), u3 #3.
	testing.SetOriginCaller(u1)
	testing.SetRealm(testing.NewUserRealm(u1))
	ClaimBounty(cross(cur), id, "Claiming")
	SubmitProof(cross(cur), id, "https://github.com/hearthbounty/v1/pull/801", "sha256:7777777777777777", "Delivered tie-break test.")
	testing.SetOriginCaller(u2)
	testing.SetRealm(testing.NewUserRealm(u2))
	ApproveAndSettle(cross(cur), id, 5, "Settled")

	ranked := rankedProfiles()
	uassert.Equal(t, 3, len(ranked))
	uassert.Equal(t, u1, ranked[0].Address)
	uassert.Equal(t, u2, ranked[1].Address)
	uassert.Equal(t, u3, ranked[2].Address)
}

// Verifies JSON query endpoints, filter combinations, limit clamping, and not-found responses.
func TestExportJSONQueriesAndFilterEdgeCases(cur realm, t *testing.T) {
	arb := testutils.TestAddress("adv_json_arb")
	sponsor := testutils.TestAddress("adv_json_sponsor")
	realmAddr := chain.PackageAddress(testRealmPath)

	testing.SetRealm(testing.NewUserRealm(arb))
	resetState(arb)

	uassert.Equal(t, `{"found":false}`, ExportBountyJSON(0))
	uassert.Equal(t, `{"found":false}`, ExportBountyJSON(999))
	uassert.Equal(t, `{"found":false}`, ExportProfileJSON("g1nonexistent"))

	testing.SetRealm(testing.NewUserRealm(sponsor))
	prepCoins(sponsor, 1600000)
	wugnot.Deposit(cross(cur))
	testing.SetOriginSend(chain.Coins{})
	wugnot.Approve(cross(cur), realmAddr, 1600000)
	PostBounty(cross(cur), "Low Reward Docs", "Small docs bounty for minReward filter check.", "docs", 200000, 20)
	PostBounty(cross(cur), "High Reward Agent", "High reward agent bounty for combined filter check.", "agent", 1400000, 20)

	// Status + category + minReward filter combinations.
	highOnly := ExportBountiesJSON("open", "", 1000000, 0)
	uassert.True(t, strings.Contains(highOnly, `"count":1`))
	uassert.True(t, strings.Contains(highOnly, `"High Reward Agent"`))

	docsOnly := ExportBountiesJSON("OPEN", "DOCS", 0, 500) // verifies case normalization + limit clamping
	uassert.True(t, strings.Contains(docsOnly, `"count":1`))
	uassert.True(t, strings.Contains(docsOnly, `"Low Reward Docs"`))

	noneMatch := ExportBountiesJSON("settled", "", 0, -5)
	uassert.True(t, strings.Contains(noneMatch, `"count":0`))

	lb := ExportLeaderboardJSON(0)
	uassert.True(t, strings.Contains(lb, `"count":1`))

	profJSON := ExportProfileJSON(string(sponsor))
	uassert.True(t, strings.Contains(profJSON, `"found":true`))
	uassert.True(t, strings.Contains(profJSON, `"sponsored_ugnot":1600000`))
	assertStatusCountsConserved(t)
}
