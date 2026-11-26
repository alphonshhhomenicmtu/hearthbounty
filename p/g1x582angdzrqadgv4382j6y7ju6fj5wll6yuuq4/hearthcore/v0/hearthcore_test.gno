package hearthcore

import (
	"strings"
	"testing"

	"gno.land/p/nt/uassert/v0"
)

func TestComputeSplitConservation(t *testing.T) {
	cases := []struct {
		escrow int64
		bps    uint64
		wantH  int64
		wantS  int64
	}{
		{1000000, 0, 0, 1000000},
		{1000000, 10000, 1000000, 0},
		{1000000, 5000, 500000, 500000},
		{1000000, 7500, 750000, 250000},
		{999999, 3333, 333299, 666700},
		{1, 5000, 0, 1},
		{0, 5000, 0, 0},
		{9000000000000000, 3333, 2999700000000000, 6000300000000000},
	}

	for _, tc := range cases {
		h, s := ComputeSplit(tc.escrow, tc.bps)
		uassert.Equal(t, tc.wantH, h)
		uassert.Equal(t, tc.wantS, s)
		uassert.Equal(t, tc.escrow, h+s)
	}
}

func TestFormatGNOT(t *testing.T) {
	uassert.Equal(t, "0.00 GNOT", FormatGNOT(0))
	uassert.Equal(t, "1.00 GNOT", FormatGNOT(1000000))
	uassert.Equal(t, "2.50 GNOT", FormatGNOT(2500000))
	uassert.Equal(t, "0.10 GNOT", FormatGNOT(100000))
	uassert.Equal(t, "0.123456 GNOT", FormatGNOT(123456))
	uassert.Equal(t, "42.05 GNOT", FormatGNOT(42050000))
}

func TestComputeTier(t *testing.T) {
	uassert.Equal(t, string(TierApprentice), string(ComputeTier(0, 0, 0, 0)))
	uassert.Equal(t, string(TierApprentice), string(ComputeTier(1, 5000000, 5, 1)))
	uassert.Equal(t, string(TierJourneyman), string(ComputeTier(2, 5000000, 9, 2)))
	uassert.Equal(t, string(TierJourneyman), string(ComputeTier(1, 10000000, 5, 1)))
	uassert.Equal(t, string(TierMaster), string(ComputeTier(5, 10000000, 23, 5)))
	uassert.Equal(t, string(TierMaster), string(ComputeTier(1, 100000000, 5, 1)))
	uassert.Equal(t, string(TierGuildmaster), string(ComputeTier(10, 50000000, 48, 10)))
	// Low rating blocks Guildmaster promotion.
	uassert.Equal(t, string(TierMaster), string(ComputeTier(10, 50000000, 30, 10)))
}

func TestFormatRating(t *testing.T) {
	uassert.Equal(t, "Unrated", FormatRating(0, 0))
	uassert.Equal(t, "5.0 / 5.0", FormatRating(15, 3))
	uassert.Equal(t, "4.7 / 5.0", FormatRating(14, 3))
}

func TestCategoryAndStatusHelpers(t *testing.T) {
	cat, ok := ParseCategory("  AGENT ")
	uassert.True(t, ok)
	uassert.Equal(t, string(CatAgent), string(cat))
	uassert.Equal(t, "AI Agent", cat.Label())
	uassert.Equal(t, "ai", cat.IconName())

	_, bad := ParseCategory("invalid")
	uassert.False(t, bad)

	uassert.True(t, StatusOpen.IsValid())
	uassert.False(t, Status("bogus").IsValid())
	uassert.Equal(t, 3, StatusSettled.StepIndex())
}

func TestValidationHelpers(t *testing.T) {
	uassert.Equal(t, "https://github.com/org/repo/pull/1", ValidateProofURL("  https://github.com/org/repo/pull/1  "))
	uassert.Equal(t, "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi", ValidateProofURL("ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"))
	uassert.Equal(t, DefaultDeadlineBlocks, ValidateDeadlineBlocks(0))
	uassert.Equal(t, int64(250), ValidateDeadlineBlocks(250))
	uassert.Equal(t, uint8(5), ValidateRating(5))
	uassert.Equal(t, `cost is \$50 and \$GNOT`, EscapeMath("cost is $50 and $GNOT"))
}

func TestJSONBuilder(t *testing.T) {
	obj := NewJSONObject().
		Str("title", "Build \"alpha\"\nrealm").
		Int64("escrow_ugnot", 2500000).
		Uint64("id", 7).
		Bool("active", true).
		Raw("tags", JoinJSONArray([]string{QuoteJSON("realm"), QuoteJSON("mcp")})).
		String()

	uassert.Equal(t, `{"title":"Build \"alpha\"\nrealm","escrow_ugnot":2500000,"id":7,"active":true,"tags":["realm","mcp"]}`, obj)
}

func TestSVGVisuals(t *testing.T) {
	hero := RenderHeroBannerSVG(3, 2, 1, 4, 12500000, 48000000)
	uassert.True(t, strings.HasPrefix(hero, "![HearthBounty Live On-Chain Escrow Dashboard](data:image/svg+xml;base64,"))

	step := RenderLifecycleSVG(StatusSubmitted, 3500000)
	uassert.True(t, strings.HasPrefix(step, "![Bounty Lifecycle Progress](data:image/svg+xml;base64,"))

	badge := RenderTierBadgeSVG("agent<script>", TierGuildmaster, 12, 600000000, true)
	uassert.True(t, strings.HasPrefix(badge, "![HearthBounty Reputation Badge](data:image/svg+xml;base64,"))
}

func assertPanicsWith(t *testing.T, needle string, fn func()) {
	t.Helper()
	var recovered any
	func() {
		defer func() {
			recovered = recover()
		}()
		fn()
	}()
	if recovered == nil {
		t.Fatalf("expected panic containing %q, but did not panic", needle)
	}
	msg := ""
	switch v := recovered.(type) {
	case string:
		msg = v
	case error:
		msg = v.Error()
	default:
		t.Fatalf("unexpected panic value type for %q", needle)
	}
	if !strings.Contains(msg, needle) {
		t.Fatalf("expected panic containing %q, got %q", needle, msg)
	}
}

func TestComputeSplitAdversarialBoundsAndPanics(t *testing.T) {
	const maxInt64 int64 = 9223372036854775807

	// Verify exact conservation and zero int64 overflow even at MaxInt64 and prime amounts.
	amounts := []int64{0, 1, 2, 3, 7, 9999, 10000, 10001, 100001, 999999, 1000000000000, maxInt64}
	bpsValues := []uint64{0, 1, 2, 333, 3333, 5000, 6667, 9999, 10000}
	for _, amt := range amounts {
		for _, bps := range bpsValues {
			h, s := ComputeSplit(amt, bps)
			uassert.True(t, h >= 0)
			uassert.True(t, s >= 0)
			uassert.Equal(t, amt, h+s)
			if bps == 0 {
				uassert.Equal(t, int64(0), h)
				uassert.Equal(t, amt, s)
			}
			if bps == MaxBps {
				uassert.Equal(t, amt, h)
				uassert.Equal(t, int64(0), s)
			}
		}
	}

	assertPanicsWith(t, "negative escrow amount", func() {
		ComputeSplit(-1, 5000)
	})
	assertPanicsWith(t, "negative escrow amount", func() {
		ComputeSplit(-1000000, 0)
	})
	assertPanicsWith(t, "hunterBps exceeds 10000", func() {
		ComputeSplit(1000000, 10001)
	})
	assertPanicsWith(t, "hunterBps exceeds 10000", func() {
		ComputeSplit(1000000, 99999)
	})
}

func TestComputeTierBoundaryMatrix(t *testing.T) {
	cases := []struct {
		settled uint64
		earned  int64
		rSum    uint64
		rCount  uint64
		want    Tier
	}{
		{0, 0, 0, 0, TierApprentice},
		{1, 9999999, 5, 1, TierApprentice},
		{1, 10000000, 5, 1, TierJourneyman},
		{2, 0, 0, 0, TierJourneyman},
		{4, 99999999, 20, 4, TierJourneyman},
		{5, 0, 0, 0, TierMaster},
		{1, 100000000, 3, 1, TierMaster},
		{9, 499999999, 45, 9, TierMaster},
		// Exact 4.5 average threshold (45 / 10) unlocks Guildmaster.
		{10, 0, 45, 10, TierGuildmaster},
		// 4.4 average (44 / 10) fails quality gate -> falls back to Master.
		{10, 0, 44, 10, TierMaster},
		// Unrated high earner (>= 500 GNOT, 0 ratings) qualifies for Guildmaster.
		{1, 500000000, 0, 0, TierGuildmaster},
		// High earner with poor rating (4.0) stays Master.
		{1, 500000000, 4, 1, TierMaster},
	}

	for _, tc := range cases {
		got := ComputeTier(tc.settled, tc.earned, tc.rSum, tc.rCount)
		uassert.Equal(t, string(tc.want), string(got))
	}

	uassert.Equal(t, "#f59e0b", TierGuildmaster.Color())
	uassert.Equal(t, "#a78bfa", TierMaster.Color())
	uassert.Equal(t, "#38bdf8", TierJourneyman.Color())
	uassert.Equal(t, "#34d399", TierApprentice.Color())
	uassert.Equal(t, "#34d399", Tier("Unknown").Color())
}

func TestValidationBoundaryPanics(t *testing.T) {
	uassert.Equal(t, "ok", ValidateText("field", "  ok  ", 2, 10))
	assertPanicsWith(t, "is too short", func() {
		ValidateText("title", "   a   ", 2, 10)
	})
	assertPanicsWith(t, "exceeds maximum length", func() {
		ValidateText("title", "12345678901", 2, 10)
	})

	uassert.Equal(t, MinDeadlineBlocks, ValidateDeadlineBlocks(MinDeadlineBlocks))
	uassert.Equal(t, MaxDeadlineBlocks, ValidateDeadlineBlocks(MaxDeadlineBlocks))
	assertPanicsWith(t, "deadlineBlocks out of allowed range", func() {
		ValidateDeadlineBlocks(MinDeadlineBlocks - 1)
	})
	assertPanicsWith(t, "deadlineBlocks out of allowed range", func() {
		ValidateDeadlineBlocks(MaxDeadlineBlocks + 1)
	})
	assertPanicsWith(t, "deadlineBlocks out of allowed range", func() {
		ValidateDeadlineBlocks(-10)
	})

	uassert.Equal(t, uint8(1), ValidateRating(1))
	uassert.Equal(t, uint8(5), ValidateRating(5))
	assertPanicsWith(t, "rating must be between 1 and 5", func() {
		ValidateRating(0)
	})
	assertPanicsWith(t, "rating must be between 1 and 5", func() {
		ValidateRating(6)
	})

	assertPanicsWith(t, "proof URL must start with", func() {
		ValidateProofURL("javascript:alert(1)")
	})
	assertPanicsWith(t, "proof URL must not contain whitespace", func() {
		ValidateProofURL("https://example.com/a b")
	})
	assertPanicsWith(t, "proof digest must not contain whitespace", func() {
		ValidateProofDigest("sha256:abcd efgh")
	})
	assertPanicsWith(t, "proof digest is too short", func() {
		ValidateProofDigest("abc")
	})
}

func TestJSONBuilderControlCharsAndEdgeCases(t *testing.T) {
	uassert.Equal(t, "[]", JoinJSONArray(nil))
	uassert.Equal(t, "[]", JoinJSONArray([]string{}))

	ctrl := "a\x00b\x01c\x1fd\be\ff\ng\rh\ti\"j\\k"
	quoted := QuoteJSON(ctrl)
	uassert.Equal(t, `"a\u0000b\u0001c\u001fd\be\ff\ng\rh\ti\"j\\k"`, quoted)

	obj := NewJSONObject().
		Bool("ok", false).
		Int64("neg", -42).
		Raw("empty", JoinJSONArray(nil)).
		String()
	uassert.Equal(t, `{"ok":false,"neg":-42,"empty":[]}`, obj)
}

func TestFormatGNOTAndHelpersEdgeCases(t *testing.T) {
	uassert.Equal(t, "-1.00 GNOT", FormatGNOT(-1000000))
	uassert.Equal(t, "-0.123456 GNOT", FormatGNOT(-123456))
	uassert.Equal(t, "0.000001 GNOT", FormatGNOT(1))
	uassert.Equal(t, "0.00001 GNOT", FormatGNOT(10))
	uassert.Equal(t, "0.01 GNOT", FormatGNOT(10000))
	uassert.Equal(t, "1000000.00 GNOT", FormatGNOT(1000000000000))

	uassert.Equal(t, "g1short", ShortAddr(address("g1short")))
	uassert.Equal(t, "g1x582an...uuq4", ShortAddr(address("g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4")))

	uassert.Equal(t, "4.5 / 5.0", FormatRating(45, 10))
	uassert.Equal(t, "1.0 / 5.0", FormatRating(1, 1))

	for _, st := range []Status{StatusOpen, StatusClaimed, StatusSubmitted, StatusDisputed, StatusSettled, StatusCancelled} {
		uassert.True(t, st.IsValid())
		uassert.True(t, st.Label() != "Unknown")
		uassert.True(t, st.IconName() != "info")
	}
	uassert.Equal(t, "Unknown", Status("x").Label())
	uassert.Equal(t, "info", Status("x").IconName())
	uassert.Equal(t, -1, StatusCancelled.StepIndex())
	uassert.Equal(t, 2, StatusDisputed.StepIndex())

	uassert.Equal(t, 5, len(AllCategories()))
	for _, cat := range AllCategories() {
		parsed, ok := ParseCategory(string(cat))
		uassert.True(t, ok)
		uassert.Equal(t, string(cat), string(parsed))
		uassert.True(t, cat.Label() != "General")
		uassert.True(t, cat.IconName() != "tag")
	}
	uassert.Equal(t, "General", Category("x").Label())
	uassert.Equal(t, "tag", Category("x").IconName())
}

func TestSVGVisualsAllStatesAndXMLEscaping(t *testing.T) {
	uassert.Equal(t, "&amp;&lt;&gt;&quot;&#39;", EscapeXML(`&<>"'`))

	emptyHero := RenderHeroBannerSVG(0, 0, 0, 0, 0, 0)
	uassert.True(t, strings.HasPrefix(emptyHero, "![HearthBounty Live On-Chain Escrow Dashboard](data:image/svg+xml;base64,"))

	for _, st := range []Status{StatusOpen, StatusClaimed, StatusSubmitted, StatusDisputed, StatusSettled, StatusCancelled} {
		out := RenderLifecycleSVG(st, 1500000)
		uassert.True(t, strings.HasPrefix(out, "![Bounty Lifecycle Progress](data:image/svg+xml;base64,"))
	}

	humanBadge := RenderTierBadgeSVG(`builder&<script>"'`, TierMaster, 5, 100000000, false)
	uassert.True(t, strings.HasPrefix(humanBadge, "![HearthBounty Reputation Badge](data:image/svg+xml;base64,"))
	uassert.False(t, strings.Contains(humanBadge, "<script>"))
}
