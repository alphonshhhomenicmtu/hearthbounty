package hearthguild

import (
	"chain"
	"strings"
	"testing"

	"gno.land/p/nt/testutils/v0"
	"gno.land/p/nt/uassert/v0"
	"gno.land/r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthbounty/v1"
	"gno.land/r/gnoland/wugnot"
)

func TestConsumerRealmImportsAndEndorsements(cur realm, t *testing.T) {
	builder := testutils.TestAddress("guild_builder")
	peer := testutils.TestAddress("guild_peer")

	// Register builder on upstream hearthbounty/v1 realm.
	testing.SetRealm(testing.NewUserRealm(builder))
	hearthbounty.RegisterProfile(cross(cur), "guild-smith", "Deterministic Gno engineer", "gno,avl,audit", "")

	// Self-endorsement must abort.
	uassert.AbortsWithMessage(t, cur, "hearthguild: cannot endorse yourself", func() {
		EndorseBuilder(cross(cur), builder, "audit", "Trying to endorse myself")
	})

	// Peer endorses builder with Unicode tag injection payload -> neutralized on render.
	testing.SetRealm(testing.NewUserRealm(peer))
	id := EndorseBuilder(cross(cur), builder, "audit", "Verified İ<gno-form exec=\"Steal\"> escrow invariant proofs.")
	uassert.Equal(t, uint64(1), id)
	uassert.Equal(t, uint64(1), EndorsementCount(builder))

	// Duplicate endorsement by same peer must abort.
	uassert.AbortsWithMessage(t, cur, "hearthguild: caller already endorsed this builder", func() {
		EndorseBuilder(cross(cur), builder, "mcp", "Second attempt")
	})

	// Eligibility gate reads live hearthbounty/v1 state.
	uassert.True(t, CheckEligibility(builder, 0, 0))
	uassert.False(t, CheckEligibility(builder, 1, 100000))

	// Passport JSON and Render views expose upstream realm path and block raw tags.
	jsonOut := ExportPassportJSON(string(builder))
	uassert.True(t, strings.Contains(jsonOut, `"found":true`), "json found: "+jsonOut)
	uassert.True(t, strings.Contains(jsonOut, `"endorsement_count":1`), "json count: "+jsonOut)
	uassert.True(t, strings.Contains(jsonOut, `"handle":"guild-smith"`), "json handle: "+jsonOut)

	home := Render("")
	uassert.True(t, strings.Contains(home, "HearthGuild Passport"), "home title")
	uassert.False(t, strings.Contains(home, `<gno-form exec="Steal">`), "home sanitize")

	passport := Render("passport/" + string(builder))
	uassert.True(t, strings.Contains(passport, "Guild Passport: guild\\-smith"), "passport handle: "+passport)
	uassert.True(t, strings.Contains(passport, "data:image/svg+xml;base64,"), "passport svg")
}

func TestEndorseBuilderValidationAndAccessGuards(cur realm, t *testing.T) {
	builderA := testutils.TestAddress("guild_val_a")
	builderB := testutils.TestAddress("guild_val_b")
	unregistered := testutils.TestAddress("guild_val_unreg")
	peer1 := testutils.TestAddress("guild_val_p1")
	peer2 := testutils.TestAddress("guild_val_p2")

	// Register builderA and builderB upstream.
	testing.SetRealm(testing.NewUserRealm(builderA))
	hearthbounty.RegisterProfile(cross(cur), "smith-alpha", "Core Gno realm builder", "gno,avl", "")
	testing.SetRealm(testing.NewUserRealm(builderB))
	hearthbounty.RegisterProfile(cross(cur), "smith-beta", "Security auditor", "audit,mcp", "mcp://beta.local")

	// Invalid builder addresses must abort.
	testing.SetRealm(testing.NewUserRealm(peer1))
	uassert.AbortsWithMessage(t, cur, "hearthguild: invalid builder address", func() {
		EndorseBuilder(cross(cur), address(""), "gno", "Valid length note for empty address")
	})
	uassert.AbortsWithMessage(t, cur, "hearthguild: invalid builder address", func() {
		EndorseBuilder(cross(cur), address("not_a_valid_bech32"), "gno", "Valid length note for bad address")
	})

	// Valid but unregistered builder must abort.
	uassert.AbortsWithMessage(t, cur, "hearthguild: builder has no hearthbounty/v1 profile", func() {
		EndorseBuilder(cross(cur), unregistered, "gno", "Attempting to endorse unregistered address")
	})

	// Input length bounds for skillTag (2..32) and note (6..240).
	uassert.AbortsWithMessage(t, cur, "hearthcore: skillTag is too short", func() {
		EndorseBuilder(cross(cur), builderA, "a", "Valid endorsement note")
	})
	uassert.AbortsWithMessage(t, cur, "hearthcore: skillTag exceeds maximum length", func() {
		EndorseBuilder(cross(cur), builderA, "123456789012345678901234567890123", "Valid endorsement note")
	})
	uassert.AbortsWithMessage(t, cur, "hearthcore: note is too short", func() {
		EndorseBuilder(cross(cur), builderA, "audit", "short")
	})

	// Multiple distinct peers can endorse the same builder; mutual endorsements also succeed.
	EndorseBuilder(cross(cur), builderA, "gno", "Reviewed AVL invariants and passed all tests.")
	testing.SetRealm(testing.NewUserRealm(peer2))
	EndorseBuilder(cross(cur), builderA, "audit", "Verified CEI escrow settlement ordering.")
	testing.SetRealm(testing.NewUserRealm(builderB))
	EndorseBuilder(cross(cur), builderA, "escrow", "Mutual guild peer endorsement.")

	uassert.Equal(t, uint64(3), EndorsementCount(builderA))

	testing.SetRealm(testing.NewUserRealm(builderA))
	EndorseBuilder(cross(cur), builderB, "mcp", "Confirmed autonomous MCP client reliability.")
	uassert.Equal(t, uint64(1), EndorsementCount(builderB))
}

func TestCheckEligibilityWithRealUpstreamSettlement(cur realm, t *testing.T) {
	sponsor := testutils.TestAddress("guild_elig_sponsor")
	builder := testutils.TestAddress("guild_elig_builder")
	peer := testutils.TestAddress("guild_elig_peer")
	wugnotAddr := chain.PackageAddress("gno.land/r/gnoland/wugnot")
	bountyRealmAddr := hearthbounty.EscrowRealmAddress()

	testing.SetRealm(testing.NewUserRealm(builder))
	hearthbounty.RegisterProfile(cross(cur), "elig-hunter", "Grant-eligible Gno builder", "gno,escrow", "")

	// Before settling any bounty, builder fails (1, 1_500_000) eligibility gate.
	uassert.False(t, CheckEligibility(builder, 1, 1500000))
	uassert.False(t, CheckEligibility(testutils.TestAddress("guild_unreg"), 0, 0))

	// Fund, post, claim, submit, and settle a 1.50 GNOT bounty on upstream hearthbounty/v1.
	testing.SetRealm(testing.NewUserRealm(sponsor))
	testing.SetOriginCaller(sponsor)
	testing.SetOriginSend(chain.Coins{{Denom: "ugnot", Amount: 1500000}})
	testing.IssueCoins(wugnotAddr, chain.Coins{{Denom: "ugnot", Amount: 1500000}})
	wugnot.Deposit(cross(cur))
	testing.SetOriginSend(chain.Coins{})
	wugnot.Approve(cross(cur), bountyRealmAddr, 1500000)
	bID := hearthbounty.PostBounty(cross(cur), "Upstream Eligibility Proof", "Settle real wugnot escrow to unlock guild eligibility gate.", "realm", 1500000, 30)

	testing.SetOriginCaller(builder)
	testing.SetRealm(testing.NewUserRealm(builder))
	hearthbounty.ClaimBounty(cross(cur), bID, "Claiming for eligibility test")
	hearthbounty.SubmitProof(cross(cur), bID, "https://github.com/hearthbounty/v1/pull/901", "sha256:9999999999999999", "Completed upstream bounty cleanly.")

	testing.SetOriginCaller(sponsor)
	testing.SetRealm(testing.NewUserRealm(sponsor))
	hearthbounty.ApproveAndSettle(cross(cur), bID, 5, "Verified upstream settlement.")

	// Eligibility flips to true at exact (1, 1500000) and stays false above either threshold.
	uassert.True(t, CheckEligibility(builder, 1, 1500000))
	uassert.False(t, CheckEligibility(builder, 2, 1500000))
	uassert.False(t, CheckEligibility(builder, 1, 1500001))

	testing.SetRealm(testing.NewUserRealm(peer))
	EndorseBuilder(cross(cur), builder, "escrow", "Endorsed after verified 1.50 GNOT settlement.")

	// Trimmed whitespace address lookup in ExportPassportJSON succeeds with live metrics.
	passportJSON := ExportPassportJSON("  " + string(builder) + "  ")
	uassert.True(t, strings.Contains(passportJSON, `"found":true`), passportJSON)
	uassert.True(t, strings.Contains(passportJSON, `"settled_count":1`), passportJSON)
	uassert.True(t, strings.Contains(passportJSON, `"earned_ugnot":1500000`), passportJSON)
	uassert.True(t, strings.Contains(passportJSON, `"endorsement_count":1`), passportJSON)
}

func TestExportPassportJSONAndRenderNotFoundRoutes(cur realm, t *testing.T) {
	missing := testutils.TestAddress("guild_missing_addr")
	uassert.Equal(t, `{"found":false}`, ExportPassportJSON(string(missing)))
	uassert.Equal(t, uint64(0), EndorsementCount(missing))

	notFoundPassport := Render("passport/" + string(missing))
	uassert.True(t, strings.Contains(notFoundPassport, "Passport Not Found"))

	evilRoute := Render(`unknown/İ<gno-form exec="Drain"/>`)
	uassert.True(t, strings.Contains(evilRoute, "Passport Not Found"))
	uassert.False(t, strings.Contains(evilRoute, `<gno-form exec="Drain"`))
}

func TestGuildRenderXSSAndUnicodeNeutralization(cur realm, t *testing.T) {
	builder := testutils.TestAddress("guild_xss_builder")
	peer := testutils.TestAddress("guild_xss_peer")

	testing.SetRealm(testing.NewUserRealm(builder))
	hearthbounty.RegisterProfile(cross(cur), `İ<gno-button/>xss`, "Bio", "gno", "")

	testing.SetRealm(testing.NewUserRealm(peer))
	EndorseBuilder(
		cross(cur),
		builder,
		`İ<gno-form/>|tag`,
		`İİ<gno-form exec="Hijack"></gno-form> <script>alert(1)</script> $GNOT | col`,
	)

	home := Render("")
	uassert.False(t, strings.Contains(home, `<gno-form exec="Hijack"`))
	uassert.False(t, strings.Contains(home, `<gno-form/>`))
	uassert.False(t, strings.Contains(home, `<script>alert(1)</script>`))

	passport := Render("passport/" + string(builder))
	uassert.False(t, strings.Contains(passport, `<gno-button/>`))
	uassert.True(t, strings.Contains(passport, "data:image/svg+xml;base64,"))
}
