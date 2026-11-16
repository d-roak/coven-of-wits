import type { Dictionary } from "../engineText"

export const seasonTwoBids: Dictionary = {
	// Shared by these trials: round labels and score labels. Rejected-move messages from the common helpers live in chrome.ts.
	Round: "라운드",
	Auction: "경매",
	Hand: "핸드",
	Showdown: "쇼다운",
	Chips: "칩",
	"{#n} chips": "{n}칩",
	"Your hand": "내 핸드",
	"Your private cards": "내 비공개 카드",

	// Remove One
	"A six-round, 3–5 mage adaptation of the prison game. Everyone starts with cards 1–8.":
		"감옥 게임을 마법사 3–5명, 6라운드로 각색했어요. 모두 1–8 카드를 들고 시작해요.",
	"Choose two cards to reveal. Once all pairs are visible, secretly keep one. The lowest number chosen by exactly one mage wins a point.":
		"공개할 카드 2장을 고르세요. 모두 공개하면 그중 1장을 몰래 남겨요. 한 명만 고른 숫자 중 가장 낮은 숫자가 1점을 얻어요.",
	"Only the kept card is spent. Tied numbers cancel; if none is unique, nobody scores. Most points wins; all tied is a draw.":
		"남긴 카드만 소모돼요. 겹친 숫자는 무효이고, 유일한 숫자가 없으면 아무도 점수를 얻지 못해요. 점수가 가장 많은 마법사가 이기고, 모두 동점이면 무승부예요.",
	"The show’s 18-round elimination ladder and deck resets are omitted.":
		"방송의 18라운드 탈락 사다리와 덱 초기화는 뺐어요.",
	"Six rounds at 3–5 seats; retains the two-card reveal and lowest-unique choice, without the show’s elimination ladder.":
		"3–5인, 6라운드. 카드 2장 공개와 가장 낮은 유일한 숫자 규칙은 그대로이고, 방송의 탈락 사다리는 없어요.",
	"Reveal two": "2장 공개",
	"Keep one": "1장 남기기",
	"Reveal {#a} and {#b}": "{a}, {b} 공개",
	"Keep {#n}": "{n} 남기기",
	"Mage {#n} revealed": "마법사 {n} 공개 카드",
	Choosing: "고르는 중",
	"Choose the first card": "첫 번째 카드를 고르세요",
	"Choose the second card": "두 번째 카드를 고르세요",
	"Round {#n}: {bids}. Mage {#w} wins.": "{n}라운드: {bids}. 마법사 {w} 승리.",
	"Round {#n}: {bids}. No unique card.": "{n}라운드: {bids}. 유일한 카드 없음.",

	// Time Auction
	"A turn-based adaptation: 60 seconds per mage across 9 auctions, entered as whole numbers rather than holding a timer.":
		"턴 방식으로 각색했어요. 마법사마다 60초를 경매 9번에 나눠 쓰고, 타이머를 누르는 대신 초를 정수로 입력해요.",
	"Every bid spends that many seconds. The sole highest bidder earns a point; a tie for highest scores nothing.":
		"입찰한 만큼 초가 소모돼요. 혼자 가장 높게 입찰한 마법사가 1점을 얻고, 최고 입찰이 동률이면 아무도 점수를 얻지 못해요.",
	"Only the winner is announced. Opponents cannot see your bid or remaining time.":
		"승자만 발표돼요. 상대는 내 입찰과 남은 시간을 볼 수 없어요.",
	"Most points wins. Remaining seconds break score ties; identical final records share a win, or draw if everyone ties.":
		"점수가 가장 많은 마법사가 이겨요. 동점이면 남은 초가 많은 쪽이 이기고, 그것도 같으면 공동 우승, 모두 같으면 무승부예요.",
	"Nine sealed auctions using 60 whole-second units; replaces the 19-round, 600-second live timer.":
		"1초 단위 60초로 치르는 봉인 경매 9번. 방송의 19라운드, 600초 실시간 타이머를 대신해요.",
	"Secret auction": "비밀 경매",
	"Spend {#n} seconds": "{n}초 쓰기",
	"Seconds to spend": "쓸 시간(초)",
	"Your time reserve": "내 남은 시간",
	"{#n} seconds": "{n}초",
	"Mage {#n}: thinking": "마법사 {n}: 생각 중",
	"Mage {#n}: sealed": "마법사 {n}: 봉인 완료",
	"Auction {#n}: Mage {#w} wins.": "경매 {n}: 마법사 {w} 승리.",
	"Auction {#n}: no winner.": "경매 {n}: 승자 없음.",

	// Big or Small
	"Alternate contestant and bettor for 18 rounds. Each mage has cards 0–10 and starts with 10 chips.":
		"18라운드 동안 출제자와 베팅하는 쪽을 번갈아 맡아요. 마법사마다 0–10 카드를 들고 칩 10개로 시작해요.",
	"The contestant hides an unused card against the visible dealer card. The bettor wagers 0–5 chips on higher or lower.":
		"출제자는 공개된 딜러 카드에 맞서 아직 쓰지 않은 카드 1장을 숨겨요. 상대는 그 카드가 딜러 카드보다 높은지 낮은지에 칩 0–5개를 걸어요.",
	"The contestant gains the positive card difference, or loses the negative difference. A correct bet gains its stake; a wrong bet loses it; equal cards return the stake.":
		"출제자는 숨긴 카드가 딜러 카드보다 높으면 그 차이만큼 칩을 얻고, 낮으면 그 차이만큼 잃어요. 베팅이 맞으면 건 만큼 얻고, 틀리면 건 만큼 잃어요. 두 카드가 같으면 판돈을 돌려받아요.",
	"At 0 chips a mage loses immediately. Otherwise most chips after 18 rounds wins. This edition caps bets at 5 and omits show timing.":
		"칩이 0개가 되면 바로 져요. 그렇지 않으면 18라운드 뒤 칩이 더 많은 마법사가 이겨요. 이 에디션은 베팅을 5칩까지로 제한하고 방송의 제한 시간은 뺐어요.",
	"Eighteen alternating card/wager rounds, bets capped at five chips, randomly drawn dealer cards and no enforced deadline.":
		"카드와 베팅을 번갈아 맡는 18라운드. 베팅은 5칩까지, 딜러 카드는 무작위이고 제한 시간은 없어요.",
	"Conceal a card": "카드 숨기기",
	"Place a wager": "베팅하기",
	"Conceal {#n}": "{n} 숨기기",
	"Bet {#n} on big": "높다에 {n}칩 베팅",
	"Bet {#n} on small": "낮다에 {n}칩 베팅",
	"Contestant: Mage {#n}": "출제자: 마법사 {n}",
	Dealer: "딜러",
	"Dealer card": "딜러 카드",
	"Concealed card": "숨긴 카드",
	"Your sealed card": "내가 봉인한 카드",
	"Rival sealed card": "상대가 봉인한 카드",
	"Predict the hidden card": "숨긴 카드를 예측하세요",
	"Choose your wager": "걸 칩을 고르세요",
	Higher: "높다",
	Lower: "낮다",
	"Dealer {#d}, hidden {#h}; big wager {#s}.": "딜러 {d}, 숨긴 카드 {h}. 높다에 {s}칩.",
	"Dealer {#d}, hidden {#h}; small wager {#s}.": "딜러 {d}, 숨긴 카드 {h}. 낮다에 {s}칩.",

	// Doubt and Bet
	"A compact 12-showdown adaptation. Each mage starts with 8 chips and 5 hidden colour cards; wild cards match any colour.":
		"쇼다운 12번으로 줄인 각색이에요. 마법사마다 칩 8개와 숨겨진 색 카드 5장으로 시작하고, 와일드 카드는 어떤 색으로도 쳐요.",
	"Raise the claimed number of one colour across the table, or doubt the previous claim. Claims must increase in quantity.":
		"테이블 전체에 있는 한 색의 장수를 더 높여 주장하거나, 앞선 주장을 의심하세요. 주장하는 장수는 계속 늘어나야 해요.",
	"A showdown reveals all cards. A true claim pays its maker; a false claim pays the doubter. The loser transfers 1 chip and loses a card slot, down to a minimum of 1.":
		"쇼다운에서는 모든 카드를 공개해요. 주장이 참이면 주장한 쪽이, 거짓이면 의심한 쪽이 이겨요. 진 쪽은 칩 1개를 넘겨주고 카드 슬롯 하나를 잃어요. 슬롯은 1개 밑으로 줄지 않아요.",
	"Hands refresh after each showdown. A mage at 0 chips leaves the game. Last mage standing or most chips after 12 showdowns wins.":
		"쇼다운이 끝날 때마다 카드를 새로 받아요. 칩이 0개인 마법사는 게임에서 빠져요. 마지막까지 남거나 쇼다운 12번 뒤 칩이 가장 많은 마법사가 이겨요.",
	"This edition fixes wagers at 1 chip and omits raising, folding and slot repurchases.":
		"이 에디션은 판돈을 1칩으로 고정했고 레이즈, 폴드, 슬롯 재구매는 뺐어요.",
	"Twelve showdowns with fixed 1-chip wagers, wild colours and shrinking card slots; no raise, fold or slot repurchase.":
		"쇼다운 12번, 판돈은 1칩 고정. 와일드 색과 줄어드는 카드 슬롯이 있고 레이즈, 폴드, 슬롯 재구매는 없어요.",
	"Claim or doubt": "주장 또는 의심",
	"Claim or challenge": "주장하거나 의심하세요",
	"Doubt the claim": "주장 의심하기",
	"Raise the claim": "주장 올리기",
	"Choose a colour": "색을 고르세요",
	"Choose the quantity": "장수를 고르세요",
	"Claim {#n} {colour}": "{colour} {n}장 주장",
	"Card slots: {slots}": "카드 슬롯: {slots}",
	"Make the opening claim": "첫 주장을 하세요",
	"Mage {#m} claims {#n} {colour}": "마법사 {m}의 주장: {colour} {n}장",
	"Your hidden hand": "내 숨겨진 핸드",
	"Mage {#m} claimed {#n} {colour}.": "마법사 {m}: {colour} {n}장 주장.",
	"{#n} {colour} claimed; {#found} found. Mage {#w} takes 1 chip.":
		"주장 {colour} {n}장, 실제 {found}장. 마법사 {w} 칩 1개 획득.",

	// Sniper Hold'em
	"A five-hand adaptation with 60 chips per mage. Each hand deals 2 private cards and 4 community cards; use the best 5 of those 6.":
		"핸드 5번으로 각색했어요. 마법사마다 칩 60개로 시작해요. 핸드마다 비공개 카드 2장과 공용 카드 4장을 받고, 그 6장 중 가장 좋은 5장을 써요.",
	"Secretly stake 1–5 chips, then secretly name a hand category to snipe. A category named by any rival disqualifies your hand.":
		"칩 1–5개를 몰래 건 다음, 저격할 족보 하나를 몰래 정해요. 상대 중 누구라도 내 족보를 지목하면 내 핸드는 실격이에요.",
	"The highest surviving poker hand wins the pooled stakes. Equal winning hands share the pot; if all are sniped, stakes return.":
		"살아남은 핸드 중 가장 높은 포커 핸드가 모인 판돈을 가져가요. 같은 핸드로 이기면 팟을 나누고, 모두 저격당하면 판돈을 돌려받아요.",
	"Most chips after 5 hands wins. This edition replaces the show’s 75-chip escape ladder, sequential betting and fold options with sealed stakes.":
		"핸드 5번 뒤 칩이 가장 많은 마법사가 이겨요. 이 에디션은 방송의 75칩 탈출 사다리, 순차 베팅, 폴드를 봉인 판돈으로 바꿨어요.",
	"Five poker hands with sealed 1–5 chip stakes and rival-category sniping; no sequential betting or escape ladder.":
		"포커 핸드 5번. 칩 1–5개를 봉인해 걸고 상대의 족보를 저격해요. 순차 베팅과 탈출 사다리는 없어요.",
	"Seal a stake": "판돈 봉인",
	"Snipe a category": "족보 저격",
	"Stake {#n} chips": "{n}칩 걸기",
	"Chips to stake": "걸 칩",
	"Seal stake": "판돈 봉인하기",
	"Snipe {hand}": "{hand} 저격",
	"Community cards": "공용 카드",
	"Your hand: {hand}": "내 핸드: {hand}",
	"Mage {#n}: choosing stake": "마법사 {n}: 판돈 고르는 중",
	"Mage {#n}: stake sealed": "마법사 {n}: 판돈 봉인 완료",
	"Mage {#n}: snipe sealed": "마법사 {n}: 저격 봉인 완료",
	"high card": "하이 카드",
	pair: "페어",
	"two pairs": "투 페어",
	"three of a kind": "트리플",
	straight: "스트레이트",
	flush: "플러시",
	"full house": "풀 하우스",
	"four of a kind": "포카드",
	"straight flush": "스트레이트 플러시",
	"Hand {#n}: {results}. Pot to {winners}.": "핸드 {n}: {results}. 팟 획득: 마법사 {winners}.",
	"Hand {#n}: {results}. All stakes returned.": "핸드 {n}: {results}. 판돈 전부 반환.",
	"{hand} (sniped)": "{hand} (저격당함)",
	"Mage {#n} high card": "마법사 {n} 하이 카드",
	"Mage {#n} pair": "마법사 {n} 페어",
	"Mage {#n} two pairs": "마법사 {n} 투 페어",
	"Mage {#n} three of a kind": "마법사 {n} 트리플",
	"Mage {#n} straight": "마법사 {n} 스트레이트",
	"Mage {#n} flush": "마법사 {n} 플러시",
	"Mage {#n} full house": "마법사 {n} 풀 하우스",
	"Mage {#n} four of a kind": "마법사 {n} 포카드",
	"Mage {#n} straight flush": "마법사 {n} 스트레이트 플러시",

	// Triple Dice
	"A four-round adaptation. Each mage receives 9 public white dice and 2 private coloured dice. Before playing, predict your total for the round.":
		"4라운드로 각색했어요. 마법사마다 공개 흰 주사위 9개와 비공개 색 주사위 2개를 받아요. 시작하기 전에 이번 라운드에 얻을 점수를 예측하세요.",
	"Submit 3 unused dice at a time. A triple beats a straight, then a pair, then high dice; higher faces break category ties. No wraparound straights.":
		"아직 쓰지 않은 주사위를 3개씩 내요. 트리플이 가장 높고 스트레이트, 페어, 하이 순이에요. 같은 족보끼리는 눈이 높은 쪽이 이겨요. 6에서 1로 이어지는 스트레이트는 없어요.",
	"Each round has 3 submissions. Place scores are 6, 3, 1, then 0. Equal hands receive the same place score. The 2 unused dice are discarded.":
		"라운드마다 3번 내요. 순위 점수는 6, 3, 1, 그 아래는 0점이에요. 같은 족보는 같은 순위 점수를 받아요. 쓰지 않은 주사위 2개는 버려요.",
	"Predictions: zero = 0; minimum = 1–6; more = 7–10; maximum = 11+. Correct zero earns 40; any other correct prediction doubles your round score.":
		"예측: 제로 = 0점, 최소 = 1–6점, 초과 = 7–10점, 최대 = 11점 이상. 제로를 맞히면 40점을 얻고, 다른 예측을 맞히면 라운드 점수가 두 배가 돼요.",
	"Most total points wins. This edition supports 2–5 players, seals submissions simultaneously and refreshes predictions each round.":
		"총점이 가장 높은 마법사가 이겨요. 이 에디션은 2–5인용이고, 모두 동시에 봉인해서 내며, 예측은 라운드마다 새로 해요.",
	"Four rounds at 2–5 seats with simultaneous three-die submissions and refreshed forecasts; retains public/private dice and score predictions.":
		"2–5인, 4라운드. 주사위 3개를 동시에 내고 예측은 라운드마다 새로 해요. 공개·비공개 주사위와 점수 예측은 그대로예요.",
	"Forecast your round": "라운드 점수 예측",
	"Select three dice": "주사위 3개 고르기",
	"Cast {#n}": "{n}번째 던지기",
	"0 points · earn 40": "0점 · 40점 획득",
	"1–6 points · double": "1–6점 · 두 배",
	"7–10 points · double": "7–10점 · 두 배",
	"11+ points · double": "11점 이상 · 두 배",
	"Round points: {points}": "라운드 점수: {points}",
	"Your forecast: zero": "내 예측: 제로",
	"Your forecast: minimum": "내 예측: 최소",
	"Your forecast: more": "내 예측: 초과",
	"Your forecast: maximum": "내 예측: 최대",
	"Your forecast: not sealed": "내 예측: 아직 봉인 전",
	"Mage {#n} · public white dice": "마법사 {n} · 공개 흰 주사위",
	"Die {#n}: {#face}": "주사위 {n}: {face}",
	"Your private dice": "내 비공개 주사위",
	"Private red die": "비공개 빨간 주사위",
	"Private blue die": "비공개 파란 주사위",
	"Choose 3 unused dice": "쓰지 않은 주사위 3개를 고르세요",
	"Seal three dice": "주사위 3개 봉인하기",
	"{#n}: {#face} (white)": "{n}번: {face} (흰색)",
	"{#n}: {#face} (red, private)": "{n}번: {face} (빨강, 비공개)",
	"{#n}: {#face} (blue, private)": "{n}번: {face} (파랑, 비공개)",
	"Round {#n}, cast {#c}: {results}": "{n}라운드 {c}번째 던지기: {results}",
	"Round {#n}, cast {#c}: {results}. Forecast payouts: {payouts}":
		"{n}라운드 {c}번째 던지기: {results}. 예측 정산: {payouts}",

	// Question and Truth
	"A two-player deduction adaptation. Each mage receives 8 hidden cards from a 52-card deck, arranged with each suit’s ranks ascending. Ace = 1, Jack = 11, Queen = 12, King = 13.":
		"2인용 추리 게임으로 각색했어요. 마법사마다 52장 덱에서 숨겨진 카드 8장을 받고, 같은 무늬끼리는 랭크가 오름차순이 되게 놓여요. 에이스 = 1, 잭 = 11, 퀸 = 12, 킹 = 13.",
	"Secretly bid tokens for a question or a full guess. Higher bid acts; both bids are spent. Ties return bids, give both mages 2 tokens and repeat. Both gain 2 tokens after a question or failed guess.":
		"질문 하나 또는 정답 선언 기회를 두고 토큰을 몰래 입찰해요. 더 높게 입찰한 쪽이 행동하고, 두 입찰 모두 소모돼요. 동률이면 입찰을 돌려받고 둘 다 토큰 2개를 받은 뒤 다시 입찰해요. 질문하거나 선언이 틀린 뒤에도 둘 다 토큰 2개를 받아요.",
	"Questions reveal truthful sums, counts or positions. Face-card questions include Ace, Jack, Queen and King. Consecutive-rank questions include every rank with a neighbour one away.":
		"질문하면 합, 개수, 위치를 사실대로 알려 줘요. 그림 카드 질문에는 에이스, 잭, 퀸, 킹이 들어가요. 연속 랭크 질문에는 1 차이 나는 카드가 있는 랭크가 모두 들어가요.",
	"To declare truth, choose all 8 ranks in order. Suits do not need guessing. The first correct full sequence wins.":
		"진실을 선언하려면 랭크 8개를 순서대로 모두 고르세요. 무늬는 맞히지 않아도 돼요. 8개를 먼저 다 맞힌 마법사가 이겨요.",
	"This edition deals the secrets, answers automatically, and draws after 60 auctions. It omits setup card selection and the show’s clock.":
		"이 에디션은 비밀 카드를 알아서 나눠 주고 질문에 자동으로 답하며, 경매 60번이 지나면 무승부예요. 시작할 때 카드를 고르는 과정과 방송의 시계는 뺐어요.",
	"Randomly dealt ordered secrets, automatic truthful answers, refunded tied bids and a 60-auction draw limit.":
		"무작위로 나눠 정렬한 비밀 카드, 자동으로 나오는 사실대로의 답, 동률 입찰 환불, 경매 60번 무승부 제한.",
	"Bid for a question": "질문권 입찰",
	"Question or truth": "질문 또는 진실",
	"Bid {#n} tokens": "토큰 {n}개 입찰",
	"Tokens to bid": "입찰할 토큰",
	"Your tokens: {#n}": "내 토큰: {n}",
	"Rival reserve: 5 or fewer": "상대 토큰: 5개 이하",
	"Rival reserve: more than 5": "상대 토큰: 6개 이상",
	"Position {#n}: {card}": "{n}번 위치: {card}",
	"Rival positions": "상대 카드 위치",
	"Questions asked": "질문 횟수",
	"Declare all 8 ranks": "랭크 8개 모두 선언",
	"Declare truth": "진실 선언",
	"Choose a question": "질문을 고르세요",
	"Choose position {#n} of 3": "위치 3개 중 {n}번째를 고르세요",
	"Choose the question parameter": "질문 대상을 고르세요",
	"Sum of three positions": "세 위치의 합",
	"Sum of a suit": "무늬의 합",
	"Positions of a suit": "무늬의 위치",
	"Count a rank": "랭크 개수",
	"Extreme ranks": "가장 낮거나 높은 랭크",
	Lowest: "가장 낮은 랭크",
	Highest: "가장 높은 랭크",
	"Sum at {#a}, {#b}, {#c}": "{a}, {b}, {c}번 위치의 합",
	"Sum of moons": "달의 합",
	"Sum of leaves": "잎의 합",
	"Sum of flames": "불꽃의 합",
	"Sum of stars": "별의 합",
	"Positions of moons": "달의 위치",
	"Positions of leaves": "잎의 위치",
	"Positions of flames": "불꽃의 위치",
	"Positions of stars": "별의 위치",
	"Sum of face cards": "그림 카드의 합",
	"Sum of number cards": "숫자 카드의 합",
	"Count face cards": "그림 카드 개수",
	"Count number cards": "숫자 카드 개수",
	"Count rank {#n}": "랭크 {n} 개수",
	"Positions of equal ranks": "같은 랭크의 위치",
	"Positions of consecutive ranks": "연속 랭크의 위치",
	"Positions of lowest rank": "가장 낮은 랭크의 위치",
	"Positions of highest rank": "가장 높은 랭크의 위치",
	none: "없음",
	// Clue lines print the engine's raw move: positions and suits count from 0 there.
	"Clue: sum {#a},{#b},{#c} = {#n}": "단서: 위치 합 {a},{b},{c} = {n}",
	"Clue: suit-sum 0 = {#n}": "단서: 달의 합 = {n}",
	"Clue: suit-sum 1 = {#n}": "단서: 잎의 합 = {n}",
	"Clue: suit-sum 2 = {#n}": "단서: 불꽃의 합 = {n}",
	"Clue: suit-sum 3 = {#n}": "단서: 별의 합 = {n}",
	"Clue: suit-positions 0 = {answer}": "단서: 달의 위치 = {answer}",
	"Clue: suit-positions 1 = {answer}": "단서: 잎의 위치 = {answer}",
	"Clue: suit-positions 2 = {answer}": "단서: 불꽃의 위치 = {answer}",
	"Clue: suit-positions 3 = {answer}": "단서: 별의 위치 = {answer}",
	"Clue: face-sum  = {#n}": "단서: 그림 카드의 합 = {n}",
	"Clue: number-sum  = {#n}": "단서: 숫자 카드의 합 = {n}",
	"Clue: face-count  = {#n}": "단서: 그림 카드 개수 = {n}",
	"Clue: number-count  = {#n}": "단서: 숫자 카드 개수 = {n}",
	"Clue: rank-count {#rank} = {#n}": "단서: 랭크 {rank} 개수 = {n}",
	"Clue: equal  = {answer}": "단서: 같은 랭크의 위치 = {answer}",
	"Clue: consecutive  = {answer}": "단서: 연속 랭크의 위치 = {answer}",
	"Clue: extreme low = {answer}": "단서: 가장 낮은 랭크의 위치 = {answer}",
	"Clue: extreme high = {answer}": "단서: 가장 높은 랭크의 위치 = {answer}",
	"Mage {#m}: {question} = {answer}": "마법사 {m}: {question} = {answer}",
	"Mage {#n} named every rank.": "마법사 {n}: 모든 랭크를 맞혔어요.",
	"Mage {#n} made an incorrect truth attempt.": "마법사 {n}: 진실 선언이 틀렸어요.",
	"Tied auction. Both mages received 2 tokens.": "입찰 동률. 두 마법사 모두 토큰 2개를 받았어요.",
	"Choose one of the listed questions.": "목록에 있는 질문 중에서 고르세요.",
	"Win the auction before declaring truth.": "진실을 선언하려면 먼저 경매에서 이기세요.",
	"Enter exactly 8 ranks from 1 to 13, separated by commas.": "1부터 13까지의 랭크 8개를 쉼표로 구분해 입력하세요.",
	"Every rank must be from 1 to 13.": "랭크는 모두 1부터 13 사이여야 해요.",
}
