(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))n(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function a(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerPolicy&&(s.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?s.credentials="include":o.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(o){if(o.ep)return;o.ep=!0;const s=a(o);fetch(o.href,s)}})();const y="ugnot",j="gno.land/r/gnoland/wugnot.wugnot",Y=1e6,ge=1e5,Xe=1e5,re=1e12,Ke=20,Ye=10,Qe=2e6,Ze=5e4,me=1e4,et=120,tt=4e3,z=600,ot=300,nt=128,at=40,st=300,rt=200,it=240,_="g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4",lt=`gno.land/p/${_}/hearthcore/v0`,R=`gno.land/r/${_}/hearthbounty/v1`,dt=`/r/${_}/hearthbounty/v1`,Z="g1dkvpnfcp8saevy2g46x9z2ljyj9saez6akm39a",ce=`gno.land/r/${_}/hearthguild/v0`,ct=`gno.land/r/${_}/hearthbounty/v0`,ue=["realm","tool","audit","docs","agent"],ee={realm:"Realm",tool:"Tooling",audit:"Security Audit",docs:"Docs & Guides",agent:"AI Agent"},te={open:"Open",claimed:"Claimed",submitted:"Submitted",disputed:"Disputed",settled:"Settled",cancelled:"Cancelled"},D=[{id:"sponsor",label:"Sponsor",role:"EOA Protocol Sponsor",address:"g1jg8mtutu9khhfwc4nxmuhcpftf0pajdhfvsqf5",handle:"tavern-keeper",isAgent:!1},{id:"agent",label:"AI Agent",role:"Autonomous MCP Agent",address:"g1us8428u2a5satrlxzagqqa5m6vmuze025anjlj",handle:"anvil-mcp-agent",isAgent:!0},{id:"builder",label:"Builder",role:"Human Gno Developer",address:"g14a7n5z20x6y8q0w3e9r2t5y8u1i4o7p0a3s6d9",handle:"ironforge-dev",isAgent:!1},{id:"arbiter",label:"Arbiter",role:"Dispute Resolution Arbiter",address:_,handle:"hearth-arbiter",isAgent:!1}];function V(t,e,a,n){const o=n===0||a*10>=n*45;return(t>=10||e>=500*Y)&&o?"Guildmaster":t>=5||e>=100*Y?"Master":t>=2||e>=10*Y?"Journeyman":"Apprentice"}function De(t){switch(t){case"Guildmaster":return"#f59e0b";case"Master":return"#a78bfa";case"Journeyman":return"#38bdf8";default:return"#34d399"}}function ie(t,e){if(!Number.isInteger(t)||t<0)throw new Error("hearthcore: negative escrow amount");if(!Number.isInteger(e)||e<0||e>me)throw new Error("hearthcore: hunterBps exceeds 10000");if(e===0)return{hunterUgnot:0,sponsorRefundUgnot:t};if(e===me)return{hunterUgnot:t,sponsorRefundUgnot:0};const a=BigInt(t),n=BigInt(e),o=BigInt(me),s=a/o,r=a%o,d=s*n+r*n/o,l=a-d;return{hunterUgnot:Number(d),sponsorRefundUgnot:Number(l)}}function b(t){const e=t<0,a=Math.abs(Math.trunc(t)),n=Math.floor(a/Y),o=a%Y,s=e?"-":"";if(o===0)return`${s}${n}.00 GNOT`;const r=o.toString().padStart(6,"0"),d=r.replace(/0+$/,""),l=d.length<2?r.slice(0,2):d;return`${s}${n}.${l} GNOT`}function ut(t,e){if(e===0)return"Unrated";const a=Math.floor((t*10+Math.floor(e/2))/e),n=Math.floor(a/10),o=a%10;return`${n}.${o} / 5.0`}function L(t){return!t||t.length<=14?t:`${t.slice(0,8)}...${t.slice(-4)}`}function pt(t){return t.replaceAll("$","\\$")}function mt(t){return t>=65&&t<=90?t+32:t}function _e(t,e,a){if(e+a.length>t.length)return!1;for(let n=0;n<a.length;n++)if(mt(t.charCodeAt(e+n))!==a.charCodeAt(n))return!1;return!0}function Le(t){const e=t.toLowerCase();if(!e.includes("<gno-")&&!e.includes("</gno-"))return t;let a="";for(let n=0;n<t.length;n++){if(t[n]==="<"){const o=e.slice(n);if(o.startsWith("<gno-")||o.startsWith("</gno-")){a+="&lt;";continue}}a+=t[n]}return a}function Fe(t){let e="",a=!1;for(let n=0;n<t.length;n++){if(t[n]==="<"&&(_e(t,n,"<gno-")||_e(t,n,"</gno-"))){a||(e=t.slice(0,n),a=!0),e+="&lt;";continue}a&&(e+=t[n])}return a?e:t}function F(t){const e=t.replaceAll("<script","&lt;script").replaceAll("<\/script","&lt;/script");return Fe(pt(e))}function gt(t){const e=t.trim().toLowerCase();return ue.includes(e)?e:null}function k(t,e,a,n){const o=e.trim();if(o.length<a)throw new Error(`hearthcore: ${t} is too short`);if(o.length>n)throw new Error(`hearthcore: ${t} exceeds maximum length`);return o}function W(t){const e=t.trim();if(e.length<12)throw new Error("hearthbounty: proof URL is too short");if(e.length>ot)throw new Error("hearthbounty: proof URL exceeds maximum length");if(!e.startsWith("https://"))throw new Error("hearthbounty: proof URL must start with https://");if(/[\s]/.test(e))throw new Error("hearthbounty: proof URL must not contain whitespace");return e}function ht(t){const e=k("proof digest",t,8,nt);if(/[\s]/.test(e))throw new Error("hearthcore: proof digest must not contain whitespace");return e}function ft(t){if(t===0)return Ze;if(!Number.isInteger(t)||t<Ye||t>Qe)throw new Error("hearthcore: deadlineBlocks out of allowed range");return t}function bt(t){if(!Number.isInteger(t)||t<1||t>5)throw new Error("hearthcore: rating must be between 1 and 5");return t}function X(t){return t.escrowUgnot>0?t.escrowUgnot:t.payoutUgnot>0?t.payoutUgnot:t.refundUgnot>0?t.refundUgnot:t.initialUgnot}async function le(t){const e=new TextEncoder().encode(t),a=await globalThis.crypto.subtle.digest("SHA-256",e);return`sha256:${Array.from(new Uint8Array(a)).map(s=>s.toString(16).padStart(2,"0")).join("")}`}class U{arbiter;chainHeight;bountySeq=0;bounties=new Map;profiles=new Map;balances=new Map;realmBankUgnot=0;totalEscrowUgnot=0;totalSettledUgnot=0;totalRefundUgnot=0;openCount=0;claimedCount=0;submittedCount=0;disputedCount=0;settledCount=0;cancelledCount=0;agentCount=0;trace=[];traceSeq=0;constructor(e=_,a=1378958){this.arbiter=e,this.chainHeight=a}seedBalances(){for(const e of D)this.balances.set(e.address,25e7)}getBalance(e){return this.balances.get(e)??1e8}advanceBlocks(e){if(!Number.isInteger(e)||e<1)throw new Error("Block advance must be a positive integer.");return this.chainHeight+=e,this.chainHeight}assertEscrowInvariant(){return this.realmBankUgnot===this.totalEscrowUgnot}getDonorContribution(e,a){const n=this.bounties.get(e);return n?n.donorShares[a]??0:0}getOrCreateProfile(e){const a=this.profiles.get(e);if(a)return a;const n={address:e,handle:L(e),bio:"",skills:"",agentEndpoint:"",isAgent:!1,postedCount:0,claimedCount:0,settledCount:0,sponsoredSettled:0,earnedUgnot:0,sponsoredUgnot:0,ratingSum:0,ratingCount:0,registeredHeight:this.chainHeight};return this.profiles.set(e,n),n}decrementSponsoredCredit(e,a){if(a<=0)return;const n=this.profiles.get(e);n&&(n.sponsoredUgnot=n.sponsoredUgnot>=a?n.sponsoredUgnot-a:0)}displayHandle(e){return this.profiles.get(e)?.handle??L(e)}transitionStatus(e,a){e.status!==a&&(this.bumpCount(e.status,-1),e.status=a,this.bumpCount(a,1))}bumpCount(e,a){switch(e){case"open":this.openCount+=a;break;case"claimed":this.claimedCount+=a;break;case"submitted":this.submittedCount+=a;break;case"disputed":this.disputedCount+=a;break;case"settled":this.settledCount+=a;break;case"cancelled":this.cancelledCount+=a;break}}recordTrace(e,a,n,o,s,r){this.traceSeq+=1,this.trace.unshift({seq:this.traceSeq,height:this.chainHeight,func:e,caller:a,callerHandle:this.displayHandle(a),ok:n,eventType:o,attrs:s,error:r,escrowInvariantOk:this.assertEscrowInvariant(),realmBankUgnot:this.realmBankUgnot,totalEscrowUgnot:this.totalEscrowUgnot}),this.trace.length>80&&(this.trace.length=80)}requireDirectEOA(e,a){if(e.isOriginCall===!1)throw new Error("invalid non-origin call");if(e.isUserCall===!1)throw new Error(`hearthbounty: direct EOA call required to ${a}`)}requireWugnotEscrow(e,a){if(e.tokenKey&&e.tokenKey!==j)throw new Error("hearthbounty: only 1:1 ugnot-backed wugnot escrow is accepted");const n=e.sentCoins??[];if(n.length===0)throw new Error("hearthbounty: escrow amount is below minimum required (100000 wugnot)");if(n.length!==1||n[0].denom!==y&&n[0].denom!=="wugnot")throw new Error("hearthbounty: only 1:1 ugnot-backed wugnot escrow is accepted");const o=n[0].amount;if(!Number.isInteger(o)||o<a)throw new Error("hearthbounty: escrow amount is below minimum required (100000 wugnot)");if(o>re)throw new Error("hearthbounty: escrow amount exceeds single-bounty safety ceiling");if(this.getBalance(e.caller)<o)throw new Error("grc20reg: insufficient wugnot balance for escrow deposit");return o}credit(e,a){this.balances.set(e,this.getBalance(e)+a)}debit(e,a){this.balances.set(e,this.getBalance(e)-a)}runGuarded(e,a,n){try{const{result:o,eventType:s,attrs:r}=n();return this.chainHeight+=1,this.recordTrace(e,a,!0,s,r),o}catch(o){const s=o instanceof Error?o.message:String(o);throw this.recordTrace(e,a,!1,void 0,void 0,s),o}}setArbiter(e,a){this.runGuarded("SetArbiter",e.caller,()=>{if(e.caller!==this.arbiter)throw new Error("hearthbounty: only current arbiter may transfer arbiter role");if(!a.startsWith("g1")||a.length<16)throw new Error("hearthbounty: next arbiter address is invalid");const n=this.arbiter;return this.arbiter=a,{result:void 0,eventType:"ArbiterUpdated",attrs:{previous:n,arbiter:a}}})}registerProfile(e,a,n,o,s){return this.runGuarded("RegisterProfile",e.caller,()=>{const r=k("handle",a,2,at),d=k("bio",n,0,st),l=k("skills",o,0,rt),u=k("agentEndpoint",s,0,it),p=this.getOrCreateProfile(e.caller),m=p.isAgent;return p.handle=r,p.bio=d,p.skills=l,p.agentEndpoint=u,p.isAgent=u!=="",!m&&p.isAgent?this.agentCount+=1:m&&!p.isAgent&&(this.agentCount-=1),{result:this.toProfileView(p),eventType:"ProfileRegistered",attrs:{address:e.caller,handle:r,is_agent:String(p.isAgent)}}})}postBounty(e,a,n,o,s){return this.runGuarded("PostBounty",e.caller,()=>{this.requireDirectEOA(e,"fund escrow");const r=this.requireWugnotEscrow(e,ge),d=k("title",a,4,et),l=k("spec",n,10,tt),u=gt(o);if(!u)throw new Error("hearthbounty: invalid category (use realm, tool, audit, docs, or agent)");const p=ft(s);this.debit(e.caller,r),this.realmBankUgnot+=r,this.bountySeq+=1;const m=this.bountySeq,h={id:m,title:d,spec:l,category:u,status:"open",sponsor:e.caller,claimant:"",claimNote:"",escrowUgnot:r,initialUgnot:r,sponsorFundedUgnot:r,externalTopUpUgnot:0,donorShares:{},payoutUgnot:0,refundUgnot:0,topUpCount:0,deadlineBlocks:p,createdHeight:this.chainHeight,claimedHeight:0,deadlineHeight:0,submittedHeight:0,reviewDeadlineHeight:0,disputedHeight:0,disputeDeadlineHeight:0,settledHeight:0,proofURL:"",proofDigest:"",proofSummary:"",submissionCount:0,revisionFeedback:"",rating:0,reviewNote:"",disputeReason:"",disputeOpenedBy:""};this.bounties.set(m,h),this.openCount+=1,this.totalEscrowUgnot+=r;const v=this.getOrCreateProfile(e.caller);return v.postedCount+=1,v.sponsoredUgnot+=r,{result:m,eventType:"BountyPosted",attrs:{id:String(m),sponsor:e.caller,category:u,escrow_token:j,escrow_ugnot:String(r),deadline_blocks:String(p)}}})}topUpBounty(e,a){return this.runGuarded("TopUpBounty",e.caller,()=>{this.requireDirectEOA(e,"top up escrow");const n=this.requireWugnotEscrow(e,Xe),o=this.bounties.get(a);if(!o)throw new Error("hearthbounty: bounty not found");if(o.status!=="open"&&o.status!=="claimed")throw new Error("hearthbounty: can only top up open or claimed bounties");if(o.claimant&&e.caller===o.claimant)throw new Error("hearthbounty: active claimant cannot top up own claimed bounty");if(o.escrowUgnot+n>re)throw new Error("hearthbounty: escrow total exceeds single-bounty safety ceiling");const s=e.caller!==o.sponsor;if(s&&!(e.caller in o.donorShares)&&Object.keys(o.donorShares).length>=Ke)throw new Error("hearthbounty: external donor cap reached for this bounty");this.debit(e.caller,n),this.realmBankUgnot+=n,s?(o.donorShares[e.caller]=(o.donorShares[e.caller]??0)+n,o.externalTopUpUgnot+=n):o.sponsorFundedUgnot+=n,o.escrowUgnot+=n,o.topUpCount+=1,this.totalEscrowUgnot+=n;const r=this.getOrCreateProfile(e.caller);return r.sponsoredUgnot+=n,{result:o.escrowUgnot,eventType:"BountyToppedUp",attrs:{id:String(a),donor:e.caller,added_ugnot:String(n),escrow_ugnot:String(o.escrowUgnot)}}})}claimBounty(e,a,n){this.runGuarded("ClaimBounty",e.caller,()=>{const o=this.bounties.get(a);if(!o)throw new Error("hearthbounty: bounty not found");if(o.status!=="open")throw new Error("hearthbounty: bounty is not open for claiming");if(e.caller===o.sponsor)throw new Error("hearthbounty: sponsor cannot claim own bounty");if(e.caller in o.donorShares&&o.donorShares[e.caller]>0)throw new Error("hearthbounty: escrow contributor cannot claim own funded bounty");const s=k("agentNote",n,0,z);this.transitionStatus(o,"claimed"),o.claimant=e.caller,o.claimNote=s,o.claimedHeight=this.chainHeight,o.deadlineHeight=this.chainHeight+o.deadlineBlocks;const r=this.getOrCreateProfile(e.caller);return r.claimedCount+=1,{result:void 0,eventType:"BountyClaimed",attrs:{id:String(a),claimant:e.caller,deadline_height:String(o.deadlineHeight)}}})}releaseExpiredClaim(e,a){this.runGuarded("ReleaseExpiredClaim",e.caller,()=>{const n=this.bounties.get(a);if(!n)throw new Error("hearthbounty: bounty not found");if(n.status!=="claimed")throw new Error("hearthbounty: bounty is not currently claimed");if(e.caller!==n.claimant&&this.chainHeight<n.deadlineHeight)throw new Error("hearthbounty: claim deadline has not expired yet");const o=n.claimant,s=this.profiles.get(o);return s&&s.claimedCount>0&&(s.claimedCount-=1),this.transitionStatus(n,"open"),n.claimant="",n.claimNote="",n.claimedHeight=0,n.deadlineHeight=0,n.submittedHeight=0,n.reviewDeadlineHeight=0,n.proofURL="",n.proofDigest="",n.proofSummary="",n.revisionFeedback="",{result:void 0,eventType:"ClaimReleased",attrs:{id:String(a),previous_claimant:o,released_by:e.caller}}})}submitProof(e,a,n,o,s){this.runGuarded("SubmitProof",e.caller,()=>{const r=this.bounties.get(a);if(!r)throw new Error("hearthbounty: bounty not found");if(r.status!=="claimed")throw new Error("hearthbounty: bounty must be claimed before submitting proof");if(e.caller!==r.claimant)throw new Error("hearthbounty: only the active claimant may submit proof");const d=W(n),l=ht(o),u=k("summary",s,6,z);return this.transitionStatus(r,"submitted"),r.proofURL=d,r.proofDigest=l,r.proofSummary=u,r.submittedHeight=this.chainHeight,r.reviewDeadlineHeight=this.chainHeight+r.deadlineBlocks,r.submissionCount+=1,r.revisionFeedback="",{result:void 0,eventType:"ProofSubmitted",attrs:{id:String(a),claimant:e.caller,proof_digest:l,review_deadline_height:String(r.reviewDeadlineHeight),submission_count:String(r.submissionCount)}}})}requestRevision(e,a,n){this.runGuarded("RequestRevision",e.caller,()=>{const o=this.bounties.get(a);if(!o)throw new Error("hearthbounty: bounty not found");if(o.status!=="submitted")throw new Error("hearthbounty: bounty has no pending submission");if(e.caller!==o.sponsor)throw new Error("hearthbounty: only the sponsor may request a revision");const s=k("feedback",n,4,z);return this.transitionStatus(o,"claimed"),o.revisionFeedback=s,o.reviewDeadlineHeight=0,o.deadlineHeight=this.chainHeight+o.deadlineBlocks,{result:void 0,eventType:"RevisionRequested",attrs:{id:String(a),sponsor:e.caller,new_deadline_height:String(o.deadlineHeight)}}})}settleFull(e,a,n,o){const s=e.escrowUgnot,r=e.claimant;e.escrowUgnot=0,e.sponsorFundedUgnot=0,e.externalTopUpUgnot=0,e.donorShares={},e.payoutUgnot=s,e.rating=a,e.reviewNote=n,e.settledHeight=this.chainHeight,this.transitionStatus(e,"settled"),this.totalEscrowUgnot-=s,this.totalSettledUgnot+=s;const d=this.getOrCreateProfile(r);d.settledCount+=1,d.earnedUgnot+=s,a>0&&(d.ratingSum+=a,d.ratingCount+=1);const l=this.getOrCreateProfile(e.sponsor);return l.sponsoredSettled+=1,s>0&&(this.realmBankUgnot-=s,this.credit(r,s)),{result:void 0,eventType:o,attrs:{id:String(e.id),sponsor:e.sponsor,claimant:r,payout_ugnot:String(s),rating:String(a)}}}approveAndSettle(e,a,n,o){this.runGuarded("ApproveAndSettle",e.caller,()=>{const s=this.bounties.get(a);if(!s)throw new Error("hearthbounty: bounty not found");if(s.status!=="submitted")throw new Error("hearthbounty: bounty is not awaiting approval");if(e.caller!==s.sponsor)throw new Error("hearthbounty: only the sponsor may approve and settle");const r=bt(n),d=k("reviewNote",o,0,z);return this.settleFull(s,r,d,"BountySettled")})}expireSubmission(e,a){this.runGuarded("ExpireSubmission",e.caller,()=>{const n=this.bounties.get(a);if(!n)throw new Error("hearthbounty: bounty not found");if(n.status!=="submitted")throw new Error("hearthbounty: bounty has no pending submission");if(this.chainHeight<n.reviewDeadlineHeight)throw new Error("hearthbounty: submission review window has not expired yet");return this.settleFull(n,0,"[Auto-Settled] Sponsor review window expired","SubmissionExpiredSettled")})}cancelBounty(e,a){this.runGuarded("CancelBounty",e.caller,()=>{const n=this.bounties.get(a);if(!n)throw new Error("hearthbounty: bounty not found");if(n.status!=="open")throw new Error("hearthbounty: only open bounties can be cancelled");if(e.caller!==n.sponsor)throw new Error("hearthbounty: only the sponsor may cancel");const o=n.escrowUgnot,s=n.sponsorFundedUgnot,r=[];let d=0;for(const l of Object.keys(n.donorShares).sort()){const u=n.donorShares[l];u>0&&(r.push({addr:l,amount:u}),d+=u)}if(s+d!==o)throw new Error("hearthbounty: internal escrow custody invariant mismatch");n.escrowUgnot=0,n.sponsorFundedUgnot=0,n.externalTopUpUgnot=0,n.donorShares={},n.refundUgnot=o,this.transitionStatus(n,"cancelled"),this.totalEscrowUgnot-=o,this.totalRefundUgnot+=o,this.decrementSponsoredCredit(n.sponsor,s);for(const l of r)this.decrementSponsoredCredit(l.addr,l.amount);s>0&&(this.realmBankUgnot-=s,this.credit(n.sponsor,s));for(const l of r)this.realmBankUgnot-=l.amount,this.credit(l.addr,l.amount);return{result:void 0,eventType:"BountyCancelled",attrs:{id:String(a),sponsor:n.sponsor,sponsor_refund_ugnot:String(s),external_refund_ugnot:String(d),refund_ugnot:String(o)}}})}openDispute(e,a,n){this.runGuarded("OpenDispute",e.caller,()=>{const o=this.bounties.get(a);if(!o)throw new Error("hearthbounty: bounty not found");if(o.status!=="submitted")throw new Error("hearthbounty: disputes can only be opened on submitted bounties");if(e.caller!==o.sponsor&&e.caller!==o.claimant)throw new Error("hearthbounty: only sponsor or claimant may open a dispute");const s=k("reason",n,6,z);return this.transitionStatus(o,"disputed"),o.disputeReason=s,o.disputeOpenedBy=e.caller,o.disputedHeight=this.chainHeight,o.disputeDeadlineHeight=this.chainHeight+o.deadlineBlocks,{result:void 0,eventType:"DisputeOpened",attrs:{id:String(a),opened_by:e.caller,dispute_deadline_height:String(o.disputeDeadlineHeight),reason:s}}})}settleDisputeSplit(e,a,n,o,s){const r=e.escrowUgnot,{sponsorRefundUgnot:d}=ie(e.sponsorFundedUgnot,a),l=[];let u=d;for(const m of Object.keys(e.donorShares).sort()){const h=e.donorShares[m];if(h>0){const{sponsorRefundUgnot:v}=ie(h,a);v>0&&(l.push({addr:m,amount:v}),u+=v)}}const p=r-u;if(e.escrowUgnot=0,e.sponsorFundedUgnot=0,e.externalTopUpUgnot=0,e.donorShares={},e.payoutUgnot=p,e.refundUgnot=u,e.reviewNote=n,e.settledHeight=this.chainHeight,this.transitionStatus(e,"settled"),this.totalEscrowUgnot-=r,this.totalSettledUgnot+=p,this.totalRefundUgnot+=u,p>0){const m=this.getOrCreateProfile(e.claimant);m.settledCount+=1,m.earnedUgnot+=p}this.decrementSponsoredCredit(e.sponsor,d);for(const m of l)this.decrementSponsoredCredit(m.addr,m.amount);p>0&&(this.realmBankUgnot-=p,this.credit(e.claimant,p)),d>0&&(this.realmBankUgnot-=d,this.credit(e.sponsor,d));for(const m of l)this.realmBankUgnot-=m.amount,this.credit(m.addr,m.amount);return{result:void 0,eventType:s,attrs:{id:String(e.id),resolver:o,hunter_bps:String(a),hunter_ugnot:String(p),sponsor_refund_ugnot:String(d),total_refund_ugnot:String(u)}}}resolveDispute(e,a,n,o){this.runGuarded("ResolveDispute",e.caller,()=>{if(e.caller!==this.arbiter)throw new Error("hearthbounty: only the arbiter may resolve disputes");const s=this.bounties.get(a);if(!s)throw new Error("hearthbounty: bounty not found");if(s.status!=="disputed")throw new Error("hearthbounty: bounty is not disputed");if(e.caller===s.sponsor||e.caller===s.claimant)throw new Error("hearthbounty: arbiter cannot resolve a bounty they are party to");const r=k("resolution",o,4,z);return this.settleDisputeSplit(s,n,`[Arbiter Resolution] ${r}`,e.caller,"DisputeResolved")})}expireDispute(e,a){this.runGuarded("ExpireDispute",e.caller,()=>{const n=this.bounties.get(a);if(!n)throw new Error("hearthbounty: bounty not found");if(n.status!=="disputed")throw new Error("hearthbounty: bounty is not disputed");if(this.chainHeight<n.disputeDeadlineHeight)throw new Error("hearthbounty: dispute resolution window has not expired yet");return this.settleDisputeSplit(n,5e3,"[Timeout Split 50/50] Arbiter resolution window expired",e.caller,"DisputeExpiredSplit")})}getStats(){return{realm_path:R,web_path:dt,escrow_token:j,escrow_address:Z,arbiter:this.arbiter,chain_height:this.chainHeight,total_bounties:this.bounties.size,open_count:this.openCount,claimed_count:this.claimedCount,submitted_count:this.submittedCount,disputed_count:this.disputedCount,settled_count:this.settledCount,cancelled_count:this.cancelledCount,profile_count:this.profiles.size,agent_count:this.agentCount,total_escrow_ugnot:this.totalEscrowUgnot,total_settled_ugnot:this.totalSettledUgnot,total_refund_ugnot:this.totalRefundUgnot}}toProfileView(e){return{...e,tier:V(e.settledCount,e.earnedUgnot,e.ratingSum,e.ratingCount),earnedFormatted:b(e.earnedUgnot),ratingFormatted:ut(e.ratingSum,e.ratingCount)}}getRankedProfiles(){const e=Array.from(this.profiles.values());return e.sort((a,n)=>a.earnedUgnot!==n.earnedUgnot?n.earnedUgnot-a.earnedUgnot:a.settledCount!==n.settledCount?n.settledCount-a.settledCount:a.sponsoredUgnot!==n.sponsoredUgnot?n.sponsoredUgnot-a.sponsoredUgnot:a.address.localeCompare(n.address)),e.map(a=>this.toProfileView(a))}getAllBountiesDesc(){return Array.from(this.bounties.values()).sort((e,a)=>a.id-e.id)}encodeBountyJSONObj(e,a){return{...a?{found:!0}:{},id:e.id,title:e.title,spec:e.spec,category:e.category,status:e.status,sponsor:e.sponsor,claimant:e.claimant,claim_note:e.claimNote,escrow_ugnot:e.escrowUgnot,initial_ugnot:e.initialUgnot,sponsor_funded_ugnot:e.sponsorFundedUgnot,external_top_up_ugnot:e.externalTopUpUgnot,external_donor_count:Object.keys(e.donorShares).length,payout_ugnot:e.payoutUgnot,refund_ugnot:e.refundUgnot,reward_formatted:b(X(e)),top_up_count:e.topUpCount,deadline_blocks:e.deadlineBlocks,created_height:e.createdHeight,claimed_height:e.claimedHeight,deadline_height:e.deadlineHeight,submitted_height:e.submittedHeight,review_deadline_height:e.reviewDeadlineHeight,disputed_height:e.disputedHeight,dispute_deadline_height:e.disputeDeadlineHeight,settled_height:e.settledHeight,proof_url:e.proofURL,proof_digest:e.proofDigest,proof_summary:e.proofSummary,submission_count:e.submissionCount,revision_feedback:e.revisionFeedback,rating:e.rating,review_note:e.reviewNote,dispute_reason:e.disputeReason,dispute_opened_by:e.disputeOpenedBy}}encodeProfileJSONObj(e,a){return{...a===0?{found:!0}:{rank:a},address:e.address,handle:e.handle,bio:e.bio,skills:e.skills,agent_endpoint:e.agentEndpoint,is_agent:e.isAgent,tier:e.tier,posted_count:e.postedCount,claimed_count:e.claimedCount,settled_count:e.settledCount,sponsored_settled:e.sponsoredSettled,earned_ugnot:e.earnedUgnot,earned_formatted:e.earnedFormatted,sponsored_ugnot:e.sponsoredUgnot,rating_formatted:e.ratingFormatted,rating_sum:e.ratingSum,rating_count:e.ratingCount}}exportStatsJSON(){return JSON.stringify(this.getStats())}exportBountyJSON(e){const a=this.bounties.get(e);return JSON.stringify(a?this.encodeBountyJSONObj(a,!0):{found:!1})}exportBountiesJSON(e="",a="",n=0,o=50){const s=e.trim().toLowerCase(),r=a.trim().toLowerCase(),d=o<=0||o>100?50:o,l=this.getAllBountiesDesc().filter(u=>(!s||u.status===s)&&(!r||u.category===r)).filter(u=>n<=0||X(u)>=n).slice(0,d).map(u=>this.encodeBountyJSONObj(u,!1));return JSON.stringify({chain_height:this.chainHeight,count:l.length,bounties:l})}exportLeaderboardJSON(e=25){const a=e<=0||e>100?25:e,n=this.getRankedProfiles().slice(0,a);return JSON.stringify({count:n.length,leaderboard:n.map((o,s)=>this.encodeProfileJSONObj(o,s+1))})}exportProfileJSON(e){const a=this.profiles.get(e);return JSON.stringify(a?this.encodeProfileJSONObj(this.toProfileView(a),0):{found:!1})}renderMarkdown(e=""){const a=e.replace(/^\/+/,""),n=this.getStats();if(!a){const o=this.getAllBountiesDesc().map(s=>`| \`${s.id}\` | **${F(s.title)}** | ${ee[s.category]} | **${te[s.status]}** | **${b(X(s))}** |`).join(`
`);return["# HearthBounty v1","",`Active Escrow: **${b(n.total_escrow_ugnot)}** (1:1 wugnot) | Settled Volume: **${b(n.total_settled_ugnot)}** | Block Height: \`${n.chain_height}\``,"","| ID | Bounty | Track | Status | Escrow / Payout |","|---:|---|---|---|---|",o].join(`
`)}if(a.startsWith("bounty/")){const o=Number(a.slice(7)),s=this.bounties.get(o);return s?[`# Bounty #${s.id}: ${F(s.title)}`,"",`- **Status:** ${te[s.status]}`,`- **Escrow:** ${b(s.escrowUgnot)} (Sponsor ${b(s.sponsorFundedUgnot)} · Donors ${b(s.externalTopUpUgnot)})`,`- **Sponsor:** \`${s.sponsor}\``,s.claimant?`- **Claimant:** \`${s.claimant}\``:"- **Claimant:** Open",s.reviewDeadlineHeight?`- **Review Timeout:** Block #${s.reviewDeadlineHeight}`:"",s.disputeDeadlineHeight?`- **Dispute Timeout:** Block #${s.disputeDeadlineHeight}`:"",s.proofURL?`- **Proof URL:** ${s.proofURL}`:"",s.proofDigest?`- **Digest:** \`${s.proofDigest}\``:"","",F(s.spec)].filter(Boolean).join(`
`):`# Route Not Found

No bounty matched that ID.`}return a==="leaderboard"?["# Guild Reputation Leaderboard","","| Rank | Handle | Tier | Type | Earned |","|---:|---|---|---|---|",this.getRankedProfiles().map((s,r)=>`| ${r+1} | ${F(s.handle)} | ${s.tier} | ${s.isAgent?"AI Agent":"Builder"} | ${s.earnedFormatted} |`).join(`
`)].join(`
`):a==="agents"?["# AI Agent & MCP Hub","",`Registered MCP Agents: **${n.agent_count}**`,`Realm Path: \`${R}\``,`Escrow Token: \`${j}\` (Spender \`${Z}\`)`,"JSON Endpoints: `ExportStatsJSON()`, `ExportBountiesJSON(...)`, `ExportBountyJSON(id)`, `ExportLeaderboardJSON(limit)`, `ExportProfileJSON(addr)`"].join(`
`):"# Route Not Found"}}function Ie(){const[t,e,a,n]=D,o=new U(n.address,1378958);return o.seedBalances(),o.registerProfile({caller:t.address},t.handle,"Core protocol maintainer funding reusable Gno.land packages and security audits.","gno,escrow,governance",""),o.registerProfile({caller:e.address},e.handle,"Autonomous AI coding agent connected via hearthbounty-mcp and gnomcp; specializes in Gno v1.8 realms and unit tests.","gno,mcp,audit,svg,testing","mcp://anvil.hearthbounty.local/v1"),o.registerProfile({caller:a.address},a.handle,"Full-stack Gno builder crafting deterministic AVL data structures and gnoweb dashboards.","gno,avl,gnoweb,typescript",""),o.postBounty({caller:t.address,sentCoins:[{denom:y,amount:12e6}]},"Deterministic AVL Leaderboard Paginator","Implement cursor-based pagination over gno.land/p/nt/avl/v0 with zero map iteration and 100% gno test pass.","realm",5e4),o.postBounty({caller:t.address,sentCoins:[{denom:y,amount:55e5}]},"Interrealm v2 Payment Guard Fuzz Suite","Write adversarial unit tests covering AssertOriginCall, IsUserCall, and per-contributor refund custody.","audit",4e4),o.postBounty({caller:t.address,sentCoins:[{denom:y,amount:32e5}]},"Autonomous Proof Verifier MCP Tool","Extend hearthbounty-mcp with deterministic SHA-256 artifact hashing and live Onyx vm/qpkgmeta_json status checks.","agent",3e4),o.postBounty({caller:t.address,sentCoins:[{denom:y,amount:25e5}]},"gnoweb v1.8 SVG Chart Library Guide","Author an interactive developer tutorial demonstrating data:image/svg+xml charts and sanitize/v0 escaping in gnoweb.","docs",6e4),o.postBounty({caller:t.address,sentCoins:[{denom:y,amount:48e5}]},"CLI Gas & Storage Deposit Estimator","Build a lightweight CLI tool querying auth/gasprice and params/vm:p:storage_price on Onyx testnet prior to addpkg.","tool",45e3),o.claimBounty({caller:e.address},1,"Discovered via hearth_list_bounties; implementing cursor paginator with O(log N) seeks."),o.submitProof({caller:e.address},1,"https://github.com/hearthbounty/avl-pager-demo/pull/1","sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad","Delivered deterministic AVL cursor pagination with 16/16 passing gno tests and zero lint warnings."),o.approveAndSettle({caller:t.address},1,5,"Clean idiomatic Gno v1.8 code and thorough test coverage."),o.claimBounty({caller:a.address},2,"Writing adversarial interrealm crossing tests and per-donor custody checks."),o.submitProof({caller:a.address},2,"https://github.com/hearthbounty/audit-suite/pull/4","sha256:35521353280362463ce812e1faccc666447e578485b32ded62a63a5fe0687252","Added adversarial tests verifying H-1 per-donor refunds, M-1 timeout expiry, and M-2 Unicode tag defense."),o.claimBounty({caller:e.address},3,"Building MCP SHA-256 verifier and wiring live Onyx integration checks."),o.topUpBounty({caller:a.address,sentCoins:[{denom:y,amount:12e5}]},5),o}const he=[{id:"h1-topup-theft",severity:"HIGH",code:"H-1",title:"Third-Party TopUp Theft & Claimant Wash",attackSummary:"Sponsor posts 0.50 GNOT, two external donors crowd-fund +1.90 GNOT, then Sponsor calls CancelBounty hoping to pocket 2.40 GNOT. Also tests donor self-claim and claimant self-top-up wash.",fixSummary:"Per-contributor AVL DonorShares ledger refunds Sponsor strictly 0.50 GNOT and returns 1.50 + 0.40 GNOT directly to donors while zeroing phantom SponsoredUgnot credits and blocking wash vectors.",buttonLabel:"Run H-1 TopUp Theft Exploit"},{id:"m2-unicode-tag",severity:"MEDIUM",code:"M-2",title:"Unicode U+0130 ('İ') Tag Injection & Non-HTTPS Links",attackSummary:`Prefixes <gno-form exec="PostBounty"> with Turkish dotted capital 'İ' (U+0130), which expands to 2 code units under toLower() and desynced v0 slice indices, letting raw <gno-form> tags pass through Render().`,fixSummary:"Direct byte/code-unit ASCII case-folding NeutralizeGnoTags never calls toLower() on Unicode runes, neutralizing 100% of <gno-*> tags. ValidateProofURL enforces https:// only.",buttonLabel:"Run M-2 Unicode Bypass Exploit"},{id:"mitm-denom-guard",severity:"GUARD",code:"IR-v2",title:"Cross-Realm MITM, Wrong Denom (uatom) & Dust Lock",attackSummary:"Attempts to hijack funding through a cross-realm wrapper (AssertOriginCall=false), inject unsupported uatom coins into escrow, and spam donor ledgers with 50,000 wugnot dust.",fixSummary:"PostBounty & TopUpBounty enforce runtime.AssertOriginCall() + cur.Previous().IsUserCall(), restrict custody strictly to 1:1 ugnot-backed wugnot via grc20reg, and enforce a 100,000 wugnot floor.",buttonLabel:"Run MITM / uatom Guard Exploit"},{id:"m1-timeout-conflict",severity:"MEDIUM",code:"M-1",title:"Hostage Submission, Conflicted Arbiter & Dispute Timeout",attackSummary:"Ghosting sponsor ignores a delivered proof forever; in a second bounty, the arbiter claims the quest and tries to self-award 100% (10000 bps) in ResolveDispute.",fixSummary:"Permissionless ExpireSubmission auto-settles 100% after ReviewDeadlineHeight; ResolveDispute rejects arbiter == sponsor/claimant; permissionless ExpireDispute triggers a 50/50 pro-rata split.",buttonLabel:"Run M-1 Timeout & Conflict Exploit"}];function T(t){try{return t(),""}catch(e){return e instanceof Error?e.message:String(e)}}function ae(t){const[e,a,n,o]=D,s="g1donorbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",r=new Date().toISOString();if(t==="h1-topup-theft"){const w=new U(o.address,1378958);w.seedBalances(),w.balances.set(s,5e7);const S=w.postBounty({caller:e.address,sentCoins:[{denom:y,amount:5e5}]},"H-1 Custody Verification Bounty","Verify sponsor cannot pocket external top-ups on CancelBounty.","audit",100);w.topUpBounty({caller:n.address,sentCoins:[{denom:y,amount:1e6}]},S),w.topUpBounty({caller:n.address,sentCoins:[{denom:y,amount:5e5}]},S),w.topUpBounty({caller:s,sentCoins:[{denom:y,amount:4e5}]},S);const C=T(()=>w.claimBounty({caller:n.address},S,"wash attempt")),I=w.getBalance(e.address),M=w.getBalance(n.address),pe=w.getBalance(s);w.cancelBounty({caller:e.address},S);const ne=w.getBalance(e.address)-I,K=w.getBalance(n.address)-M,Se=w.getBalance(s)-pe,ke=w.postBounty({caller:e.address,sentCoins:[{denom:y,amount:5e5}]},"H-1 Claimant Wash Guard","Verify active claimant cannot top up own claimed bounty.","tool",50);w.claimBounty({caller:a.address},ke,"Claiming");const Ce=T(()=>w.topUpBounty({caller:a.address,sentCoins:[{denom:y,amount:2e5}]},ke)),We=w.profiles.get(e.address)?.sponsoredUgnot??-1,$e=w.profiles.get(n.address)?.sponsoredUgnot??-1,Ae=ne===5e5&&K===15e5&&Se===4e5&&$e===0&&We===5e5&&C.includes("escrow contributor cannot claim")&&Ce.includes("active claimant cannot top up")&&w.assertEscrowInvariant();return{id:t,passed:Ae,ranAt:r,headline:Ae?"DEFENDED — Sponsor recovered strictly 0.50 GNOT; external donors recovered 1.50 + 0.40 GNOT directly; 0.00 GNOT stolen.":"FAILED — Custody invariant mismatch.",steps:[{label:"1. Crowd-funded escrow locked",outcome:"SETTLED",detail:`Bounty #${S}: Sponsor 0.50 GNOT + Donor A 1.50 GNOT + Donor B 0.40 GNOT = 2.40 GNOT total.`},{label:"2. External donor self-claim blocked",outcome:"DEFENDED",detail:`ClaimBounty(donorA) aborted -> "${C}"`},{label:"3. Sponsor CancelBounty direct contributor refunds",outcome:"DEFENDED",detail:`Sponsor +${b(ne)} · Donor A +${b(K)} · Donor B +${b(Se)} · Donor A phantom credit = ${$e} ugnot · Bank invariant OK.`},{label:"4. Active claimant self-top-up wash blocked",outcome:"DEFENDED",detail:`TopUpBounty(claimant) aborted -> "${Ce}"`}],beforeAfter:{v0Behavior:"Legacy v0 refunded all 2.40 GNOT to Sponsor (+1.90 GNOT stolen from external donors).",v1Behavior:"Patched v1 refunded 0.50 GNOT to Sponsor, 1.50 GNOT to Donor A, 0.40 GNOT to Donor B directly."}}}if(t==="m2-unicode-tag"){const w=`İ<gno-form exec="PostBounty">
</gno-form> İ<GNO-BUTTON href="/r/evil" /> $GNOT/$ATOM`,S=Le(w),C=F(w),I=T(()=>W("ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi")),M=T(()=>W("http://insecure.example.com/proof")),pe=S.includes("<gno-form"),ne=!C.includes("<gno-form")&&!C.includes("</gno-form")&&!C.includes("<GNO-BUTTON")&&C.includes("\\$GNOT/\\$ATOM"),K=pe&&ne&&I.includes("https://")&&M.includes("https://");return{id:t,passed:K,ranAt:r,headline:K?"DEFENDED — U+0130 ('İ') tag smuggling completely neutralized in v1; ipfs:// & http:// links rejected.":"FAILED — Sanitizer bypass check failed.",steps:[{label:"1. Legacy v0 toLower() index-desync reproduced",outcome:"LEAKED_IN_V0",detail:`v0 output still contained raw <gno-form>: ${S.replaceAll(`
`," ")}`},{label:"2. Patched v1 ASCII byte-folding NeutralizeGnoTags",outcome:"DEFENDED",detail:`v1 output escaped every directive & $math: ${C.replaceAll(`
`," ")}`},{label:"3. Non-HTTPS proof link rejection (ValidateProofURL)",outcome:"DEFENDED",detail:`ipfs:// -> "${I}" · http:// -> "${M}"`}],beforeAfter:{v0Behavior:`Leaked raw tag: ${S.replaceAll(`
`," ")}`,v1Behavior:`Escaped cleanly: ${C.replaceAll(`
`," ")}`}}}if(t==="mitm-denom-guard"){const w=new U(o.address,1378958);w.seedBalances();const S=T(()=>w.postBounty({caller:e.address,isOriginCall:!1,sentCoins:[{denom:y,amount:1e6}]},"MITM Wrapper Attack","Cross-realm wrapper trying to hijack PostBounty allowance.","audit",100)),C=T(()=>w.postBounty({caller:e.address,sentCoins:[{denom:"uatom",amount:1e6}]},"Unsupported Denom Attack","Attempting to deposit non-wugnot uatom into escrow.","audit",100)),I=T(()=>w.postBounty({caller:e.address,sentCoins:[{denom:y,amount:5e4}]},"Sub-Floor Dust Attack","Attempting to create a 0.05 GNOT dust bounty below the 0.10 GNOT floor.","audit",100)),M=S.includes("invalid non-origin call")&&C.includes("only 1:1 ugnot-backed wugnot escrow")&&I.includes("below minimum required")&&w.bounties.size===0&&w.assertEscrowInvariant();return{id:t,passed:M,ranAt:r,headline:M?"DEFENDED — Cross-realm MITM, unsupported uatom denom, and 0.05 GNOT dust all aborted cleanly with 0 state mutation.":"FAILED — Payment guard bypassed.",steps:[{label:"1. Cross-realm MITM wrapper (isOriginCall=false)",outcome:"DEFENDED",detail:`PostBounty aborted -> "${S}"`},{label:"2. Non-wugnot denomination injection (uatom)",outcome:"DEFENDED",detail:`PostBounty aborted -> "${C}"`},{label:"3. Sub-minimum dust deposit (50,000 < 100,000 wugnot)",outcome:"DEFENDED",detail:`PostBounty aborted -> "${I}" · Zero bounties mutated · Bank invariant OK.`}]}}const d=new U(o.address,1378958);d.seedBalances();const l=d.postBounty({caller:e.address,sentCoins:[{denom:y,amount:12e5}]},"M-1 Hostage Proof Defense","Sponsor disappears after proof submission; bystander triggers ExpireSubmission.","realm",30);d.claimBounty({caller:a.address},l,"Delivering solution"),d.submitProof({caller:a.address},l,"https://github.com/hearthbounty/v1/pull/11","sha256:fedcba9876543210","Delivered full solution.");const u=T(()=>d.expireSubmission({caller:n.address},l)),p=d.getBalance(a.address);d.advanceBlocks(30),d.expireSubmission({caller:n.address},l);const m=d.getBalance(a.address)-p,h=d.postBounty({caller:e.address,sentCoins:[{denom:y,amount:1e6}]},"M-1 Conflicted Arbiter Defense","Arbiter claims bounty and attempts 100% self-award in ResolveDispute.","audit",25);d.topUpBounty({caller:n.address,sentCoins:[{denom:y,amount:5e5}]},h),d.claimBounty({caller:o.address},h,"Arbiter claiming as hunter"),d.submitProof({caller:o.address},h,"https://github.com/hearthbounty/v1/pull/12","sha256:0123456789abcdef","Arbiter submission."),d.openDispute({caller:o.address},h,"Escalating own claim to dispute.");const v=T(()=>d.resolveDispute({caller:o.address},h,1e4,"self award")),B=d.getBalance(o.address),je=d.getBalance(e.address),Je=d.getBalance(n.address);d.advanceBlocks(25),d.expireDispute({caller:a.address},h);const we=d.getBalance(o.address)-B,xe=d.getBalance(e.address)-je,Ee=d.getBalance(n.address)-Je,Be=u.includes("review window has not expired")&&m===12e5&&v.includes("arbiter cannot resolve a bounty they are party to")&&we===75e4&&xe===5e5&&Ee===25e4&&d.assertEscrowInvariant();return{id:t,passed:Be,ranAt:r,headline:Be?"DEFENDED — ExpireSubmission auto-settled 1.20 GNOT; conflicted arbiter blocked; ExpireDispute split 0.75 / 0.50 / 0.25 GNOT.":"FAILED — Timeout or conflict guard failed.",steps:[{label:"1. Early ExpireSubmission before ReviewDeadlineHeight rejected",outcome:"DEFENDED",detail:`ExpireSubmission(bystander) aborted -> "${u}"`},{label:"2. Post-timeout ExpireSubmission (+30 blocks) settles 100%",outcome:"SETTLED",detail:`Bystander settled Bounty #${l} -> Hunter received +${b(m)} cleanly.`},{label:"3. Conflicted arbiter self-resolution blocked",outcome:"DEFENDED",detail:`ResolveDispute(arbiter == claimant, 10000 bps) aborted -> "${v}"`},{label:"4. Post-timeout ExpireDispute (+25 blocks) 50/50 pro-rata split",outcome:"SETTLED",detail:`Bystander settled Bounty #${h} -> Claimant +${b(we)} · Sponsor +${b(xe)} · External Donor +${b(Ee)} · Bank invariant OK.`}],beforeAfter:{v0Behavior:"Legacy v0 had no review or dispute timeouts and no arbiter conflict check — funds could freeze indefinitely.",v1Behavior:"Patched v1 guarantees bounded escrow liveness via permissionless ExpireSubmission & ExpireDispute."}}}const E="https://rpc.onyx.testnets.gno.land:443",J="https://onyx.testnets.gno.land",vt="onyx-1",Q=[{id:"core",label:"hearthcore/v0",kind:"Pure Package (/p/)",pkgPath:lt,gnowebUrl:`${J}/p/${_}/hearthcore/v0`,expectedBlockHeight:1374766,expectedGasUsed:33928050,txHashBase64:"VLLOf6ww1xr4Dw+UgYcF2Mls1Y2QBP2aDsXfgy2hyxo=",txHashHex:"0x54B2CE7FAC30D71AF80F0F94818705D8C96CD58D9004FD9A0EC5DF832DA1CB1A",txRpcUrl:`${E}/tx?hash=0x54B2CE7FAC30D71AF80F0F94818705D8C96CD58D9004FD9A0EC5DF832DA1CB1A`,note:"Stateless integer split math, tier engine, RFC-8259 JSON builder, and deterministic p/nt/svg/v0 charts."},{id:"v1",label:"hearthbounty/v1",kind:"Hardened Escrow Realm (/r/)",pkgPath:R,gnowebUrl:`${J}/r/${_}/hearthbounty/v1`,expectedBlockHeight:1378958,expectedGasUsed:126117131,txHashBase64:"6nxEN7Y1zA36gpW5sf132RE7ASyobn4KTlJZcjy1LPw=",txHashHex:"0xEA7C4437B635CC0DFA8295B9B1FD77D9113B012CA86E7E0A4E5259723CB52CFC",txRpcUrl:`${E}/tx?hash=0xEA7C4437B635CC0DFA8295B9B1FD77D9113B012CA86E7E0A4E5259723CB52CFC`,note:"V2.1 production realm: 1:1 wugnot grc20reg escrow (zero chain/banker), H-1 per-donor custody, M-1 review/dispute timeouts, M-2 Unicode-safe sanitizer."},{id:"guild",label:"hearthguild/v0",kind:"Companion Consumer Realm (/r/)",pkgPath:ce,gnowebUrl:`${J}/r/${_}/hearthguild/v0`,expectedBlockHeight:1378960,expectedGasUsed:17437231,txHashBase64:"v/aJvEmlmvVsyFosn7DHsO1E8iQoaqhpFrN1IWvUx18=",txHashHex:"0xBFF689BC49A59AF56CC85A2C9FB0C7B0ED44F224286AA86916B375216BD4C75F",txRpcUrl:`${E}/tx?hash=0xBFF689BC49A59AF56CC85A2C9FB0C7B0ED44F224286AA86916B375216BD4C75F`,note:"Composable builder passport & peer endorsement realm importing both hearthcore/v0 and hearthbounty/v1."},{id:"v0_legacy",label:"hearthbounty/v0 (Legacy)",kind:"Superseded Prototype (/r/)",pkgPath:ct,gnowebUrl:`${J}/r/${_}/hearthbounty/v0`,expectedBlockHeight:1374813,expectedGasUsed:94047145,txHashBase64:"uyaie8SBIqyLYrtwzYFdYjtRbPkztxVhV9FiVR6NC8U=",txHashHex:"0xBB26A27BC48122AC8B62BB70CD815D623B516CF933B7156157D162551E8D0BC5",txRpcUrl:`${E}/tx?hash=0xBB26A27BC48122AC8B62BB70CD815D623B516CF933B7156157D162551E8D0BC5`,note:"Superseded by hearthbounty/v1. Remains inert on Onyx because automated GPAO holds realms importing chain/banker for manual review.",legacy:!0}],Re=[{label:"1. Wrap 10.00 GNOT into Genesis wugnot",func:"wugnot.Deposit",blockHeight:1379191,txHashHex:"0x102266AD74577A10CD9A4A7AF622D596FA37D77E54DAE1BE957FD0448594D403",txRpcUrl:`${E}/tx?hash=0x102266AD74577A10CD9A4A7AF622D596FA37D77E54DAE1BE957FD0448594D403`},{label:"2. Approve hearthbounty/v1 escrow spender",func:"wugnot.Approve",blockHeight:1379193,txHashHex:"0x85D97BB7F76B0DD6F3F6321AB8D1825B8E7310F427243EFE4A34EC972CBC5A63",txRpcUrl:`${E}/tx?hash=0x85D97BB7F76B0DD6F3F6321AB8D1825B8E7310F427243EFE4A34EC972CBC5A63`},{label:"3. Register sponsor profile (tavern-keeper)",func:"RegisterProfile",blockHeight:1380051,txHashHex:"0xF89F4B56F4D0B269E8F925446A8D03D63D8EB7E53A0F18217180BD4BFD0504CA",txRpcUrl:`${E}/tx?hash=0xF89F4B56F4D0B269E8F925446A8D03D63D8EB7E53A0F18217180BD4BFD0504CA`},{label:"4. Register AI agent profile (anvil-onyx-agent)",func:"RegisterProfile",blockHeight:1380053,txHashHex:"0xAA36855F276B94A086B3FCF3A7A51DE73CA96D54D590188B18271B8913D403E2",txRpcUrl:`${E}/tx?hash=0xAA36855F276B94A086B3FCF3A7A51DE73CA96D54D590188B18271B8913D403E2`},{label:"5. Post Bounty #1 (2.00 GNOT · Core Realm)",func:"PostBounty",blockHeight:1380073,txHashHex:"0xCCE5FF6BD22AA0829F9C07CB1BE1F6F0492C18B0863327FFC3DDD1BB4FE01085",txRpcUrl:`${E}/tx?hash=0xCCE5FF6BD22AA0829F9C07CB1BE1F6F0492C18B0863327FFC3DDD1BB4FE01085`},{label:"6. Claim Bounty #1 (anvil-onyx-agent)",func:"ClaimBounty",blockHeight:1380075,txHashHex:"0x66AE74C793D1BD0D05E4A64B7EB5E6939B1F2A2A15039C67EBFA3C5AF8F58E5D",txRpcUrl:`${E}/tx?hash=0x66AE74C793D1BD0D05E4A64B7EB5E6939B1F2A2A15039C67EBFA3C5AF8F58E5D`},{label:"7. Submit HTTPS + SHA-256 Proof #1",func:"SubmitProof",blockHeight:1380077,txHashHex:"0xEE156C2C0A62AB613111A9A9A82E1DBA259977C8B754FD9F3C6CC221BDF7F39B",txRpcUrl:`${E}/tx?hash=0xEE156C2C0A62AB613111A9A9A82E1DBA259977C8B754FD9F3C6CC221BDF7F39B`},{label:"8. Approve & Settle Bounty #1 (2.00 GNOT, 5/5)",func:"ApproveAndSettle",blockHeight:1380079,txHashHex:"0xE9FC6F60D756D81A660E0FD19DBF5425B0926290B10FC240ADB88F603EB0E965",txRpcUrl:`${E}/tx?hash=0xE9FC6F60D756D81A660E0FD19DBF5425B0926290B10FC240ADB88F603EB0E965`},{label:"9. Post Bounty #2 (3.50 GNOT · Security Audit)",func:"PostBounty",blockHeight:1380081,txHashHex:"0xCCCF3879482425A60A76407D374D85BEC2D410F5743D5678751217738AB2EF2C",txRpcUrl:`${E}/tx?hash=0xCCCF3879482425A60A76407D374D85BEC2D410F5743D5678751217738AB2EF2C`},{label:"10. Claim Bounty #2 (anvil-onyx-agent)",func:"ClaimBounty",blockHeight:1380082,txHashHex:"0xB047F67DD93D75B7ACBC7AD3B9B9BBA6BEC02825CFAD10C0979E324AB3D2D708",txRpcUrl:`${E}/tx?hash=0xB047F67DD93D75B7ACBC7AD3B9B9BBA6BEC02825CFAD10C0979E324AB3D2D708`},{label:"11. Submit Proof #2 (Awaiting Sponsor Review)",func:"SubmitProof",blockHeight:1380084,txHashHex:"0x7B69C8415C8F9084E63630AF2BDBCC4BB01FC548B140A91C474EA12DAA277CC4",txRpcUrl:`${E}/tx?hash=0x7B69C8415C8F9084E63630AF2BDBCC4BB01FC548B140A91C474EA12DAA277CC4`},{label:"12. Post Bounty #3 (2.50 GNOT · Open AI Track)",func:"PostBounty",blockHeight:1380085,txHashHex:"0x0A08B7CCFB78C527F71F7EFD04B1F64E7991A55218CC177CED4BB911CEBBE0D9",txRpcUrl:`${E}/tx?hash=0x0A08B7CCFB78C527F71F7EFD04B1F64E7991A55218CC177CED4BB911CEBBE0D9`}];function yt(t){const e=new TextEncoder().encode(t);return Array.from(e).map(a=>a.toString(16).padStart(2,"0")).join("")}function wt(t){if(!t)return"";if(typeof atob=="function"){const e=atob(t),a=Uint8Array.from(e,n=>n.charCodeAt(0));return new TextDecoder().decode(a)}return Buffer.from(t,"base64").toString("utf8")}async function ve(t,e=8e3,a=fetch){const n=new AbortController,o=setTimeout(()=>n.abort(),e);try{const s=await a(t,{signal:n.signal});if(!s.ok)throw new Error(`HTTP ${s.status}`);return await s.json()}finally{clearTimeout(o)}}async function se(t,e,a=E,n=fetch){const o=new URLSearchParams({path:`"${t}"`,data:`0x${yt(e)}`}),s=await ve(`${a}/abci_query?${o.toString()}`,8e3,n);if(s.error)throw new Error(s.error.message??s.error.data??"ABCI error");const r=s.result?.response?.ResponseBase??s.result?.response;if(!r)throw new Error("Empty ABCI response");const d=r.Error??r.error;if(d){const u=r.Log??r.log;throw new Error(u??JSON.stringify(d))}const l=r.Data??r.data??"";return l?wt(l):""}async function xt(t,e=E,a=fetch){try{const n=await se("vm/qpkgmeta_json",t,e,a);if(!n)return{path:t,status:"absent"};const o=JSON.parse(n),s=o.status==="live"||o.status==="inert"||o.status==="absent"?o.status:"unknown";return{path:o.path??t,status:s,creator:o.creator,height:o.height,maxDeposit:o.max_deposit,reason:o.reason,pending:o.pending,raw:n}}catch{return{path:t,status:"unknown"}}}async function Et(t,e=E,a=fetch){try{const n=await ve(`${e}/tx?hash=${encodeURIComponent(t)}`,8e3,a);if(n.error||!n.result)return{verified:!1,error:n.error?.message??n.error?.data??"TX not found"};const o=n.result.tx_result,s=o?.ResponseBase?.Error;return{verified:!s,height:Number(n.result.height??0),gasUsed:Number(o?.GasUsed??o?.gas_used??0),gasWanted:Number(o?.GasWanted??o?.gas_wanted??0),hash:n.result.hash??t,...s?{error:JSON.stringify(s)}:{}}}catch(n){return{verified:!1,error:n instanceof Error?n.message:String(n)}}}function Oe(t){const e=t.trim(),a=e.match(/^\(("[\s\S]*")\s+string\)$/);if(a)return JSON.parse(a[1]);if(e.startsWith('"')&&e.endsWith('"'))return JSON.parse(e);throw new Error("Unexpected vm/qeval tuple")}async function Me(t=E,e=fetch){const a=Date.now(),n={},o={};try{const[s,r,d]=await Promise.all([ve(`${t}/status`,8e3,e),Promise.all(Q.map(v=>xt(v.pkgPath,t,e))),Promise.all(Q.map(v=>Et(v.txHashHex,t,e)))]);Q.forEach((v,B)=>{n[v.id]=r[B],o[v.id]=d[B]});const l=s.result?.node_info,u=s.result?.sync_info;let p=null,m=null;if(n.v1?.status==="live")try{const[v,B]=await Promise.all([se("vm/qeval",`${R}.ExportStatsJSON()`,t,e),se("vm/qeval",`${R}.ExportBountiesJSON("", "", 0, 10)`,t,e)]);p=JSON.parse(Oe(v)),m=JSON.parse(Oe(B))}catch{p=null}let h=null;if(n.guild?.status==="live")try{h=(await se("vm/qrender",`${ce}:`,t,e)).slice(0,600)}catch{h=null}return{fetchedAt:new Date().toISOString(),latencyMs:Date.now()-a,online:!0,node:{network:l?.network??vt,moniker:l?.moniker??"onyx-rpc",latestBlockHeight:Number(u?.latest_block_height??0),latestBlockTime:u?.latest_block_time??"",catchingUp:!!u?.catching_up},metas:n,txs:o,liveV1Stats:p,liveV1Bounties:m,liveGuildRenderPreview:h}}catch(s){return{fetchedAt:new Date().toISOString(),latencyMs:Date.now()-a,online:!1,error:s instanceof Error?s.message:String(s),metas:n,txs:o}}}const Ue=1e7,Te="10000ugnot",Ne="gno.land/r/gnoland/wugnot",G=[{name:"hearth_chain_status",mode:"read",summary:"Inspect node status, realm metadata, and global 1:1 wugnot escrow statistics.",defaultArgs:{}},{name:"hearth_list_bounties",mode:"read",summary:"Discover bounties filtered by status, category, and minimum wugnot reward.",defaultArgs:{status:"open",category:"",minRewardUgnot:0,limit:10}},{name:"hearth_get_bounty",mode:"read",summary:"Read spec, per-donor custody split, review/dispute timeouts, and proof digest for one bounty.",defaultArgs:{id:5}},{name:"hearth_leaderboard",mode:"read",summary:"Fetch deterministic on-chain reputation rankings for humans and AI agents.",defaultArgs:{limit:10}},{name:"hearth_get_profile",mode:"read",summary:"Read builder or AI agent profile, tier, skills, and verified earnings.",defaultArgs:{address:"g1us8428u2a5satrlxzagqqa5m6vmuze025anjlj"}},{name:"hearth_render_page",mode:"read",summary:"Fetch native gnoweb Markdown output from Render(path).",defaultArgs:{subPath:""}},{name:"hearth_prepare_post_bounty",mode:"write-prep",summary:"Build 1:1 wugnot Deposit/Approve pre-steps + PostBounty payload (gnokey + gnomcp).",defaultArgs:{title:"Build Deterministic Merkle Verifier",spec:"Create a pure Gno Merkle inclusion verifier package with full unit tests and zero lint warnings.",category:"realm",rewardUgnot:35e5,deadlineBlocks:4e4,keyName:"sponsor-key"}},{name:"hearth_prepare_claim",mode:"write-prep",summary:"Verify a bounty is Open and emit ClaimBounty payloads for an AI agent or builder.",defaultArgs:{id:5,agentNote:"Selected highest-funded open bounty via hearth_list_bounties; ETA 30 blocks.",keyName:"agent-key"}},{name:"hearth_prepare_submit_proof",mode:"write-prep",summary:"Enforce https:// proof URL, hash deliverable via SHA-256, and build SubmitProof tx.",defaultArgs:{id:3,proofURL:"https://github.com/alphonshhhomenicmtu/hearthbounty/pull/12",proofContent:"hearthbounty-v21-verified-deliverable-artifact",summary:"Delivered SHA-256 verifier tool and confirmed all MCP protocol tests pass.",keyName:"agent-key"}},{name:"hearth_prepare_settle",mode:"write-prep",summary:"Verify submitted proof and build sponsor ApproveAndSettle escrow release payload.",defaultArgs:{id:2,rating:5,reviewNote:"All adversarial custody, timeout, and Unicode sanitizer tests verified.",keyName:"sponsor-key"}},{name:"hearth_prepare_expire_submission",mode:"write-prep",summary:"Build permissionless ExpireSubmission payload to auto-settle 100% after ReviewDeadlineHeight.",defaultArgs:{id:2,keyName:"bystander-key"}},{name:"hearth_prepare_expire_dispute",mode:"write-prep",summary:"Build permissionless ExpireDispute payload for 50/50 fallback after DisputeDeadlineHeight.",defaultArgs:{id:2,keyName:"bystander-key"}}];function fe(t){const e=t.trim().toLowerCase();if(e==="gnoland-1"||e==="mainnet")throw new Error("Safety block: write preparation/signing is disabled for gnoland-1 mainnet.");if(!(e==="dev"||e==="onyx-1"||e.startsWith("test")))throw new Error(`Safety block: chainId "${t}" is not recognized as a writable dev/testnet chain (expected "dev" or "onyx-1").`)}function q(t){return`'${t.replace(/'/g,"'\\''")}'`}function H(t,e,a,n,o="",s="<your-key>",r){fe(t);const d=r??R,l=t==="dev"?"http://127.0.0.1:26657":E,u=t==="dev"?"http://127.0.0.1:8888":J,p=["gnokey maketx call",`-pkgpath ${q(d)}`,`-func ${q(e)}`,...a.map(B=>`-args ${q(B)}`)];n&&p.push(`-send ${q(n)}`),p.push(`-gas-fee ${Te}`,`-gas-wanted ${Ue}`,`-chainid ${q(t)}`,`-remote ${q(l)}`,"-broadcast",s);const m=t==="dev"?"local":"testnet",h=d.replace(/^[^/]+/,""),v=o?`${u}${h}:${o}`:`${u}${h}`;return{chainId:t,rpcUrl:l,pkgPath:d,func:e,args:a,...n?{send:n}:{},gasWanted:Ue,gasFee:Te,gnokeyCommand:p.join(" "),gnomcpCallArgs:{profile:m,pkg_path:d,func:e,args:a,...n?{send:n}:{}},gnowebUrl:v}}async function P(t,e,a,n="onyx-1"){const o=Date.now(),s={jsonrpc:"2.0",id:Math.floor(Math.random()*9e3)+1e3,method:"tools/call",params:{name:e,arguments:a}};try{let r;switch(e){case"hearth_chain_status":{r={mode:"in-browser-emulator",node:{network:n,latestBlockHeight:t.chainHeight,catchingUp:!1},realmPath:R,packageStatus:"in-browser-emulator",gnowebUrl:`${J}${R.replace(/^[^/]+/,"")}`,stats:JSON.parse(t.exportStatsJSON())};break}case"hearth_list_bounties":{const d=t.exportBountiesJSON(String(a.status??""),String(a.category??""),Number(a.minRewardUgnot??0),Number(a.limit??25));r=JSON.parse(d);break}case"hearth_get_bounty":{const d=Number(a.id??0);if(!Number.isInteger(d)||d<=0)throw new Error("Bounty ID must be a positive integer.");r=JSON.parse(t.exportBountyJSON(d));break}case"hearth_leaderboard":{r=JSON.parse(t.exportLeaderboardJSON(Number(a.limit??20)));break}case"hearth_get_profile":{const d=String(a.address??"").trim();if(!d)throw new Error("Address is required.");r=JSON.parse(t.exportProfileJSON(d));break}case"hearth_render_page":{const d=String(a.subPath??"");r={realmPath:R,subPath:d,markdown:t.renderMarkdown(d)};break}case"hearth_prepare_post_bounty":{const d=String(a.title??"").trim(),l=String(a.spec??"").trim(),u=String(a.category??"").trim().toLowerCase(),p=Number(a.rewardUgnot??0),m=Number(a.deadlineBlocks??5e4);if(d.length<4||d.length>120)throw new Error("Title must be 4-120 characters.");if(l.length<10||l.length>4e3)throw new Error("Specification must be 10-4000 characters.");if(!ue.includes(u))throw new Error(`Invalid category "${u}".`);if(!Number.isInteger(p)||p<ge||p>re)throw new Error(`rewardUgnot must be an integer between ${ge} (0.10 GNOT) and ${re}.`);const h=String(a.keyName??"<your-key>");r={rewardFormatted:b(p),escrowToken:j,escrowSpender:Z,escrowPreSteps:[H(n,"Deposit",[],`${p}ugnot`,"",h,Ne),H(n,"Approve",[Z,String(p)],void 0,"",h,Ne)],transaction:H(n,"PostBounty",[d,l,u,String(p),String(m)],void 0,"post",h)};break}case"hearth_prepare_claim":{const d=Number(a.id??0),l=t.bounties.get(d);if(!l)throw new Error(`Bounty #${d} was not found in simulator state.`);if(l.status!=="open")throw new Error(`Bounty #${d} is "${l.status}", not "open".`);r={bounty:{id:l.id,title:l.title,escrow_ugnot:l.escrowUgnot,reward_formatted:b(l.escrowUgnot),deadline_blocks:l.deadlineBlocks},transaction:H(n,"ClaimBounty",[String(d),String(a.agentNote??"").trim()],void 0,`bounty/${d}`,String(a.keyName??"<your-key>"))};break}case"hearth_prepare_submit_proof":{const d=Number(a.id??0),l=String(a.proofURL??"").trim();if(!l.startsWith("https://")||/\s/.test(l)||l.length<12||l.length>300)throw new Error("proofURL must be a valid https:// URL (12-300 chars, no whitespace).");const u=String(a.proofDigest??"").trim(),p=String(a.proofContent??""),m=u||(p?await le(p):"");if(m.length<8)throw new Error("Provide either proofDigest (>=8 chars) or proofContent to auto-hash via SHA-256.");const h=String(a.summary??"").trim();if(h.length<6)throw new Error("summary must be at least 6 characters.");const v=t.bounties.get(d);if(!v)throw new Error(`Bounty #${d} was not found in simulator state.`);if(v.status!=="claimed")throw new Error(`Bounty #${d} is "${v.status}", expected "claimed" before submitting proof.`);r={bountyId:v.id,claimant:v.claimant,computedDigest:m,transaction:H(n,"SubmitProof",[String(d),l,m,h],void 0,`bounty/${d}`,String(a.keyName??"<your-key>"))};break}case"hearth_prepare_settle":{const d=Number(a.id??0),l=Number(a.rating??0);if(!Number.isInteger(l)||l<1||l>5)throw new Error("rating must be an integer between 1 and 5.");const u=t.bounties.get(d);if(!u)throw new Error(`Bounty #${d} was not found in simulator state.`);if(u.status!=="submitted")throw new Error(`Bounty #${d} is "${u.status}", expected "submitted" before settling.`);r={bountyId:u.id,sponsor:u.sponsor,recipient:u.claimant,payoutUgnot:u.escrowUgnot,payoutFormatted:b(u.escrowUgnot),proofURL:u.proofURL,proofDigest:u.proofDigest,transaction:H(n,"ApproveAndSettle",[String(d),String(l),String(a.reviewNote??"").trim()],void 0,`bounty/${d}`,String(a.keyName??"<your-key>"))};break}case"hearth_prepare_expire_submission":{const d=Number(a.id??0),l=t.bounties.get(d);if(!l)throw new Error(`Bounty #${d} was not found in simulator state.`);if(l.status!=="submitted")throw new Error(`Bounty #${d} is "${l.status}", expected "submitted" for ExpireSubmission.`);r={bountyId:l.id,claimant:l.claimant,reviewDeadlineHeight:l.reviewDeadlineHeight,payoutUgnot:l.escrowUgnot,payoutFormatted:b(l.escrowUgnot),transaction:H(n,"ExpireSubmission",[String(d)],void 0,`bounty/${d}`,String(a.keyName??"<your-key>"))};break}case"hearth_prepare_expire_dispute":{const d=Number(a.id??0),l=t.bounties.get(d);if(!l)throw new Error(`Bounty #${d} was not found in simulator state.`);if(l.status!=="disputed")throw new Error(`Bounty #${d} is "${l.status}", expected "disputed" for ExpireDispute.`);r={bountyId:l.id,disputeDeadlineHeight:l.disputeDeadlineHeight,escrowUgnot:l.escrowUgnot,fallbackSplitBps:5e3,transaction:H(n,"ExpireDispute",[String(d)],void 0,`bounty/${d}`,String(a.keyName??"<your-key>"))};break}}return{tool:e,chainId:n,ok:!0,durationMs:Date.now()-o,rpcRequest:s,response:r}}catch(r){return{tool:e,chainId:n,ok:!1,durationMs:Date.now()-o,rpcRequest:s,error:r instanceof Error?r.message:String(r)}}}async function O(t,e,a,n){const o=Date.now();try{const s=await n();return{id:t,name:e,category:a,passed:!0,durationMs:Date.now()-o,detail:s}}catch(s){return{id:t,name:e,category:a,passed:!1,durationMs:Date.now()-o,detail:s instanceof Error?s.message:String(s)}}}function f(t,e,a){if(t!==e)throw new Error(`${a}: expected ${String(e)}, got ${String(t)}`)}function $(t,e,a){let n="";try{t()}catch(o){n=o instanceof Error?o.message:String(o)}if(!n.includes(e))throw new Error(`${a}: expected error containing "${e}", got "${n||"no error"}"`)}async function Ge(t){const e=Date.now(),[a,n,o,s]=D,r=[];r.push(await O("diag-split","ComputeSplit Exact Integer Conservation","core",()=>{const l=[[1e6,0,0,1e6],[1e6,1e4,1e6,0],[999999,3333,333299,666700],[1,5e3,0,1],[9e15,3333,29997e11,60003e11]];for(const[u,p,m,h]of l){const{hunterUgnot:v,sponsorRefundUgnot:B}=ie(u,p);f(v,m,`hunter(${u},${p})`),f(B,h,`sponsor(${u},${p})`),f(v+B,u,"conservation")}return"All 5 edge vectors (up to 9e15 wugnot) satisfied hunter + refund == escrow."})),r.push(await O("diag-tier","Deterministic Reputation Tier Thresholds","core",()=>(f(V(0,0,0,0),"Apprentice","0 settled"),f(V(2,5e6,9,2),"Journeyman","2 settled"),f(V(5,1e7,23,5),"Master","5 settled"),f(V(10,5e7,48,10),"Guildmaster","10 settled high rating"),f(V(10,5e7,30,10),"Master","low rating blocks Guildmaster"),"Apprentice, Journeyman, Master, Guildmaster, and 4.5+ quality gate verified."))),r.push(await O("diag-lifecycle","Full 1:1 wugnot Escrow Lifecycle & CEI Conservation","escrow",async()=>{const l=new U(s.address,100);l.seedBalances();const u=l.postBounty({caller:a.address,sentCoins:[{denom:y,amount:2e6}]},"Diag Lifecycle Quest","Verify post, top-up, claim, proof, revision, resubmit, and CEI settle.","realm",200);l.topUpBounty({caller:o.address,sentCoins:[{denom:y,amount:5e5}]},u),f(l.assertEscrowInvariant(),!0,"invariant post-topup"),l.claimBounty({caller:n.address},u,"Claiming via /diag");const p=await le("abc");f(p,"sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad","NIST SHA-256 vector"),l.submitProof({caller:n.address},u,"https://github.com/org/repo/pull/1",p,"First proof submission."),l.requestRevision({caller:a.address},u,"Add edge-case test."),l.submitProof({caller:n.address},u,"https://github.com/org/repo/pull/1",p,"Added edge-case tests.");const m=l.getBalance(n.address);return l.approveAndSettle({caller:a.address},u,5,"Verified."),f(l.getBalance(n.address),m+25e5,"exact payout"),f(l.assertEscrowInvariant(),!0,"invariant post-settle"),f(l.totalEscrowUgnot,0,"escrow drained"),f(l.totalSettledUgnot,25e5,"settled volume"),"2.50 GNOT settled atomically via CEI; realmEscrow == totalEscrowUgnot == 0."})),r.push(await O("diag-h1-custody","H-1 Fix: Per-Contributor TopUp Custody & Claimant Wash Guard","security",()=>{const l=new U(s.address,100);l.seedBalances();const u=l.postBounty({caller:a.address,sentCoins:[{denom:y,amount:5e5}]},"H-1 Donor Custody Check","Verify sponsor cancel cannot steal third-party top-up coins.","audit",100);l.topUpBounty({caller:o.address,sentCoins:[{denom:y,amount:15e5}]},u),$(()=>l.claimBounty({caller:o.address},u,"donor wash"),"escrow contributor cannot claim own funded bounty","donor claim block");const p=l.getBalance(a.address),m=l.getBalance(o.address);l.cancelBounty({caller:a.address},u),f(l.getBalance(a.address),p+5e5,"sponsor gets own 0.50 only"),f(l.getBalance(o.address),m+15e5,"donor recovers full 1.50"),f(l.profiles.get(a.address)?.sponsoredUgnot??-1,0,"sponsor phantom credit cleared"),f(l.profiles.get(o.address)?.sponsoredUgnot??-1,0,"donor phantom credit cleared"),f(l.assertEscrowInvariant(),!0,"invariant post-cancel");const h=l.postBounty({caller:a.address,sentCoins:[{denom:y,amount:5e5}]},"H-1 Claimant Wash Check","Verify active claimant cannot top up own claimed bounty.","tool",50);return l.claimBounty({caller:n.address},h,"Claiming"),$(()=>l.topUpBounty({caller:n.address,sentCoins:[{denom:y,amount:2e5}]},h),"active claimant cannot top up own claimed bounty","claimant wash block"),"Sponsor cancel returned 0.50 GNOT to sponsor and 1.50 GNOT directly to donor; wash vectors blocked."})),r.push(await O("diag-m1-timeouts","M-1 Fix: Review Timeout, Arbiter Conflict Guard & 50/50 Dispute Fallback","escrow",()=>{const l=new U(s.address,100);l.seedBalances();const u=l.postBounty({caller:a.address,sentCoins:[{denom:y,amount:12e5}]},"M-1 Review Timeout","Verify ExpireSubmission settles 100% after review deadline.","realm",30);l.claimBounty({caller:n.address},u,"Delivering"),l.submitProof({caller:n.address},u,"https://github.com/org/repo/pull/7","sha256:fedcba9876543210","Delivered work."),$(()=>l.expireSubmission({caller:o.address},u),"submission review window has not expired yet","early expireSubmission block");const p=l.getBalance(n.address);l.advanceBlocks(30),l.expireSubmission({caller:o.address},u),f(l.getBalance(n.address),p+12e5,"auto-settled 100%");const m=l.postBounty({caller:a.address,sentCoins:[{denom:y,amount:1e6}]},"M-1 Conflicted Arbiter","Verify conflicted arbiter is blocked and ExpireDispute splits 50/50 pro-rata.","audit",25);l.topUpBounty({caller:o.address,sentCoins:[{denom:y,amount:5e5}]},m),l.claimBounty({caller:s.address},m,"Arbiter acting as claimant"),l.submitProof({caller:s.address},m,"https://github.com/org/repo/pull/9","sha256:1234567890abcdef","Submitted work."),l.openDispute({caller:s.address},m,"Testing conflict block."),$(()=>l.resolveDispute({caller:s.address},m,1e4,"self payout"),"arbiter cannot resolve a bounty they are party to","conflicted arbiter block");const h=l.getBalance(s.address),v=l.getBalance(a.address),B=l.getBalance(o.address);return l.advanceBlocks(25),l.expireDispute({caller:n.address},m),f(l.getBalance(s.address),h+75e4,"50% hunter payout"),f(l.getBalance(a.address),v+5e5,"50% sponsor pro-rata refund"),f(l.getBalance(o.address),B+25e4,"50% donor pro-rata refund"),f(l.assertEscrowInvariant(),!0,"invariant post-dispute-timeout"),"ExpireSubmission settled 1.20 GNOT; conflicted arbiter blocked; ExpireDispute split 0.75/0.50/0.25 GNOT."})),r.push(await O("diag-m2-unicode","M-2 Fix: Unicode U+0130 ('İ') Tag Neutralization & HTTPS-Only URLs","security",()=>{const l=`İ<gno-form exec="PostBounty">
</gno-form> İ<GNO-BUTTON href="/r/evil" /> $GNOT/$ATOM`;if(!Le(l).includes("<gno-form"))throw new Error("Expected legacy v0 control vector to exhibit U+0130 desync.");const p=F(l);if(p.includes("<gno-form")||p.includes("</gno-form")||p.includes("<GNO-BUTTON"))throw new Error("Smuggled <gno-*> tag survived patched ASCII-folding NeutralizeGnoTags.");if(!p.includes("\\$GNOT/\\$ATOM"))throw new Error("Unescaped dollar signs survived EscapeMath.");return f(W("https://github.com/org/repo/pull/1"),"https://github.com/org/repo/pull/1","https allowed"),$(()=>W("ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"),"must start with https://","ipfs rejected"),$(()=>W("http://insecure.example.com/proof"),"must start with https://","http rejected"),f(Fe("<GNO-FORM>").startsWith("&lt;"),!0,"case-fold escape"),"U+0130 'İ<gno-form>' 100% neutralized (v0 leaked, v1 blocked); ipfs:// and http:// rejected."})),r.push(await O("diag-guards","Interrealm v2 Direct-EOA, Single-Token & Dust Guards","security",()=>{const l=new U(s.address,100);return l.seedBalances(),$(()=>l.postBounty({caller:a.address,isOriginCall:!1,sentCoins:[{denom:y,amount:1e6}]},"Cross-Realm Attack","Attempt to bypass AssertOriginCall from a wrapper realm.","audit",100),"invalid non-origin call","AssertOriginCall"),$(()=>l.postBounty({caller:a.address,sentCoins:[{denom:"uatom",amount:1e6}]},"Wrong Denom","Attempt to trap unsupported uatom coin in escrow.","audit",100),"only 1:1 ugnot-backed wugnot escrow is accepted","single-token guard"),$(()=>l.postBounty({caller:a.address,sentCoins:[{denom:y,amount:5e4}]},"Dust Attack","Attempt below 100000 wugnot floor.","audit",100),"below minimum required","dust guard"),"AssertOriginCall, non-wugnot uatom rejection, and 0.10 GNOT floor enforced."})),r.push(await O("diag-expiry","Exact-Block Claim Expiry, Proof Clearing & ClaimedCount Decrement","escrow",()=>{const l=new U(s.address,100);l.seedBalances();const u=l.postBounty({caller:a.address,sentCoins:[{denom:y,amount:1e6}]},"Expiry Test Bounty","Short 20-block claim window for exact deadline release test.","docs",20);l.claimBounty({caller:o.address},u,"Working"),l.submitProof({caller:o.address},u,"https://github.com/org/repo/pull/2","sha256:0123456789abcdef","Draft submission."),l.requestRevision({caller:a.address},u,"Needs revision."),$(()=>l.releaseExpiredClaim({caller:n.address},u),"claim deadline has not expired yet","no early release"),l.advanceBlocks(20),l.releaseExpiredClaim({caller:n.address},u);const p=l.bounties.get(u);return f(p.status,"open","returned to open"),f(p.proofURL,"","stale proofURL cleared"),f(l.profiles.get(o.address)?.claimedCount??-1,0,"claimedCount decremented"),"Released at exact DeadlineHeight (+20 blocks), cleared stale proof fields, decremented claimedCount."})),r.push(await O("diag-mcp","MCP 12-Tool Emulator & Mainnet Write-Safety Block","mcp",async()=>{f(G.length,12,"12 MCP tools registered"),$(()=>fe("gnoland-1"),"Safety block","gnoland-1 block"),$(()=>fe("mainnet"),"Safety block","mainnet block");const l=new U(s.address,100);l.seedBalances();const u=await P(l,"hearth_prepare_post_bounty",{title:"Mainnet Block Check",spec:"Ensure write preparation refuses gnoland-1 mainnet.",category:"agent",rewardUgnot:5e5},"gnoland-1");f(u.ok,!1,"mainnet write prep must fail");const p=await P(l,"hearth_prepare_post_bounty",{title:"Onyx Write Check",spec:"Ensure write preparation succeeds on onyx-1 testnet.",category:"agent",rewardUgnot:5e5},"onyx-1");f(p.ok,!0,"onyx-1 write prep must succeed");const m=await P(l,"hearth_chain_status",{},"onyx-1");return f(m.response.packageStatus,"in-browser-emulator","honest emulator status"),"12 MCP tools verified; gnoland-1 writes blocked; onyx-1 wugnot pre-steps + PostBounty built."})),t?.skipLiveOnyx||r.push(await O("diag-onyx-rpc","Live Gno.land Onyx (onyx-1) RPC & Multi-Realm Proof Verification","onyx",async()=>{const l=await Me();if(!l.online||!l.node)throw new Error(`Onyx RPC unreachable: ${l.error??"network error"}`);f(l.node.network,"onyx-1","network chain_id"),f(l.metas.core?.status,"live","hearthcore/v0 live status"),f(l.metas.v1?.status,"live","hearthbounty/v1 live status");for(const p of Q.filter(m=>!m.legacy)){const m=l.txs[p.id];if(!m?.verified||m.height!==p.expectedBlockHeight)throw new Error(`${p.label} TX proof mismatch (got block ${m?.height??"none"})`)}const u=Number(l.liveV1Stats?.total_bounties??0);if(u<3)throw new Error(`Expected >=3 live seeded bounties on hearthbounty/v1, got ${u}`);return`onyx-1 live at #${l.node.latestBlockHeight.toLocaleString()} (${l.latencyMs}ms); hearthcore/v0=live @ #1,374,766; hearthbounty/v1=live @ #1,378,958 (${u} seeded bounties); hearthguild/v0=${l.metas.guild?.status??"?"} @ #1,378,960.`}));const d=r.filter(l=>l.passed).length;return{ranAt:new Date().toISOString(),total:r.length,passed:d,failed:r.length-d,totalDurationMs:Date.now()-e,checks:r}}function Pe(t){return t.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function Bt(t){const a=t.open_count+t.claimed_count+t.submitted_count+t.disputed_count+t.settled_count;let n="";if(a>0){const o=Math.floor(792*t.open_count/a),s=Math.floor(792*t.claimed_count/a),r=Math.floor(792*(t.submitted_count+t.disputed_count)/a),d=t.settled_count===0?0:Math.max(0,792-o-s-r);let l=24;o>0&&(n+=`<rect x="${l}" y="18" width="${o}" height="18" rx="4" fill="#f59e0b" />`,l+=o),s>0&&(n+=`<rect x="${l}" y="18" width="${s}" height="18" fill="#38bdf8" />`,l+=s),r>0&&(n+=`<rect x="${l}" y="18" width="${r}" height="18" fill="#a78bfa" />`,l+=r),d>0&&(n+=`<rect x="${l}" y="18" width="${d}" height="18" rx="4" fill="#34d399" />`)}return`<svg viewBox="0 0 840 72" width="100%" role="img" aria-label="On-chain escrow status distribution" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="840" height="72" rx="10" fill="#0b1220" stroke="#1e293b" stroke-width="1.5" />
    <rect x="24" y="18" width="792" height="18" rx="5" fill="#1e293b" />
    ${n}
    <circle cx="30" cy="54" r="5" fill="#f59e0b" />
    <text x="41" y="58" fill="#cbd5e1" font-size="12" font-weight="600" font-family="ui-sans-serif,system-ui,sans-serif">Open: ${t.open_count}</text>
    <circle cx="155" cy="54" r="5" fill="#38bdf8" />
    <text x="166" y="58" fill="#cbd5e1" font-size="12" font-weight="600" font-family="ui-sans-serif,system-ui,sans-serif">Claimed: ${t.claimed_count}</text>
    <circle cx="295" cy="54" r="5" fill="#a78bfa" />
    <text x="306" y="58" fill="#cbd5e1" font-size="12" font-weight="600" font-family="ui-sans-serif,system-ui,sans-serif">Submitted / Disputed: ${t.submitted_count+t.disputed_count}</text>
    <circle cx="515" cy="54" r="5" fill="#34d399" />
    <text x="526" y="58" fill="#cbd5e1" font-size="12" font-weight="600" font-family="ui-sans-serif,system-ui,sans-serif">Settled: ${t.settled_count}</text>
    <text x="816" y="58" text-anchor="end" fill="#64748b" font-size="11" font-weight="600" font-family="ui-monospace,monospace">p/nt/svg/v0 mirror</text>
  </svg>`}function St(t,e){const a=["1. OPEN","2. CLAIMED","3. SUBMITTED","4. SETTLED"],o={open:0,claimed:1,submitted:2,disputed:2,settled:3,cancelled:-1}[t];return`<svg viewBox="0 0 800 98" width="100%" role="img" aria-label="Bounty lifecycle status" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="800" height="98" rx="10" fill="#0b1220" stroke="#334155" stroke-width="1.5" />
    <rect x="66" y="38" width="465" height="4" rx="2" fill="#334155" />
    ${a.map((r,d)=>{const l=66+d*155;let u="#1e293b",p="#475569",m="#94a3b8";t==="cancelled"?p="#ef4444":t==="disputed"&&d===2?(u="#f97316",p="#fdba74",m="#f8fafc"):o>=0&&d<o?(u="#10b981",p="#34d399",m="#e2e8f0"):o===d&&(u="#f59e0b",p="#fde68a",m="#f8fafc");const h=o<d||t==="cancelled"?"#cbd5e1":"#0f172a";return`
        <circle cx="${l}" cy="40" r="15" fill="${u}" stroke="${p}" stroke-width="2.5" />
        <text x="${l}" y="45" text-anchor="middle" fill="${h}" font-size="13" font-weight="800" font-family="ui-sans-serif,system-ui,sans-serif">${d+1}</text>
        <text x="${l}" y="76" text-anchor="middle" fill="${m}" font-size="11" font-weight="700" letter-spacing="0.5" font-family="ui-sans-serif,system-ui,sans-serif">${r}</text>
      `}).join("")}
    <rect x="598" y="18" width="182" height="62" rx="9" fill="#131c31" stroke="#f59e0b" stroke-width="1.8" />
    <text x="614" y="39" fill="#94a3b8" font-size="10" font-weight="700" letter-spacing="0.7" font-family="ui-sans-serif,system-ui,sans-serif">STATUS: ${Pe(te[t].toUpperCase())}</text>
    <text x="614" y="65" fill="#fbbf24" font-size="17" font-weight="800" font-family="ui-monospace,monospace">${Pe(b(e))}</text>
  </svg>`}const ye="https://youtu.be/vK6z7MJiRAk",ze="https://github.com/alphonshhhomenicmtu/hearthbounty",qe="./hearthbounty-deck.pdf";function Ve(){const t=(window.location.hash||"").toLowerCase(),a=(new URLSearchParams(window.location.search).get("view")||"").toLowerCase(),n=t.replace(/^#\/?/,"")||a;return n==="diag"?"diag":n==="breaker"||n==="lab"?"breaker":n==="onyx"||n==="explorer"?"onyx":n==="mcp"?"mcp":n==="leaderboard"||n==="security"?"leaderboard":"simulator"}const kt=Ie(),i={tab:Ve(),realm:kt,selectedBountyId:5,filterCategory:"",activeActorId:"agent",guardMode:"eoa",showPostForm:!1,toast:null,breakerResults:{},onyx:null,onyxLoading:!1,selectedTool:"hearth_list_bounties",mcpChainId:"onyx-1",mcpArgsText:JSON.stringify(G[1].defaultArgs,null,2),mcpResult:null,mcpLoopLog:[],disputeBps:7e3,sanitizeInput:`İ<gno-form exec="PostBounty">
</gno-form> İ<GNO-BUTTON href="/r/evil" /> cost $150 $GNOT`,diagReport:null,diagRunning:!1,drawerOpen:!1,completedSteps:new Set};function c(t){return String(t??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function de(){return D.find(t=>t.id===i.activeActorId)??D[0]}function A(t){const a={caller:de().address,isOriginCall:i.guardMode!=="cross-realm",isUserCall:i.guardMode!=="cross-realm"};return t===void 0?a:i.guardMode==="bad-denom"?{...a,sentCoins:[{denom:"uatom",amount:t}]}:{...a,sentCoins:[{denom:y,amount:t}]}}function N(t){i.tab=t,window.history.replaceState(null,"",t==="simulator"?"#/":`#/${t}`),g(),t==="diag"&&!i.diagReport&&!i.diagRunning&&oe()}async function be(){i.onyxLoading=!0,g(),i.onyx=await Me(E),i.onyxLoading=!1,g()}async function oe(){i.diagRunning=!0,g(),i.diagReport=await Ge(),i.diagRunning=!1,i.completedSteps.add(5),g()}function x(t,e){i.toast={ok:t,text:e}}function Ct(){return`<svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true">
    <rect width="64" height="64" rx="14" fill="#131c31" stroke="#334155" stroke-width="2" />
    <circle cx="32" cy="32" r="19" fill="#0f172a" stroke="#f59e0b" stroke-width="3" />
    <circle cx="32" cy="32" r="8.5" fill="#f59e0b" />
    <circle cx="32" cy="29" r="3.5" fill="#fef3c7" />
  </svg>`}function $t(){const t=i.onyxLoading?"Connecting Onyx...":i.onyx?.online&&i.onyx.node?`onyx-1 · #${i.onyx.node.latestBlockHeight.toLocaleString()} (${i.onyx.latencyMs}ms)`:i.onyx?"onyx-1 RPC offline":"onyx-1 loading",e=i.onyx?.online?"online":i.onyx?"offline":"",a=[{id:"simulator",label:"Escrow Simulator"},{id:"breaker",label:"Breaker Lab"},{id:"onyx",label:"Live Onyx Explorer"},{id:"mcp",label:"MCP Emulator"},{id:"leaderboard",label:"Leaderboard & Guards"},{id:"diag",label:"/diag Self-Test"}];return`<header class="topbar">
    <div class="topbar-inner">
      <div class="brand">
        ${Ct()}
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="brand-title">HearthBounty</span>
            <span class="brand-tag">v1 · Gno v1.8</span>
          </div>
        </div>
        <button class="live-pill" data-action="goto-onyx" title="Inspect live Onyx RPC proofs">
          <span class="pulse-dot ${e}"></span>
          <span class="mono">${c(t)}</span>
        </button>
      </div>

      <nav class="nav-tabs" aria-label="Primary navigation">
        ${a.map(n=>`<button class="nav-tab ${i.tab===n.id?"active":""}" data-tab="${n.id}">${c(n.label)}</button>`).join("")}
      </nav>

      <div class="topbar-actions">
        <button class="btn btn-primary btn-sm" data-action="open-drawer">60s Walkthrough</button>
        <a class="btn btn-sm" href="${qe}" target="_blank" rel="noopener">Deck PDF</a>
        <a class="btn btn-sm" href="${ye}" target="_blank" rel="noopener">Demo Video</a>
        <a class="btn btn-sm" href="${ze}" target="_blank" rel="noopener">GitHub</a>
      </div>
    </div>
  </header>`}function At(){const t=Object.keys(i.breakerResults).length,e=Object.values(i.breakerResults).filter(a=>a?.passed).length;return`
    <section class="panel" style="margin-bottom:16px;border-color:rgba(245,158,11,0.4);">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Adversarial Breaker Lab — V2.1 Security Proof Suite</h2>
          <p class="panel-sub">Execute 1-click exploit tests directly against the exact TypeScript mirror of <span class="mono">hearthbounty/v1</span>. Every exploit reproduces a real audit vector (H-1, M-1, M-2, Interrealm v2) and proves exact on-chain defense.</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          ${t>0?`<span class="badge ${e===t?"badge-pass":"badge-fail"}">${e} / ${t} DEFENDED</span>`:'<span class="badge badge-open">4 EXPLOITS READY</span>'}
          <button class="btn btn-primary btn-sm" data-action="run-all-breakers">Run All 4 Breaker Tests</button>
          <button class="btn btn-sm" data-action="clear-breakers">Clear Results</button>
        </div>
      </div>
      <div class="callout" style="margin:0;">
        <strong>Audit Coverage:</strong> Every breaker test below has a matching Gno VM unit test in <span class="mono">r/.../hearthbounty/v1/hearthbounty_test.gno</span> verified by <span class="mono">gno test</span> (16/16 passing) and <span class="mono">gno lint</span> (0 warnings).
      </div>
    </section>

    <div class="two-col">
      ${he.map(a=>{const n=i.breakerResults[a.id],o=a.severity==="HIGH"?"badge-fail":a.severity==="MEDIUM"?"badge-disputed":"badge-claimed";return`<section class="panel" style="${n?n.passed?"border-color:rgba(52,211,153,0.45);":"border-color:rgba(248,113,113,0.5);":""}">
          <div class="panel-header">
            <div>
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span class="badge ${o}">${c(a.code)} · ${c(a.severity)}</span>
                ${n?`<span class="badge ${n.passed?"badge-pass":"badge-fail"}">${n.passed?"DEFENDED":"FAILED"}</span>`:'<span class="badge badge-neutral">NOT RUN</span>'}
              </div>
              <h3 class="panel-title">${c(a.title)}</h3>
            </div>
            <button class="btn btn-primary btn-sm" data-breaker="${a.id}">${c(a.buttonLabel)}</button>
          </div>

          <div class="detail-kv" style="grid-template-columns:1fr;margin-top:8px;">
            <div class="kv-item">
              <div class="kv-label">Attack Vector</div>
              <div class="kv-val" style="font-weight:400;color:var(--text-secondary);font-size:12.5px;">${c(a.attackSummary)}</div>
            </div>
            <div class="kv-item">
              <div class="kv-label">On-Chain V2.1 Enforcement</div>
              <div class="kv-val" style="font-weight:400;color:var(--text-secondary);font-size:12.5px;">${c(a.fixSummary)}</div>
            </div>
          </div>

          ${n?`<div class="action-box" style="margin-top:10px;border-color:${n.passed?"rgba(52,211,153,0.4)":"rgba(248,113,113,0.45)"};">
                  <div style="font-weight:700;font-size:12.5px;color:${n.passed?"var(--emerald)":"var(--red)"};margin-bottom:8px;">
                    ${c(n.headline)}
                  </div>
                  ${n.steps.map(s=>`<div style="margin-bottom:6px;font-size:12px;">
                        <span class="badge ${s.outcome==="LEAKED_IN_V0"?"badge-fail":s.outcome==="DEFENDED"?"badge-pass":"badge-claimed"}" style="margin-right:6px;">${c(s.outcome)}</span>
                        <strong>${c(s.label)}:</strong>
                        <div class="mono" style="font-size:11.5px;color:var(--text-secondary);margin-top:2px;word-break:break-word;">${c(s.detail)}</div>
                      </div>`).join("")}
                  ${n.beforeAfter?`<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);font-size:11.5px;">
                          <div class="mono text-red">v0: ${c(n.beforeAfter.v0Behavior)}</div>
                          <div class="mono text-emerald" style="margin-top:3px;">v1: ${c(n.beforeAfter.v1Behavior)}</div>
                        </div>`:""}
                </div>`:""}
        </section>`}).join("")}
    </div>
  `}function Dt(){const t=i.realm.getStats(),e=i.realm.assertEscrowInvariant(),a=i.realm.getAllBountiesDesc().filter(o=>!i.filterCategory||o.category===i.filterCategory),n=i.realm.bounties.get(i.selectedBountyId)??a[0]??i.realm.getAllBountiesDesc()[0];return n&&(i.selectedBountyId=n.id),`
    ${i.toast?`<div class="toast ${i.toast.ok?"ok":"err"}">
            <span>${c(i.toast.text)}</span>
            <button class="btn btn-xs" data-action="dismiss-toast">Dismiss</button>
          </div>`:""}

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Active 1:1 wugnot Escrow</div>
        <div class="kpi-value text-amber mono">${c(b(t.total_escrow_ugnot))}</div>
        <div class="kpi-meta">
          <span>${t.open_count+t.claimed_count+t.submitted_count+t.disputed_count} active quests</span>
          <span class="mono">${t.total_escrow_ugnot.toLocaleString()} wugnot</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Settled Volume</div>
        <div class="kpi-value text-emerald mono">${c(b(t.total_settled_ugnot))}</div>
        <div class="kpi-meta">
          <span>${t.settled_count} settled · ${t.cancelled_count} cancelled</span>
          <span>Refunded: ${c(b(t.total_refund_ugnot))}</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Simulated Chain Height</div>
        <div class="kpi-value text-sky mono">#${t.chain_height.toLocaleString()}</div>
        <div class="kpi-meta">
          <span>Claim / Review / Dispute clocks</span>
          <button class="btn btn-xs" data-action="advance-blocks">+50k Blocks</button>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Escrow Conservation Invariant</div>
        <div class="kpi-value ${e?"text-emerald":"text-red"}">${e?"VERIFIED":"MISMATCH"}</div>
        <div class="kpi-meta">
          <span class="mono">wugnot(${i.realm.realmBankUgnot.toLocaleString()}) == escrow(${i.realm.totalEscrowUgnot.toLocaleString()})</span>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 12px;">
      ${Bt(t)}
    </div>

    <div class="actor-bar">
      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:var(--text-muted);margin-bottom:6px;">
          Active Transaction Signer (cur.Previous().Address())
        </div>
        <div class="actor-list">
          ${D.map(o=>{const s=b(i.realm.getBalance(o.address)),r=i.realm.profiles.get(o.address),d=r?i.realm.toProfileView(r).tier:o.id==="arbiter"?"Arbiter":"Apprentice";return`<button class="actor-chip ${i.activeActorId===o.id?"active":""}" data-actor="${o.id}">
              <span class="actor-name">${c(o.label)}: ${c(o.handle)}</span>
              <span class="actor-bal">${c(s)} · ${c(d)}</span>
            </button>`}).join("")}
        </div>
      </div>

      <div class="guard-select-wrap">
        <label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);" for="guard-mode-sel">
          Call Guard Mode
        </label>
        <select id="guard-mode-sel" class="select" style="width:auto;min-width:210px;" data-action="guard-mode">
          <option value="eoa" ${i.guardMode==="eoa"?"selected":""}>Direct EOA (1:1 wugnot)</option>
          <option value="cross-realm" ${i.guardMode==="cross-realm"?"selected":""}>Adversarial: Cross-Realm MITM</option>
          <option value="bad-denom" ${i.guardMode==="bad-denom"?"selected":""}>Adversarial: Wrong Denom (uatom)</option>
        </select>
        <button class="btn btn-primary btn-sm" data-action="toggle-post-form">
          ${i.showPostForm?"Close Post Form":"+ Post Bounty"}
        </button>
        <button class="btn btn-emerald btn-sm" data-action="run-full-lifecycle">
          Run End-to-End Flow
        </button>
        <button class="btn btn-sm" data-action="goto-breaker">Open Breaker Lab</button>
        <button class="btn btn-sm" data-action="reset-realm">Reset State</button>
      </div>
    </div>

    ${i.showPostForm?_t():""}

    <div class="workbench-grid">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Bounty Board (${a.length})</h2>
            <p class="panel-sub">Select any quest to inspect per-donor custody, liveness timeouts, and realm entrypoints.</p>
          </div>
        </div>

        <div class="filter-row">
          <button class="chip ${i.filterCategory?"":"active"}" data-cat="">All</button>
          ${ue.map(o=>`<button class="chip ${i.filterCategory===o?"active":""}" data-cat="${o}">${c(ee[o])}</button>`).join("")}
        </div>

        <div class="bounty-list">
          ${a.map(o=>`<button class="bounty-card ${n?.id===o.id?"selected":""}" data-bounty-id="${o.id}">
                <div class="bounty-card-top">
                  <span class="mono" style="font-size:12px;color:var(--text-muted);">#${o.id} · ${c(ee[o.category])}</span>
                  <span class="badge badge-${o.status}">${c(te[o.status])}</span>
                </div>
                <div class="bounty-card-title">${c(o.title)}</div>
                <div class="bounty-card-meta">
                  <span class="mono text-amber" style="font-weight:700;">${c(b(X(o)))}</span>
                  <span>${o.claimant?`Hunter: ${c(i.realm.profiles.get(o.claimant)?.handle??L(o.claimant))}`:"Unclaimed"}</span>
                </div>
              </button>`).join("")}
        </div>
      </section>

      <section class="panel">
        ${n?Rt(n):"<p>No bounties available. Post a bounty to begin.</p>"}
      </section>
    </div>

    <section class="panel" style="margin-top:16px;">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Realm Execution &amp; Event Trace (${i.realm.trace.length})</h2>
          <p class="panel-sub">Every crossing call records its chain.Emit event, CEI wugnot balance check, or exact Gno panic abort.</p>
        </div>
        <button class="btn btn-sm" data-action="inspect-in-mcp">Inspect State in MCP Emulator</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Seq</th>
              <th>Block</th>
              <th>Entrypoint</th>
              <th>Caller</th>
              <th>Outcome / Event</th>
              <th>CEI Invariant</th>
            </tr>
          </thead>
          <tbody>
            ${i.realm.trace.slice(0,14).map(o=>`<tr>
                  <td class="mono">#${o.seq}</td>
                  <td class="mono">${o.height.toLocaleString()}</td>
                  <td class="mono" style="font-weight:700;color:var(--amber-bright);">${c(o.func)}</td>
                  <td>${c(o.callerHandle)}</td>
                  <td>
                    ${o.ok?`<span class="badge badge-pass">${c(o.eventType)}</span> <span class="mono" style="font-size:11px;color:var(--text-muted);">${c(Object.entries(o.attrs??{}).map(([s,r])=>`${s}=${r}`).join(" · "))}</span>`:`<span class="badge badge-fail">ABORT</span> <span class="mono text-red" style="font-size:12px;">${c(o.error)}</span>`}
                  </td>
                  <td class="mono" style="font-size:11px;color:${o.escrowInvariantOk?"var(--emerald)":"var(--red)"};">
                    ${o.escrowInvariantOk?"OK":"FAIL"} (${b(o.realmBankUgnot)})
                  </td>
                </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `}function _t(){return`<section class="panel" style="margin-bottom:16px;border-color:rgba(245,158,11,0.45);">
    <div class="panel-header">
      <div>
        <h3 class="panel-title">PostBounty(cur, title, spec, category, rewardUgnot, deadlineBlocks)</h3>
        <p class="panel-sub">Direct-EOA 1:1 wugnot escrow pull via <span class="mono">grc20reg.TransferFrom</span>. Minimum escrow: 100,000 wugnot (0.10 GNOT). Switch Call Guard Mode above to test AssertOriginCall or uatom rejection.</p>
      </div>
    </div>
    <form id="form-post-bounty">
      <div class="form-grid">
        <div class="field">
          <label for="post-title">Title (4-120 chars)</label>
          <input id="post-title" name="title" class="input" required value="Build Deterministic Gno Event Indexer" />
        </div>
        <div class="field">
          <label for="post-category">Track / Category</label>
          <select id="post-category" name="category" class="select">
            ${ue.map(t=>`<option value="${t}">${c(ee[t])}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="post-amount">Escrow Deposit (wugnot, 1 GNOT = 1,000,000)</label>
          <input id="post-amount" name="amount" type="number" class="input mono" required value="4000000" min="1" />
        </div>
        <div class="field">
          <label for="post-deadline">Claim / Review Window (blocks, 10 - 2,000,000)</label>
          <input id="post-deadline" name="deadline" type="number" class="input mono" required value="30000" min="10" max="2000000" />
        </div>
      </div>
      <div class="field">
        <label for="post-spec">Specification (10-4000 chars)</label>
        <textarea id="post-spec" name="spec" class="textarea" required>Stream HearthBounty chain.Emit events from Onyx RPC into deterministic JSON feeds with unit tests.</textarea>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <button type="submit" class="btn btn-primary">Execute PostBounty</button>
        <button type="button" class="btn btn-sm" data-action="toggle-post-form">Cancel</button>
      </div>
    </form>
  </section>`}function Rt(t){const e=i.realm.profiles.get(t.sponsor)?.handle??L(t.sponsor),a=t.claimant?i.realm.profiles.get(t.claimant)?.handle??L(t.claimant):"Unclaimed",n=t.deadlineHeight>0?t.deadlineHeight-i.realm.chainHeight:t.deadlineBlocks,o=t.reviewDeadlineHeight>0?t.reviewDeadlineHeight-i.realm.chainHeight:0,s=t.disputeDeadlineHeight>0?t.disputeDeadlineHeight-i.realm.chainHeight:0,r=ie(t.escrowUgnot,i.disputeBps),d=Object.keys(t.donorShares).length;return`
    <div class="panel-header">
      <div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span class="mono" style="color:var(--text-muted);font-weight:700;">BOUNTY #${t.id}</span>
          <span class="badge badge-${t.status}">${c(te[t.status])}</span>
          <span class="badge badge-neutral">${c(ee[t.category])}</span>
        </div>
        <h2 style="margin:5px 0 0;font-size:18px;">${c(t.title)}</h2>
      </div>
      <div class="mono text-amber" style="font-size:19px;font-weight:800;">
        ${c(b(X(t)))}
      </div>
    </div>

    <div style="margin-bottom:12px;">
      ${St(t.status,X(t))}
    </div>

    <div style="background:#0a101f;border:1px solid var(--border);border-radius:8px;padding:11px 13px;color:var(--text-secondary);font-size:13px;">
      ${c(t.spec)}
    </div>

    <div class="detail-kv">
      <div class="kv-item">
        <div class="kv-label">Sponsor</div>
        <div class="kv-val">${c(e)} <span class="mono" style="color:var(--text-muted);font-size:11px;">(${c(L(t.sponsor))})</span></div>
      </div>
      <div class="kv-item">
        <div class="kv-label">Claimant / Hunter</div>
        <div class="kv-val">${c(a)}${t.claimant?` <span class="mono" style="color:var(--text-muted);font-size:11px;">(${c(L(t.claimant))})</span>`:""}</div>
      </div>
      <div class="kv-item">
        <div class="kv-label">H-1 Custody Split (Sponsor / External Donors)</div>
        <div class="kv-val mono" style="font-size:12px;">${c(b(t.sponsorFundedUgnot))} / ${c(b(t.externalTopUpUgnot))} (${d} donor${d===1?"":"s"})</div>
      </div>
      <div class="kv-item">
        <div class="kv-label">Active Timeout Clock</div>
        <div class="kv-val mono" style="font-size:12px;">${t.status==="submitted"&&t.reviewDeadlineHeight>0?o>0?`Review #${t.reviewDeadlineHeight.toLocaleString()} (${o.toLocaleString()} left)`:`REVIEW EXPIRED at #${t.reviewDeadlineHeight.toLocaleString()}`:t.status==="disputed"&&t.disputeDeadlineHeight>0?s>0?`Dispute #${t.disputeDeadlineHeight.toLocaleString()} (${s.toLocaleString()} left)`:`DISPUTE EXPIRED at #${t.disputeDeadlineHeight.toLocaleString()}`:t.deadlineHeight>0?n>0?`Claim #${t.deadlineHeight.toLocaleString()} (${n.toLocaleString()} left)`:`CLAIM EXPIRED at #${t.deadlineHeight.toLocaleString()}`:`${t.deadlineBlocks.toLocaleString()} blocks window`}</div>
      </div>
    </div>

    ${t.proofURL?`<div class="kv-item" style="margin-bottom:10px;border-color:rgba(167,139,250,0.4);">
            <div class="kv-label">Verifiable Proof Artifact (Submission #${t.submissionCount})</div>
            <div class="kv-val" style="margin-top:4px;">
              <div>URL: <a href="${c(t.proofURL)}" target="_blank" rel="noopener">${c(t.proofURL)}</a></div>
              <div class="mono" style="font-size:12px;color:var(--violet);margin-top:3px;">Digest: ${c(t.proofDigest)}</div>
              <div style="font-weight:400;color:var(--text-secondary);margin-top:4px;">${c(t.proofSummary)}</div>
            </div>
          </div>`:""}

    ${t.revisionFeedback?`<div class="callout callout-warn" style="margin-bottom:10px;">
            <strong>Sponsor Revision Feedback:</strong> ${c(t.revisionFeedback)}
          </div>`:""}

    ${t.disputeReason?`<div class="callout callout-warn" style="margin-bottom:10px;">
            <strong>Active Dispute (opened by ${c(L(t.disputeOpenedBy))}):</strong> ${c(t.disputeReason)}
          </div>`:""}

    ${t.status==="open"?`<div class="action-box">
            <h4>ClaimBounty(cur, ${t.id}, agentNote) — Non-Sponsor, Non-Donor Builder or AI Agent</h4>
            <form id="form-claim">
              <div class="field">
                <label for="claim-note">Execution Plan / Agent Note</label>
                <input id="claim-note" name="note" class="input" value="Discovered via hearth_list_bounties; delivering tested Gno package and SHA-256 proof." />
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button type="submit" class="btn btn-primary btn-sm">Claim Bounty as ${c(de().handle)}</button>
                <button type="button" class="btn btn-sm" data-action="topup-bounty" data-id="${t.id}">TopUp +1.00 GNOT</button>
                <button type="button" class="btn btn-danger btn-sm" data-action="cancel-bounty" data-id="${t.id}">CancelBounty (Refund Each Contributor)</button>
              </div>
            </form>
          </div>`:""}

    ${t.status==="claimed"?`<div class="action-box">
            <h4>SubmitProof(cur, ${t.id}, proofURL, proofDigest, summary) — Active Claimant Only</h4>
            <form id="form-submit-proof">
              <div class="form-grid">
                <div class="field">
                  <label for="proof-url">Deliverable URL (https:// only)</label>
                  <input id="proof-url" name="proofURL" class="input" required value="https://github.com/alphonshhhomenicmtu/hearthbounty/pull/18" />
                </div>
                <div class="field">
                  <label for="proof-artifact">Raw Artifact Text (Click Hash for SHA-256)</label>
                  <div style="display:flex;gap:6px;">
                    <input id="proof-artifact" name="artifact" class="input" value="hearthbounty-deliverable-bounty-${t.id}-v21" />
                    <button type="button" class="btn btn-sky btn-sm" data-action="hash-proof">Hash</button>
                  </div>
                </div>
              </div>
              <div class="field">
                <label for="proof-digest">SHA-256 Proof Digest</label>
                <input id="proof-digest" name="proofDigest" class="input mono" required value="sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08" />
              </div>
              <div class="field">
                <label for="proof-summary">Implementation Summary</label>
                <input id="proof-summary" name="summary" class="input" required value="Completed implementation with passing gno test suite and zero gno lint warnings." />
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button type="submit" class="btn btn-primary btn-sm">Submit Proof</button>
                <button type="button" class="btn btn-sm" data-action="topup-bounty" data-id="${t.id}">TopUp +0.50 GNOT</button>
                <button type="button" class="btn btn-danger btn-sm" data-action="release-claim" data-id="${t.id}">ReleaseExpiredClaim</button>
              </div>
            </form>
          </div>`:""}

    ${t.status==="submitted"?`<div class="action-box">
            <h4>ApproveAndSettle / ExpireSubmission (M-1 Review Timeout)</h4>
            <form id="form-settle">
              <div class="form-grid">
                <div class="field">
                  <label for="settle-rating">Quality Rating (1 - 5)</label>
                  <select id="settle-rating" name="rating" class="select">
                    <option value="5" selected>5 / 5 — Outstanding</option>
                    <option value="4">4 / 5 — Solid</option>
                    <option value="3">3 / 5 — Acceptable</option>
                    <option value="2">2 / 5 — Needs polish</option>
                    <option value="1">1 / 5 — Minimal</option>
                  </select>
                </div>
                <div class="field">
                  <label for="settle-note">Sponsor Review Note</label>
                  <input id="settle-note" name="reviewNote" class="input" value="Verified proof digest and test coverage. Releasing full wugnot escrow." />
                </div>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button type="submit" class="btn btn-emerald btn-sm">Approve &amp; Settle ${c(b(t.escrowUgnot))}</button>
                <button type="button" class="btn btn-sky btn-sm" data-action="expire-submission" data-id="${t.id}">ExpireSubmission (Post-Timeout)</button>
                <button type="button" class="btn btn-sm" data-action="request-revision" data-id="${t.id}">RequestRevision</button>
                <button type="button" class="btn btn-danger btn-sm" data-action="open-dispute" data-id="${t.id}">OpenDispute</button>
              </div>
            </form>
          </div>`:""}

    ${t.status==="disputed"?`<div class="action-box" style="border-color:rgba(251,146,60,0.5);">
            <h4>ResolveDispute (Non-Conflicted Arbiter) / ExpireDispute (50/50 Fallback)</h4>
            <form id="form-resolve-dispute">
              <div class="field">
                <label for="dispute-bps">Hunter Split: <span id="bps-readout" class="mono text-amber">${i.disputeBps} bps (${(i.disputeBps/100).toFixed(2)}%)</span></label>
                <input id="dispute-bps" name="hunterBps" type="range" min="0" max="10000" step="100" value="${i.disputeBps}" data-action="slide-bps" />
                <div class="mono" style="font-size:12px;color:var(--text-secondary);display:flex;justify-content:space-between;margin-top:4px;">
                  <span>Hunter Payout: <strong class="text-emerald">${c(b(r.hunterUgnot))}</strong></span>
                  <span>Contributors Pro-Rata Refund: <strong class="text-sky">${c(b(r.sponsorRefundUgnot))}</strong></span>
                </div>
              </div>
              <div class="field">
                <label for="dispute-res">Arbiter Resolution Note</label>
                <input id="dispute-res" name="resolution" class="input" value="Verified deliverable scope; applying deterministic pro-rata basis-point split." />
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button type="submit" class="btn btn-primary btn-sm">ResolveDispute as ${c(de().handle)}</button>
                <button type="button" class="btn btn-danger btn-sm" data-action="expire-dispute" data-id="${t.id}">ExpireDispute (50/50 Post-Timeout)</button>
              </div>
            </form>
          </div>`:""}

    ${t.status==="settled"||t.status==="cancelled"?`<div class="action-box" style="border-color:rgba(52,211,153,0.4);">
            <h4>Final Settlement Receipt</h4>
            <div class="mono" style="font-size:12px;color:var(--text-secondary);">
              Payout: <strong class="text-emerald">${c(b(t.payoutUgnot))}</strong> ·
              Refund: <strong class="text-sky">${c(b(t.refundUgnot))}</strong> ·
              Rating: <strong>${t.rating?`${t.rating} / 5`:"N/A (Timeout/Arbiter/Cancel)"}</strong>
              ${t.settledHeight?` · Settled Block #${t.settledHeight.toLocaleString()}`:""}
            </div>
            ${t.reviewNote?`<p style="margin:6px 0 0;color:var(--text-secondary);font-size:13px;">"${c(t.reviewNote)}"</p>`:""}
          </div>`:""}
  `}function Ot(){const t=i.onyx,e=t?.metas?.v1,a=t?.metas?.guild,n=t?.metas?.core;return`
    <div class="panel" style="margin-bottom:16px;">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Live Gno.land Onyx (onyx-1) RPC &amp; Multi-Realm Proof Explorer</h2>
          <p class="panel-sub">Direct browser queries to <span class="mono">${c(E)}</span> using native TM2 ABCI JSON-RPC (no backend proxy).</p>
        </div>
        <button class="btn btn-primary btn-sm" data-action="refresh-onyx">
          ${i.onyxLoading?"Querying Onyx...":"Refresh Live RPC"}
        </button>
      </div>

      <div class="kpi-grid" style="margin-bottom:0;">
        <div class="kpi-card">
          <div class="kpi-label">Onyx Network &amp; Block</div>
          <div class="kpi-value ${t?.online?"text-emerald":"text-amber"} mono">${t?.node?`#${t.node.latestBlockHeight.toLocaleString()}`:i.onyxLoading?"Syncing...":"Offline"}</div>
          <div class="kpi-meta"><span>${t?.online?`onyx-1 · ${t.latencyMs}ms · Synced`:c(t?.error??"Awaiting RPC")}</span></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">hearthcore/v0 (/p/)</div>
          <div class="kpi-value ${n?.status==="live"?"text-emerald":"text-amber"}">${c((n?.status??"checking").toUpperCase())}</div>
          <div class="kpi-meta"><span class="mono">Block #1,374,766 · Pure Core</span></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">hearthbounty/v1 (/r/)</div>
          <div class="kpi-value ${e?.status==="live"?"text-emerald":"text-amber"}">${c((e?.status??"checking").toUpperCase())}</div>
          <div class="kpi-meta"><span class="mono">Block #1,378,958 · 1:1 wugnot</span></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">hearthguild/v0 (/r/)</div>
          <div class="kpi-value ${a?.status==="live"?"text-emerald":"text-amber"}">${c((a?.status??"checking").toUpperCase())}</div>
          <div class="kpi-meta"><span class="mono">Block #1,378,960 · Consumer Realm</span></div>
        </div>
      </div>
    </div>

    <div class="two-col" style="margin-bottom:16px;">
      ${Q.map(o=>{const s=t?.metas?.[o.id],r=t?.txs?.[o.id],d=s?.status==="live"?"badge-live":o.legacy?"badge-fail":"badge-inert";return`<section class="panel" style="${o.legacy?"opacity:0.86;border-style:dashed;":""}">
          <div class="panel-header">
            <div>
              <span class="badge ${d}">${c((s?.status??"checking").toUpperCase())}</span>
              ${o.legacy?'<span class="badge badge-neutral" style="margin-left:6px;">SUPERSEDED BY v1</span>':""}
              <h3 class="panel-title" style="margin-top:6px;">${c(o.label)} — ${c(o.kind)}</h3>
            </div>
            ${r?.verified?'<span class="badge badge-pass">RPC TX VERIFIED</span>':'<span class="badge badge-neutral">PENDING CHECK</span>'}
          </div>
          <p class="panel-sub" style="margin-bottom:10px;">${c(o.note)}</p>
          <div class="detail-kv" style="grid-template-columns:1fr;">
            <div class="kv-item">
              <div class="kv-label">On-Chain Module Path</div>
              <div class="kv-val mono" style="font-size:12px;">${c(o.pkgPath)}</div>
            </div>
            <div class="kv-item">
              <div class="kv-label">Confirmed Deployment Block &amp; Gas</div>
              <div class="kv-val mono">
                Block #${(r?.height||o.expectedBlockHeight).toLocaleString()} ·
                Gas ${(r?.gasUsed||o.expectedGasUsed).toLocaleString()}
              </div>
            </div>
            <div class="kv-item">
              <div class="kv-label">Confirmed Transaction Hash (Hex / Base64)</div>
              <div class="kv-val mono" style="font-size:11px;">
                <div>${c(o.txHashHex)}</div>
                <div style="color:var(--text-muted);margin-top:2px;">${c(o.txHashBase64)}</div>
              </div>
            </div>
            ${s?.raw?`<div class="kv-item">
                    <div class="kv-label">Live vm/qpkgmeta_json Response</div>
                    <pre class="code-block" style="margin-top:6px;max-height:130px;">${c(JSON.stringify(JSON.parse(s.raw),null,2))}</pre>
                  </div>`:""}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
            <a class="btn btn-primary btn-sm" href="${o.txRpcUrl}" target="_blank" rel="noopener">Inspect Raw Onyx TX</a>
            <a class="btn btn-sm" href="${o.gnowebUrl}" target="_blank" rel="noopener">Open in gnoweb</a>
          </div>
        </section>`}).join("")}
    </div>

    ${Re.length>0?`<section class="panel" style="margin-bottom:16px;border-color:rgba(52,211,153,0.45);">
            <div class="panel-header">
              <div>
                <h3 class="panel-title">Live Seeded On-Chain Transactions (onyx-1)</h3>
                <p class="panel-sub">12 real MsgCall transactions confirmed on Onyx against Genesis <span class="mono">r/gnoland/wugnot</span> and live <span class="mono">hearthbounty/v1</span>.</p>
              </div>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>Step</th><th>Entrypoint</th><th>Block</th><th>Confirmed TX Hash</th></tr>
                </thead>
                <tbody>
                  ${Re.map(o=>`<tr>
                      <td>${c(o.label)}</td>
                      <td class="mono text-amber">${c(o.func)}</td>
                      <td class="mono">#${o.blockHeight.toLocaleString()}</td>
                      <td class="mono" style="font-size:11.5px;"><a href="${o.txRpcUrl}" target="_blank" rel="noopener">${c(o.txHashHex)}</a></td>
                    </tr>`).join("")}
                </tbody>
              </table>
            </div>
          </section>`:""}

    <div class="callout" style="margin-bottom:16px;">
      <strong>Why V2.1 Switched from <span class="mono">chain/banker</span> (v0) to <span class="mono">r/nt/grc20reg/v0</span> + <span class="mono">wugnot</span> (v1):</strong>
      Forensic audit of Onyx's automated GPAO oracle (<span class="mono">g1yaee4f...yl6adz</span>) confirmed that GPAO auto-enables non-<span class="mono">chain/banker</span> packages after ~60 minutes (~1,050 blocks) while holding <span class="mono">chain/banker</span> realms indefinitely for manual review.
      <span class="mono">hearthbounty/v1</span> settles in official Genesis 1:1 <span class="mono">ugnot</span>-backed <span class="mono">wugnot</span> (<span class="mono">${c(j)}</span>, spender <span class="mono">${c(Z)}</span>) with zero <span class="mono">chain/banker</span> or <span class="mono">unsafe</span> imports, clearing Onyx GPAO cleanly.
      ${t?.liveV1Stats?`<div style="margin-top:10px;"><strong>Live Onyx <span class="mono">hearthbounty/v1.ExportStatsJSON()</span>:</strong><pre class="code-block" style="margin-top:6px;">${c(JSON.stringify(t.liveV1Stats,null,2))}</pre></div>`:""}
      ${t?.liveV1Bounties?`<div style="margin-top:10px;"><strong>Live Onyx <span class="mono">hearthbounty/v1.ExportBountiesJSON()</span>:</strong><pre class="code-block" style="margin-top:6px;">${c(JSON.stringify(t.liveV1Bounties,null,2))}</pre></div>`:""}
    </div>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">Live Onyx gnoweb Rendered UI Proofs</h3>
          <p class="panel-sub">Captured directly from live Onyx (<span class="mono">https://onyx.testnets.gno.land/r/g1x582...uuq4/hearthbounty/v1</span>) serving <span class="mono">Render(path)</span> at HTTP 200.</p>
        </div>
        <a class="btn btn-sm" href="${ye}" target="_blank" rel="noopener">Watch 1080p Demo Video</a>
      </div>
      <div class="gallery-grid">
        <div class="gallery-card">
          <img src="./screenshots/01-home-board.png" alt="HearthBounty gnoweb Home Board" loading="lazy" />
          <div class="gallery-caption">1. Native gnoweb Bounty Board &amp; On-Chain p/nt/svg/v0 Escrow Dashboard</div>
        </div>
        <div class="gallery-card">
          <img src="./screenshots/02-bounty-detail-submitted.png" alt="Bounty Detail and Proof Verification" loading="lazy" />
          <div class="gallery-caption">2. Bounty Detail, Lifecycle SVG Strip, Proof Digest &amp; Wallet Forms</div>
        </div>
        <div class="gallery-card">
          <img src="./screenshots/03-leaderboard.png" alt="Guild Reputation Leaderboard" loading="lazy" />
          <div class="gallery-caption">3. Guild Reputation Leaderboard (Humans + Autonomous AI Agents)</div>
        </div>
        <div class="gallery-card">
          <img src="./screenshots/04-agents-hub.png" alt="AI Agent MCP Hub" loading="lazy" />
          <div class="gallery-caption">4. AI Agent &amp; MCP Integration Hub (vm/qeval JSON + gnomcp)</div>
        </div>
      </div>
    </section>
  `}function Ut(){const t=G.find(a=>a.name===i.selectedTool)??G[0],e=i.mcpResult?.ok&&i.mcpResult.response&&typeof i.mcpResult.response=="object"&&"transaction"in i.mcpResult.response?i.mcpResult.response:null;return`
    <div class="panel" style="margin-bottom:16px;">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">MCP Emulator (In-Browser) — 12 hearthbounty-mcp Tools</h2>
          <p class="panel-sub">Browser-side emulator mirroring <span class="mono">mcp-server/</span> against local simulator state. Switch target chain to <span class="mono">gnoland-1</span> to verify the mainnet write-safety block.</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <label for="mcp-chain-sel" style="font-size:12px;color:var(--text-muted);font-weight:700;">Target Chain:</label>
          <select id="mcp-chain-sel" class="select" style="width:auto;" data-action="mcp-chain">
            <option value="onyx-1" ${i.mcpChainId==="onyx-1"?"selected":""}>onyx-1 (Onyx Testnet)</option>
            <option value="dev" ${i.mcpChainId==="dev"?"selected":""}>dev (Local gnodev)</option>
            <option value="gnoland-1" ${i.mcpChainId==="gnoland-1"?"selected":""}>gnoland-1 (Mainnet — Safety Block Test)</option>
          </select>
          <button class="btn btn-emerald btn-sm" data-action="run-agent-loop">Run Emulated Agent Loop</button>
        </div>
      </div>

      <div class="callout" style="margin-top:8px;">
        <strong>Real Live Onyx Stdio MCP Execution:</strong> For live ABCI RPC queries &amp; tx preparation over stdio (Claude / Cursor / Gemini CLI), run the Node.js server in <span class="mono">mcp-server/</span>:
        <pre class="code-block" style="margin-top:6px;">cd mcp-server &amp;&amp; HEARTH_RPC_URL=${c(E)} HEARTH_CHAIN_ID=onyx-1 HEARTH_REALM_PATH=${c(R)} npm run cli -- status</pre>
      </div>

      ${i.mcpLoopLog.length?`<div class="callout" style="margin-top:8px;">
              <strong>Emulated Autonomous Agent Loop Trace:</strong>
              <ol style="margin:6px 0 0 18px;padding:0;font-size:12px;">
                ${i.mcpLoopLog.map(a=>`<li class="mono" style="margin-bottom:3px;">${c(a)}</li>`).join("")}
              </ol>
            </div>`:""}
    </div>

    <div class="mcp-grid">
      <section class="panel">
        <h3 class="panel-title" style="margin-bottom:10px;">Registered MCP Tools (12)</h3>
        ${G.map(a=>`<button class="tool-btn ${i.selectedTool===a.name?"active":""}" data-tool="${a.name}">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
              <span class="mono" style="font-size:12px;font-weight:700;color:var(--text);">${c(a.name)}</span>
              <span class="badge ${a.mode==="read"?"badge-claimed":"badge-open"}">${c(a.mode)}</span>
            </div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:3px;">${c(a.summary)}</div>
          </button>`).join("")}
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title mono">${c(t.name)}</h3>
            <p class="panel-sub">${c(t.summary)}</p>
          </div>
          <span class="badge ${t.mode==="read"?"badge-claimed":"badge-open"}">${c(t.mode)}</span>
        </div>

        <div class="field">
          <label for="mcp-args-input">JSON Tool Arguments</label>
          <textarea id="mcp-args-input" class="textarea mono" style="min-height:110px;">${c(i.mcpArgsText)}</textarea>
        </div>

        <div style="display:flex;gap:8px;margin-bottom:14px;">
          <button class="btn btn-primary" data-action="exec-mcp">Execute Emulated tools/call</button>
          <button class="btn btn-sm" data-action="reset-mcp-args">Reset Default Args</button>
        </div>

        ${i.mcpResult?`<div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                  <span class="badge ${i.mcpResult.ok?"badge-pass":"badge-fail"}">
                    ${i.mcpResult.ok?"200 OK (EMULATOR)":"BLOCKED / ERROR"} · ${i.mcpResult.durationMs}ms · chain=${c(i.mcpResult.chainId)}
                  </span>
                </div>

                ${i.mcpResult.ok?`<div class="field">
                        <label>MCP Tool Output (JSON)</label>
                        <pre class="code-block">${c(JSON.stringify(i.mcpResult.response,null,2))}</pre>
                      </div>`:`<div class="toast err">${c(i.mcpResult.error)}</div>`}

                ${e?`${e.escrowPreSteps?.length?`<div class="field" style="margin-top:10px;">
                              <label>1:1 wugnot Escrow Pre-Steps (Deposit + Approve)</label>
                              <pre class="code-block">${c(e.escrowPreSteps.map(a=>a.gnokeyCommand).join(`
`))}</pre>
                            </div>`:""}
                      <div class="field" style="margin-top:10px;">
                        <label>Ready-to-Execute gnokey CLI Command</label>
                        <pre class="code-block">${c(e.transaction.gnokeyCommand)}</pre>
                      </div>
                      <div class="field" style="margin-top:10px;">
                        <label>gnomcp gno_call Payload</label>
                        <pre class="code-block">${c(JSON.stringify(e.transaction.gnomcpCallArgs,null,2))}</pre>
                      </div>`:""}

                <div class="field" style="margin-top:10px;">
                  <label>MCP Wire JSON-RPC Request</label>
                  <pre class="code-block">${c(JSON.stringify(i.mcpResult.rpcRequest,null,2))}</pre>
                </div>
              </div>`:'<div class="callout">Click <strong>Execute Emulated tools/call</strong> to inspect the MCP JSON-RPC request, emulator response, and generated <span class="mono">gnomcp</span> / <span class="mono">gnokey</span> payloads.</div>'}
      </section>
    </div>
  `}function Tt(){const t=i.realm.getRankedProfiles(),e=F(i.sanitizeInput),a=[["1:1 wugnot grc20reg Escrow","escrow.gno","Non-crossing RealmTeller transfers in official wugnot; zero chain/banker or unsafe imports across production files."],["Per-Contributor Donor Custody (H-1)","escrow.gno / state.gno","AVL DonorShares ledger returns external top-ups strictly to original donors on CancelBounty and pro-rata on disputes; blocks donor/claimant wash."],["Bounded Liveness & Conflict Guard (M-1)","escrow.gno","Permissionless ExpireSubmission (100% auto-settle) and ExpireDispute (50/50 fallback); ResolveDispute blocks arbiter == sponsor/claimant."],["Unicode-Safe Tag Sanitizer (M-2)","sanitize.gno / render.gno","Byte-indexed ASCII case folding immune to U+0130 'İ' desync + p/nt/markdown/sanitize/v0 + EscapeMath + HTTPS-only proof links."],["Runtime-Current Auth & Direct-EOA Guard","escrow.gno","All crossing functions authenticate cur.Previous().Address(); PostBounty & TopUpBounty enforce AssertOriginCall() + IsUserCall()."],["Composable Consumer Import Proof","hearthguild/v0",`Companion consumer realm ${ce} imports both hearthcore/v0 and hearthbounty/v1 for DAO/grant eligibility gates.`],["Mainnet Write Safety Guard","mcp-server/src/tools.ts","assertWritableChain() permanently blocks write preparation on gnoland-1 / mainnet."]];return`
    <section class="panel" style="margin-bottom:16px;">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Deterministic Guild Reputation Leaderboard</h2>
          <p class="panel-sub">Sorted strictly by earned wugnot, settled count, net sponsored volume, and address tie-breaker (zero unsorted map iteration).</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Builder / Agent</th>
              <th>Tier</th>
              <th>Role</th>
              <th>Earned</th>
              <th>Settled</th>
              <th>Rating</th>
              <th>Net Sponsored</th>
            </tr>
          </thead>
          <tbody>
            ${t.map((n,o)=>`<tr>
                  <td class="mono" style="font-weight:800;">#${o+1}</td>
                  <td>
                    <div style="font-weight:700;">${c(n.handle)}</div>
                    <div class="mono" style="font-size:11px;color:var(--text-muted);">${c(n.address)}</div>
                    ${n.agentEndpoint?`<div class="mono" style="font-size:11px;color:var(--sky);">${c(n.agentEndpoint)}</div>`:""}
                  </td>
                  <td>
                    <span class="badge" style="color:${De(n.tier)};border-color:${De(n.tier)};background:rgba(15,23,42,0.8);">${c(n.tier)}</span>
                  </td>
                  <td>${n.isAgent?'<span class="badge badge-claimed">AI Agent</span>':'<span class="badge badge-neutral">Builder</span>'}</td>
                  <td class="mono text-emerald" style="font-weight:700;">${c(n.earnedFormatted)}</td>
                  <td class="mono">${n.settledCount}</td>
                  <td class="mono">${c(n.ratingFormatted)}</td>
                  <td class="mono">${c(b(n.sponsoredUgnot))}</td>
                </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </section>

    <div class="two-col">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">7 Hardened V2.1 Protocol Invariants</h3>
            <p class="panel-sub">Verified across 16/16 gno test cases and 0 gno lint warnings.</p>
          </div>
          <button class="btn btn-primary btn-sm" data-action="goto-breaker">Test in Breaker Lab</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invariant</th>
                <th>Enforcement</th>
              </tr>
            </thead>
            <tbody>
              ${a.map(([n,o,s])=>`<tr>
                    <td>
                      <div style="font-weight:700;color:var(--amber-bright);">${c(n)}</div>
                      <div class="mono" style="font-size:11px;color:var(--text-muted);">${c(o)}</div>
                    </td>
                    <td style="color:var(--text-secondary);font-size:12px;">${c(s)}</td>
                  </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">Live Unicode-Safe Render() Defense Tester</h3>
            <p class="panel-sub">Includes the Turkish dotted 'İ' (U+0130) expansion payload that bypassed v0 and is 100% blocked in v1.</p>
          </div>
        </div>
        <div class="field">
          <label for="sanitize-input">Untrusted User Input</label>
          <textarea id="sanitize-input" class="textarea mono" data-action="sanitize-input">${c(i.sanitizeInput)}</textarea>
        </div>
        <div class="field">
          <label>Patched v1 Sanitized Render() Output</label>
          <pre class="code-block">${c(e)}</pre>
        </div>
        <div class="callout" style="margin-top:10px;">
          <strong>Arbiter Trust Model &amp; Liveness Guarantee:</strong><br/>
          Disputes route to a rotatable arbiter (<span class="mono">SetArbiter</span>) who is blocked from resolving any bounty they are party to; if the sponsor stalls on review or the arbiter stalls on a dispute, permissionless <span class="mono">ExpireSubmission</span> (100% hunter) and <span class="mono">ExpireDispute</span> (50/50 pro-rata) guarantee bounded liveness.
        </div>
      </section>
    </div>
  `}function Nt(){const t=i.diagReport;return`
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">/diag — Automated V2.1 Security &amp; Live Onyx Self-Test Suite</h2>
          <p class="panel-sub">Executes H-1/M-1/M-2 security regressions, conservation math, MCP 12-tool safety checks, and live Onyx RPC TX proof verification directly in your browser.</p>
        </div>
        <button class="btn btn-primary btn-sm" data-action="run-diag">
          ${i.diagRunning?"Running Diagnostics...":"Re-Run All Diagnostics"}
        </button>
      </div>

      ${t?`<div class="kpi-grid" style="margin-bottom:14px;">
              <div class="kpi-card">
                <div class="kpi-label">Overall Status</div>
                <div class="kpi-value ${t.failed===0?"text-emerald":"text-red"}">${t.failed===0?"ALL PASS":`${t.failed} FAILED`}</div>
                <div class="kpi-meta"><span class="mono">${t.passed} / ${t.total} checks passed</span></div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Total Runtime</div>
                <div class="kpi-value text-sky mono">${t.totalDurationMs} ms</div>
                <div class="kpi-meta"><span class="mono">${c(t.ranAt.slice(11,19))} UTC</span></div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Gno &amp; MCP Repo Suite</div>
                <div class="kpi-value text-emerald">21 / 21</div>
                <div class="kpi-meta"><span>16 gno test · 0 lint · 5 MCP tests</span></div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Onyx Active Deployments</div>
                <div class="kpi-value text-amber mono">3 / 3</div>
                <div class="kpi-meta"><span class="mono">hearthcore · v1 · hearthguild</span></div>
              </div>
            </div>

            <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;">
              ${t.checks.map(e=>`<div class="diag-row">
                    <div><span class="badge ${e.passed?"badge-pass":"badge-fail"}">${e.passed?"PASS":"FAIL"}</span></div>
                    <div><span class="badge badge-neutral">${c(e.category)}</span></div>
                    <div>
                      <div style="font-weight:700;color:var(--text);">${c(e.name)}</div>
                      <div class="mono" style="font-size:12px;color:var(--text-muted);margin-top:2px;">${c(e.detail)}</div>
                    </div>
                    <div class="mono" style="text-align:right;font-size:12px;color:var(--text-muted);">${e.durationMs}ms</div>
                  </div>`).join("")}
            </div>`:'<div class="callout">Running self-test checks against HearthBounty v1 engine and live Onyx RPC...</div>'}
    </section>
  `}function Pt(){return i.drawerOpen?`<div class="drawer-backdrop" data-action="close-drawer-backdrop">
    <aside class="drawer" role="dialog" aria-label="60-Second Judge Walkthrough">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
        <div>
          <h2 style="margin:0;font-size:17px;">60-Second Judge Walkthrough</h2>
          <p class="panel-sub">Zero-install guided verification of every HearthBounty V2.1 guarantee.</p>
        </div>
        <button class="btn btn-sm" data-action="close-drawer">Close</button>
      </div>

      ${[{num:1,time:"0:00 – 0:12",title:"Verify Live Gno.land Onyx (onyx-1) Multi-Realm Proofs",desc:"Inspect live RPC proofs for hearthcore/v0 (#1,374,766), hardened hearthbounty/v1 (#1,378,958), and companion consumer hearthguild/v0 (#1,378,960).",btn:"Open Live Onyx Explorer",action:"walk-1"},{num:2,time:"0:12 – 0:24",title:"Run All 4 Exploits in the Adversarial Breaker Lab",desc:"Fire H-1 Third-Party TopUp Theft, M-2 Unicode U+0130 ('İ') Tag Injection, MITM/uatom Guards, and M-1 Timeout/Conflict Exploits in 1 click.",btn:"Run All 4 Breaker Exploits",action:"walk-2"},{num:3,time:"0:24 – 0:36",title:"Run Emulated AI Agent Loop in MCP Emulator",desc:"Watch an agent call hearth_list_bounties, prepare ClaimBounty, SHA-256 hash a deliverable over HTTPS, and prepare wugnot settlement.",btn:"Run MCP Agent Loop",action:"walk-3"},{num:4,time:"0:36 – 0:48",title:"Settle Escrow & Inspect Guild Reputation Leaderboard",desc:"Approve Bounty #2 as Sponsor to release 5.50 GNOT to ironforge-dev, then inspect the deterministic Leaderboard and V2.1 invariants.",btn:"Settle #2 & Open Leaderboard",action:"walk-4"},{num:5,time:"0:48 – 0:60",title:"Execute /diag Automated Self-Test Suite",desc:"Run all 10 live V2.1 security, custody, timeout, sanitizer, MCP mainnet safety, and Onyx RPC verification checks in under a second.",btn:"Run /diag Self-Test",action:"walk-5"}].map(e=>`<div class="walk-step ${i.completedSteps.has(e.num)?"done":""}">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
              <span class="walk-time">${c(e.time)} · STEP ${e.num}/5</span>
              ${i.completedSteps.has(e.num)?'<span class="badge badge-pass">DONE</span>':""}
            </div>
            <div style="font-weight:700;margin-bottom:4px;">${c(e.title)}</div>
            <p style="margin:0 0 10px;font-size:12px;color:var(--text-muted);">${c(e.desc)}</p>
            <button class="btn btn-primary btn-sm" data-action="${e.action}">${c(e.btn)}</button>
          </div>`).join("")}

      <div class="panel" style="padding:12px;">
        <div style="font-size:12px;font-weight:700;margin-bottom:8px;">Submission Links</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <a class="btn btn-sm" href="${qe}" target="_blank" rel="noopener">10-Slide Deck PDF</a>
          <a class="btn btn-sm" href="${ye}" target="_blank" rel="noopener">1080p YouTube Demo</a>
          <a class="btn btn-sm" href="${ze}" target="_blank" rel="noopener">GitHub Repository</a>
        </div>
      </div>
    </aside>
  </div>`:""}function g(){const t=document.getElementById("app");if(!t)return;let e="";switch(i.tab){case"simulator":e=Dt();break;case"breaker":e=At();break;case"onyx":e=Ot();break;case"mcp":e=Ut();break;case"leaderboard":e=Tt();break;case"diag":e=Nt();break}t.innerHTML=`
    ${$t()}
    <main class="container">${e}</main>
    ${Pt()}
  `,Ht()}async function He(){const t=[],e=i.mcpChainId==="gnoland-1"?"onyx-1":i.mcpChainId;let o=((await P(i.realm,"hearth_list_bounties",{status:"open",limit:10},e)).response?.bounties??[]).sort((h,v)=>v.escrow_ugnot-h.escrow_ugnot)[0]?.id;if(o)t.push(`1. hearth_list_bounties(status="open") -> selected top-funded Bounty #${o}.`);else{const h=D[0];o=i.realm.postBounty({caller:h.address,sentCoins:[{denom:y,amount:3e6}]},"Autonomous Agent Loop Verification Quest","Created automatically for MCP end-to-end discovery, claim, SHA-256 proof, and settlement.","agent",25e3),t.push(`0. Seeded fresh Open Bounty #${o} (3.00 GNOT) for emulated loop.`)}const s=await P(i.realm,"hearth_prepare_claim",{id:o,agentNote:"Claimed autonomously via hearthbounty-mcp emulator loop."},e);t.push(`2. hearth_prepare_claim(id=${o}) -> ok=${s.ok} (${s.durationMs}ms).`);const r=D[1],d=D[0];i.realm.claimBounty({caller:r.address},o,"Autonomous MCP claim executed.");const u=(await P(i.realm,"hearth_prepare_submit_proof",{id:o,proofURL:"https://github.com/alphonshhhomenicmtu/hearthbounty/pull/20",proofContent:`hearthbounty-autonomous-proof-bounty-${o}`,summary:"Delivered deterministic Gno package and passed all unit + lint checks."},e)).response?.computedDigest??"sha256:verified0001";t.push(`3. hearth_prepare_submit_proof (HTTPS-only) -> SHA-256 ${u.slice(0,26)}...`),i.realm.submitProof({caller:r.address},o,"https://github.com/alphonshhhomenicmtu/hearthbounty/pull/20",u,"Delivered deterministic Gno package and passed all unit + lint checks.");const p=await P(i.realm,"hearth_prepare_settle",{id:o,rating:5,reviewNote:"Verified SHA-256 proof and settling full wugnot escrow."},e);t.push(`4. hearth_prepare_settle(id=${o}, rating=5) -> ready to release escrow.`),i.realm.approveAndSettle({caller:d.address},o,5,"Verified SHA-256 proof and settling full wugnot escrow.");const m=i.realm.toProfileView(i.realm.profiles.get(r.address));t.push(`5. ApproveAndSettle executed -> anvil-mcp-agent now ${m.tier} (${m.earnedFormatted}, ${m.settledCount} settled).`),i.mcpLoopLog=t,i.selectedTool="hearth_prepare_settle",i.mcpResult=p,i.selectedBountyId=o,i.completedSteps.add(3),x(!0,`Emulated MCP agent loop settled Bounty #${o}.`),g()}function Ht(){document.querySelectorAll("[data-tab]").forEach(s=>{s.addEventListener("click",()=>{N(s.dataset.tab)})}),document.querySelectorAll("[data-actor]").forEach(s=>{s.addEventListener("click",()=>{i.activeActorId=s.dataset.actor,g()})}),document.querySelectorAll("[data-cat]").forEach(s=>{s.addEventListener("click",()=>{i.filterCategory=s.dataset.cat??"",g()})}),document.querySelectorAll("[data-bounty-id]").forEach(s=>{s.addEventListener("click",()=>{i.selectedBountyId=Number(s.dataset.bountyId),g()})}),document.querySelectorAll("[data-breaker]").forEach(s=>{s.addEventListener("click",()=>{const r=s.dataset.breaker;i.breakerResults[r]=ae(r),g()})}),document.querySelectorAll("[data-tool]").forEach(s=>{s.addEventListener("click",()=>{const r=s.dataset.tool,d=G.find(l=>l.name===r);d&&(i.selectedTool=r,i.mcpArgsText=JSON.stringify(d.defaultArgs,null,2),i.mcpResult=null,g())})});const t=document.querySelector('[data-action="guard-mode"]');t?.addEventListener("change",()=>{i.guardMode=t.value,g()});const e=document.querySelector('[data-action="mcp-chain"]');e?.addEventListener("change",()=>{i.mcpChainId=e.value,g()});const a=document.querySelector('[data-action="sanitize-input"]');a?.addEventListener("input",()=>{i.sanitizeInput=a.value;const s=a.closest("section")?.querySelector("pre.code-block");s&&(s.textContent=F(i.sanitizeInput))});const n=document.querySelector('[data-action="slide-bps"]');n?.addEventListener("input",()=>{i.disputeBps=Number(n.value),g()});const o=(s,r)=>{document.querySelectorAll(`[data-action="${s}"]`).forEach(d=>{d.addEventListener("click",l=>{s==="close-drawer-backdrop"&&l.target!==d||r(d)})})};o("goto-onyx",()=>N("onyx")),o("goto-breaker",()=>N("breaker")),o("refresh-onyx",()=>void be()),o("run-all-breakers",()=>{for(const s of he)i.breakerResults[s.id]=ae(s.id);i.completedSteps.add(2),g()}),o("clear-breakers",()=>{i.breakerResults={},g()}),o("open-drawer",()=>{i.drawerOpen=!0,g()}),o("close-drawer",()=>{i.drawerOpen=!1,g()}),o("close-drawer-backdrop",()=>{i.drawerOpen=!1,g()}),o("dismiss-toast",()=>{i.toast=null,g()}),o("toggle-post-form",()=>{i.showPostForm=!i.showPostForm,g()}),o("advance-blocks",()=>{i.realm.advanceBlocks(5e4),x(!0,`Advanced simulated chain height to #${i.realm.chainHeight.toLocaleString()}.`),g()}),o("reset-realm",()=>{i.realm=Ie(),i.selectedBountyId=5,i.guardMode="eoa",i.mcpLoopLog=[],x(!0,"Reset realm to canonical seeded state (5 bounties, 3 profiles)."),g()}),o("inspect-in-mcp",()=>{i.selectedTool="hearth_chain_status",i.mcpArgsText="{}",N("mcp"),P(i.realm,"hearth_chain_status",{},i.mcpChainId).then(s=>{i.mcpResult=s,g()})}),o("run-full-lifecycle",async()=>{try{const[s,r]=D,d=i.realm.postBounty({caller:s.address,sentCoins:[{denom:y,amount:45e5}]},"Live Simulator Lifecycle Verification","Automated post -> claim -> SHA-256 proof -> CEI settlement -> reputation tier check.","realm",3e4);i.realm.claimBounty({caller:r.address},d,"Claimed in end-to-end simulation.");const l=await le(`hearthbounty-lifecycle-${d}`);i.realm.submitProof({caller:r.address},d,"https://github.com/alphonshhhomenicmtu/hearthbounty/pull/24",l,"Verified deterministic escrow lifecycle and passed all invariant checks."),i.realm.approveAndSettle({caller:s.address},d,5,"Settled cleanly via CEI."),i.selectedBountyId=d,x(!0,`Executed full lifecycle on Bounty #${d}: 4.50 GNOT settled to anvil-mcp-agent; wugnot escrow invariant verified.`),g()}catch(s){x(!1,s instanceof Error?s.message:String(s)),g()}}),o("topup-bounty",s=>{try{const r=Number(s.dataset.id),d=i.realm.bounties.get(r)?.status==="open"?1e6:5e5,l=i.realm.topUpBounty(A(d),r);x(!0,`TopUpBounty(#${r}) succeeded. New escrow: ${b(l)}.`)}catch(r){x(!1,r instanceof Error?r.message:String(r))}g()}),o("cancel-bounty",s=>{try{const r=Number(s.dataset.id);i.realm.cancelBounty(A(),r),x(!0,`CancelBounty(#${r}) refunded each contributor directly (sponsor + external donors).`)}catch(r){x(!1,r instanceof Error?r.message:String(r))}g()}),o("release-claim",s=>{try{const r=Number(s.dataset.id);i.realm.releaseExpiredClaim(A(),r),x(!0,`ReleaseExpiredClaim(#${r}) returned bounty to Open and cleared stale proofs.`)}catch(r){x(!1,r instanceof Error?r.message:String(r))}g()}),o("expire-submission",s=>{try{const r=Number(s.dataset.id);i.realm.expireSubmission(A(),r),x(!0,`ExpireSubmission(#${r}) settled 100% escrow to claimant after review timeout.`)}catch(r){x(!1,r instanceof Error?r.message:String(r))}g()}),o("expire-dispute",s=>{try{const r=Number(s.dataset.id);i.realm.expireDispute(A(),r),x(!0,`ExpireDispute(#${r}) executed permissionless 50/50 pro-rata fallback split.`)}catch(r){x(!1,r instanceof Error?r.message:String(r))}g()}),o("hash-proof",async()=>{const s=document.getElementById("proof-artifact"),r=document.getElementById("proof-digest");s&&r&&(r.value=await le(s.value||"hearthbounty-artifact"))}),o("request-revision",s=>{try{const r=Number(s.dataset.id);i.realm.requestRevision(A(),r,"Please add boundary tests for zero-length inputs."),x(!0,`RequestRevision(#${r}) returned bounty to Claimed with refreshed deadline.`)}catch(r){x(!1,r instanceof Error?r.message:String(r))}g()}),o("open-dispute",s=>{try{const r=Number(s.dataset.id);i.realm.openDispute(A(),r,"Requesting arbiter review for partial scope split."),x(!0,`OpenDispute(#${r}) escalated bounty to Arbiter review with deterministic timeout.`)}catch(r){x(!1,r instanceof Error?r.message:String(r))}g()}),o("exec-mcp",async()=>{const s=document.getElementById("mcp-args-input");i.mcpArgsText=s?.value??"{}";try{const r=JSON.parse(i.mcpArgsText);i.mcpResult=await P(i.realm,i.selectedTool,r,i.mcpChainId)}catch(r){i.mcpResult={tool:i.selectedTool,chainId:i.mcpChainId,ok:!1,durationMs:0,rpcRequest:{},error:`Invalid JSON arguments: ${r instanceof Error?r.message:String(r)}`}}g()}),o("reset-mcp-args",()=>{const s=G.find(r=>r.name===i.selectedTool);s&&(i.mcpArgsText=JSON.stringify(s.defaultArgs,null,2),g())}),o("run-agent-loop",()=>void He()),o("run-diag",()=>void oe()),o("walk-1",()=>{i.completedSteps.add(1),i.drawerOpen=!1,N("onyx"),be()}),o("walk-2",()=>{i.completedSteps.add(2),i.drawerOpen=!1;for(const s of he)i.breakerResults[s.id]=ae(s.id);N("breaker")}),o("walk-3",()=>{i.completedSteps.add(3),i.drawerOpen=!1,N("mcp"),He()}),o("walk-4",()=>{i.completedSteps.add(4),i.drawerOpen=!1;const s=i.realm.bounties.get(2);s&&s.status==="submitted"&&(i.realm.approveAndSettle({caller:D[0].address},2,5,"Verified adversarial V2.1 test suite in Judge Walkthrough."),x(!0,"Settled Bounty #2 (5.50 GNOT) to ironforge-dev; leaderboard updated.")),N("leaderboard")}),o("walk-5",()=>{i.completedSteps.add(5),i.drawerOpen=!1,N("diag"),oe()}),document.getElementById("form-post-bounty")?.addEventListener("submit",s=>{s.preventDefault();const r=new FormData(s.currentTarget);try{const d=i.realm.postBounty(A(Number(r.get("amount"))),String(r.get("title")??""),String(r.get("spec")??""),String(r.get("category")??"realm"),Number(r.get("deadline")??3e4));i.selectedBountyId=d,i.showPostForm=!1,x(!0,`PostBounty created Bounty #${d} with locked 1:1 wugnot escrow.`)}catch(d){x(!1,d instanceof Error?d.message:String(d))}g()}),document.getElementById("form-claim")?.addEventListener("submit",s=>{s.preventDefault();const r=new FormData(s.currentTarget);try{i.realm.claimBounty(A(),i.selectedBountyId,String(r.get("note")??"")),x(!0,`ClaimBounty(#${i.selectedBountyId}) reserved by ${de().handle}.`)}catch(d){x(!1,d instanceof Error?d.message:String(d))}g()}),document.getElementById("form-submit-proof")?.addEventListener("submit",s=>{s.preventDefault();const r=new FormData(s.currentTarget);try{i.realm.submitProof(A(),i.selectedBountyId,String(r.get("proofURL")??""),String(r.get("proofDigest")??""),String(r.get("summary")??"")),x(!0,`SubmitProof(#${i.selectedBountyId}) recorded verifiable SHA-256 digest & review window.`)}catch(d){x(!1,d instanceof Error?d.message:String(d))}g()}),document.getElementById("form-settle")?.addEventListener("submit",s=>{s.preventDefault();const r=new FormData(s.currentTarget);try{i.realm.approveAndSettle(A(),i.selectedBountyId,Number(r.get("rating")??5),String(r.get("reviewNote")??"")),i.completedSteps.add(4),x(!0,`ApproveAndSettle(#${i.selectedBountyId}) released full wugnot escrow via CEI and updated reputation.`)}catch(d){x(!1,d instanceof Error?d.message:String(d))}g()}),document.getElementById("form-resolve-dispute")?.addEventListener("submit",s=>{s.preventDefault();const r=new FormData(s.currentTarget);try{i.realm.resolveDispute(A(),i.selectedBountyId,Number(r.get("hunterBps")??i.disputeBps),String(r.get("resolution")??"")),x(!0,`ResolveDispute(#${i.selectedBountyId}) split escrow deterministically (${i.disputeBps} bps hunter, pro-rata refunds).`)}catch(d){x(!1,d instanceof Error?d.message:String(d))}g()})}window.addEventListener("hashchange",()=>{const t=Ve();t!==i.tab&&(i.tab=t,g(),t==="diag"&&!i.diagReport&&!i.diagRunning&&oe())});g();be();i.tab==="diag"&&oe();window.__HEARTH_PLAYGROUND__={realmPath:R,guildPath:ce,runDiagnostics:Ge,runBreakerTest:ae};
