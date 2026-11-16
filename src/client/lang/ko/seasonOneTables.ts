import type { Dictionary } from "../engineText"

export const seasonOneTables: Dictionary = {
	// Words these tables share.
	Round: "라운드",
	Points: "점수",
	Coins: "코인",

	// virus-game: rules and edition note.
	"A five-seat adaptation of the show’s hidden-role Virus Game: one Hexer, Researcher, Officer, Journalist and Citizen.":
		"방송의 정체 숨김 게임 ‘바이러스 게임’을 다섯 자리로 각색했어요. 저주술사, 연구원, 경찰, 기자, 시민이 한 명씩 있어요.",
	"The Hexer has one infection, one shot and one antidote. The Officer may shoot once each round. The Journalist privately learns one target’s role.":
		"저주술사는 감염, 사격, 해독제를 한 번씩 쓸 수 있어요. 경찰은 라운드마다 한 번 쏠 수 있어요. 기자는 고른 대상의 역할을 혼자만 알게 돼요.",
	"The Citizen carries antibodies. The Researcher must study that living mage in two rounds to finish the cure. Antibodies clear infection after each round.":
		"시민은 항체를 지니고 있어요. 연구원이 살아 있는 시민을 두 라운드에 걸쳐 연구하면 치료제가 완성돼요. 항체는 라운드가 끝날 때마다 감염을 없애요.",
	"An untreated infection spreads to adjacent living seats around the circle and kills after two following round resolutions. Everyone may privately test themselves once.":
		"치료하지 않은 감염은 원을 따라 살아 있는 양옆 자리로 퍼지고, 그 뒤 라운드가 두 번 정산되면 감염자가 탈락해요. 누구나 한 번, 자신의 감염 여부를 몰래 검사할 수 있어요.",
	"Each living mage seals one action per round; actions resolve together. Citizens win when the Hexer dies or the cure completes. The Hexer wins when only they and the immune Citizen remain, or after eight rounds.":
		"살아 있는 마법사는 라운드마다 행동 하나를 봉인하고, 모든 행동은 한꺼번에 정산돼요. 저주술사가 탈락하거나 치료제가 완성되면 시민 진영이 이겨요. 저주술사와 면역인 시민만 남거나 8라운드가 지나면 저주술사가 이겨요.",
	"This edition reduces the original 12 roles to five, omits the Fanatic and individual Piece payouts, and replaces live timed actions with simultaneous rounds. Use room chat to share claims.":
		"이 에디션은 원작의 역할 12개를 5개로 줄였고, 광신도와 개인별 피스 보상이 없어요. 실시간 제한 시간 행동은 동시 진행 라운드로 바꿨어요. 주장은 방 채팅으로 나누세요.",
	"Five roles, simultaneous actions and eight rounds; omits the Fanatic, extra terrorists/researchers/citizens and individual Piece payouts.":
		"역할 5개, 동시 행동, 8라운드. 광신도, 추가 테러리스트·연구원·시민, 개인별 피스 보상은 없어요.",

	// virus-game: roles, abilities and table text.
	Hexer: "저주술사",
	Researcher: "연구원",
	Officer: "경찰",
	Journalist: "기자",
	Citizen: "시민",
	Infect: "감염",
	Shoot: "사격",
	Treat: "치료",
	Research: "연구",
	Investigate: "조사",
	"Infect mage {#n}": "마법사 {n} 감염시키기",
	"Shoot mage {#n}": "마법사 {n} 쏘기",
	"Treat mage {#n}": "마법사 {n} 치료하기",
	"Research mage {#n}": "마법사 {n} 연구하기",
	"Investigate mage {#n}": "마법사 {n} 조사하기",
	"Wait this round": "이번 라운드 쉬기",
	"Take private test": "비밀 검사 받기",
	"Choose an ability": "능력을 고르세요",
	"Choose a living mage": "살아 있는 마법사를 고르세요",
	"Seal an action": "행동 봉인",
	"Share claims in chat, then seal your role’s action.": "채팅으로 주장을 나눈 뒤 내 역할의 행동을 봉인하세요.",
	Alive: "생존",
	"Your secret role": "내 비밀 역할",
	"The circle": "원탁",
	sealed: "봉인함",
	choosing: "고르는 중",
	fallen: "탈락",
	"Your role: {role}.": "내 역할: {role}.",
	"Cure progress: {#cure} of 2. Infected mages: {#count}.": "치료제 진행: 2 중 {cure}. 감염된 마법사: {count}명.",
	"Mage {#n}: alive.": "마법사 {n}: 생존.",
	"Mage {#n}: alive, action sealed.": "마법사 {n}: 생존, 행동 봉인함.",
	"Mage {#n}: fallen ({role}).": "마법사 {n}: 탈락 ({role}).",
	"Mage {#n}: fallen ({role}), action sealed.": "마법사 {n}: 탈락 ({role}), 행동 봉인함.",
	"Mage {#n}: Hexer.": "마법사 {n}: 저주술사.",
	"Mage {#n}: Researcher.": "마법사 {n}: 연구원.",
	"Mage {#n}: Officer.": "마법사 {n}: 경찰.",
	"Mage {#n}: Journalist.": "마법사 {n}: 기자.",
	"Mage {#n}: Citizen.": "마법사 {n}: 시민.",
	"Your sealed action: wait.": "봉인한 행동: 쉬기.",
	"Your sealed action: infect mage {#n}.": "봉인한 행동: 마법사 {n} 감염.",
	"Your sealed action: shoot mage {#n}.": "봉인한 행동: 마법사 {n} 사격.",
	"Your sealed action: antidote mage {#n}.": "봉인한 행동: 마법사 {n} 치료.",
	"Your sealed action: research mage {#n}.": "봉인한 행동: 마법사 {n} 연구.",
	"Your sealed action: investigate mage {#n}.": "봉인한 행동: 마법사 {n} 조사.",
	"Your one-time test result: infected.": "한 번뿐인 검사 결과: 감염.",
	"Your one-time test result: clear at test time.": "한 번뿐인 검사 결과: 검사 시점에는 음성.",
	"Private investigation: mage {#n} is {role}.": "비밀 조사: 마법사 {n}의 역할은 {role}.",
	"Round {#n} resolved.": "{n}라운드 정산 완료.",
	"Mage {#n} fell: {role}.": "마법사 {n} 탈락: {role}.",
	"A fallen mage cannot act.": "탈락한 마법사는 행동할 수 없어요.",
	"Your action is already sealed.": "행동을 이미 봉인했어요.",
	"Your private test has been used.": "비밀 검사는 이미 썼어요.",
	"That ability is unavailable to your role.": "내 역할로는 쓸 수 없는 능력이에요.",
	"Choose a living mage.": "살아 있는 마법사를 고르세요.",
	"Choose another mage for that ability.": "그 능력은 다른 마법사에게 써야 해요.",

	// rules-race: rules and edition note.
	"A 20-space adaptation of the show’s rule-building race for 2–5 mages.":
		"방송의 규칙 만들기 경주를 20칸 트랙, 마법사 2–5명용으로 각색했어요.",
	"Choose one personal rule. The die has faces 1, 2, 2, 3, Prison and Escape. Prison freezes movement until Escape is rolled or a ticket is spent.":
		"개인 규칙을 하나 고르세요. 주사위 면은 1, 2, 2, 3, 감옥, 탈출이에요. 감옥에 갇히면 탈출이 나오거나 탈출권을 쓸 때까지 움직일 수 없어요.",
	"Land on office spaces 4, 8, 12 or 16 by rolling to gain a ticket, roll again, or rewrite the shared rule.":
		"주사위를 굴려 사무소 칸(4, 8, 12, 16)에 서면 탈출권 받기, 다시 굴리기, 공동 규칙 고쳐 쓰기 중 하나를 골라요.",
	"The first mage to reach space 20 wins. After 160 turns, the furthest mages win.":
		"20번 칸에 먼저 닿는 마법사가 이겨요. 160턴이 지나면 가장 멀리 간 마법사들이 이겨요.",
	"This edition offers three personal and three shared rules instead of free-form rule blocks. It has no special die, ticket trading, or season Piece penalties.":
		"이 에디션은 자유롭게 조합하는 규칙 블록 대신 개인 규칙 3개와 공동 규칙 3개를 제공해요. 특수 주사위, 탈출권 거래, 시즌 피스 벌칙은 없어요.",
	"2–5 players on a 20-space track with three personal/shared rule choices; no free-form blocks, special die or ticket trading.":
		"2–5명, 20칸 트랙, 개인·공동 규칙 선택지 각 3개. 자유 조합 블록, 특수 주사위, 탈출권 거래는 없어요.",

	// rules-race: the six rules a mage can write, then table text.
	"Whenever anyone is imprisoned, gain an escape ticket.": "누군가 감옥에 갇힐 때마다 탈출권 1장을 받아요.",
	"When you escape prison, advance one space.": "감옥에서 탈출하면 1칸 전진해요.",
	"When you roll three, advance one extra space.": "3이 나오면 1칸 더 전진해요.",
	"A roll of one moves two spaces.": "1이 나오면 2칸 이동해요.",
	"A prison roll moves one space instead.": "감옥이 나오면 갇히는 대신 1칸 이동해요.",
	"A roll of three moves four spaces.": "3이 나오면 4칸 이동해요.",
	Prison: "감옥",
	Escape: "탈출",
	"Write a personal rule": "개인 규칙 쓰기",
	"Choose an office benefit": "사무소 혜택 고르기",
	"Race through the woods": "숲속 경주",
	"Mage {#n} acts. First to space 20 wins.": "마법사 {n} 차례예요. 20번 칸에 먼저 닿으면 이겨요.",
	"Track position": "트랙 위치",
	"Escape tickets": "탈출권",
	imprisoned: "수감 중",
	"Mage {#n}: {#count}": "마법사 {n}: {count}",
	"Your rule: not chosen": "내 규칙: 아직 고르지 않음",
	"Your rule: {rule}": "내 규칙: {rule}",
	"Shared rule: none": "공동 규칙: 없음",
	"Shared rule: {rule}": "공동 규칙: {rule}",
	"Mage {#n}: space {#space}, {#count} tickets.": "마법사 {n}: {space}번 칸, 탈출권 {count}장.",
	"Mage {#n}: space {#space}, {#count} tickets, imprisoned.": "마법사 {n}: {space}번 칸, 탈출권 {count}장, 수감 중.",
	"{#n} Office": "{n} 사무소",
	"Take escape ticket": "탈출권 받기",
	"Roll again": "다시 굴리기",
	"Rewrite shared rule": "공동 규칙 고쳐 쓰기",
	"Choose office benefit": "사무소 혜택을 고르세요",
	"Choose shared rule": "공동 규칙을 고르세요",
	"Roll die": "주사위 굴리기",
	"Spend escape ticket": "탈출권 쓰기",
	"Mage {#n} chose: {rule}": "마법사 {n}의 선택: {rule}",
	"Mage {#n} changed the shared rule: {rule}": "마법사 {n}의 공동 규칙 변경: {rule}",
	"Mage {#n} chose another roll.": "마법사 {n}: 다시 굴리기 선택.",
	"Mage {#n} took an escape ticket.": "마법사 {n}: 탈출권 1장 획득.",
	"Mage {#n} spent an escape ticket.": "마법사 {n}: 탈출권 1장 사용.",
	"Mage {#n} rolled {face}.": "마법사 {n}의 주사위: {face}.",
	"Choose a personal rule first.": "먼저 개인 규칙을 고르세요.",
	"Choose an office benefit.": "사무소 혜택을 고르세요.",
	"An imprisoned mage needs an escape ticket.": "갇힌 마법사는 탈출권이 있어야 해요.",
	"Roll the die or use an escape ticket.": "주사위를 굴리거나 탈출권을 쓰세요.",

	// secret-number: rules and edition note.
	"Every mage has a different secret number from 1 to 100. Nobody sees their own number.":
		"마법사마다 1부터 100 사이의 서로 다른 비밀 숫자가 있어요. 자기 숫자는 아무도 볼 수 없어요.",
	"Spend each of four tickets once to compare your number with another mage: sum, product’s last digit, integer quotient of larger/smaller, or multiples of ten strictly between them.":
		"단서권 4장을 한 번씩 써서 내 숫자를 다른 마법사의 숫자와 비교하세요. 합, 곱의 끝자리, 큰 수를 작은 수로 나눈 정수 몫, 두 수 사이에 있는 10의 배수 개수를 알 수 있어요.",
	"Sums below 20 show 3–20; sums above 180 show 180–199. Your clue results are private.":
		"합이 20 미만이면 3–20, 180을 넘으면 180–199로 표시돼요. 단서 결과는 나만 볼 수 있어요.",
	"After all tickets are spent, guess numbers in mage order. Your own guess is required; use ? to skip another mage. Own guess scores +5/−5; other guesses score +1/−1. Lose 1 for each rival who guesses you. All correct adds 5.":
		"단서권을 모두 쓰면 마법사 순서대로 숫자를 추측해요. 내 숫자는 꼭 적어야 하고, 다른 마법사는 ?로 건너뛸 수 있어요. 내 숫자는 맞히면 +5점, 틀리면 −5점이고 다른 숫자는 +1점, −1점이에요. 내 숫자를 맞힌 상대 한 명마다 1점을 잃어요. 전부 맞히면 5점을 더 받아요.",
	"This edition uses four turns each instead of a 120-minute negotiation window. It omits mutual ticket consent, extra-ticket purchases and prison bets.":
		"이 에디션은 120분 협상 시간 대신 각자 네 턴을 써요. 단서권 상호 동의, 추가 단서권 구매, 감옥 베팅은 없어요.",
	"2–5 players, private numeric clues and sealed scoring; four turns each, no mutual-ticket consent, extra purchases or prison bets.":
		"2–5명, 비공개 숫자 단서, 봉인 채점. 각자 네 턴이고 단서권 상호 동의, 추가 구매, 감옥 베팅은 없어요.",

	// secret-number: clue tickets and table text.
	sum: "합",
	product: "곱의 끝자리",
	quotient: "몫",
	zeros: "사이의 10의 배수",
	"{type} with mage {#n}": "마법사 {n}에게 묻기: {type}",
	"With mage {#n}: {type} → {result}.": "마법사 {n}에게 물은 {type}: {result}.",
	"Numbers: {list}.": "숫자: {list}.",
	"Ask for a clue": "단서 요청",
	"Seal your guesses": "추측 봉인",
	"Mage {#n} spends a clue ticket.": "마법사 {n}: 단서권을 쓸 차례예요.",
	"Name your number, then choose which rivals to guess.": "내 숫자를 적고, 어떤 상대의 숫자를 추측할지 고르세요.",
	"You are mage {#n}. Your own number is hidden.": "나는 마법사 {n}. 내 숫자는 가려져 있어요.",
	"Mage {#n}: {#count} tickets left.": "마법사 {n}: 남은 단서권 {count}장.",
	"Mage {#n}: {#count} tickets left, guesses sealed.": "마법사 {n}: 남은 단서권 {count}장, 추측 봉인함.",
	"Choose clue ticket": "단서권을 고르세요",
	"Choose comparison partner": "비교할 마법사를 고르세요",
	"Revealed numbers": "공개된 숫자",
	"Your sealed guesses": "봉인한 내 추측",
	"Your number guesses": "숫자 추측",
	"Seal guesses": "추측 봉인하기",
	"Your number": "내 숫자",
	"Skip this mage": "이 마법사 건너뛰기",
	"Spend your clue tickets before guessing.": "추측하기 전에 단서권을 먼저 쓰세요.",
	"Choose a partner and a valid clue ticket.": "상대와 쓸 수 있는 단서권을 고르세요.",
	"Choose another mage for the comparison.": "비교할 상대는 다른 마법사여야 해요.",
	"That ticket has already been spent.": "그 단서권은 이미 썼어요.",
	"Submit your number guesses.": "숫자 추측을 제출하세요.",
	"Your guesses are already sealed.": "추측을 이미 봉인했어요.",
	"Give one number or ? for every mage, in seat order.": "자리 순서대로 마법사마다 숫자 하나 또는 ?를 적으세요.",

	// zoo: rules and edition note.
	"Each mage has a secret three-animal pattern and a condition: one animal must outnumber another. Your first pattern animal is public.":
		"마법사마다 동물 3마리로 된 비밀 패턴과 조건이 하나씩 있어요. 조건은 한 동물이 다른 동물보다 많아야 한다는 것이에요. 패턴의 첫 동물은 모두에게 공개돼요.",
	"Bid coins on pack A or B. The pack with the lower total bid wins; its highest bidder arranges its four animals into the next empty board spaces.":
		"꾸러미 A나 B에 코인을 입찰하세요. 입찰 합계가 낮은 꾸러미가 이기고, 그 꾸러미에 가장 많이 입찰한 마법사가 동물 4마리를 판의 다음 빈칸에 차례로 놓아요.",
	"Both packs need a bidder to compete. Equal totals alternate A/B by round; tied top bidders use rotating seat priority. All bids are spent.":
		"두 꾸러미 모두 입찰자가 있어야 경쟁이 돼요. 합계가 같으면 라운드마다 A와 B가 번갈아 이기고, 최고 입찰자가 동점이면 라운드마다 돌아가는 자리 우선순위로 정해요. 입찰한 코인은 모두 사라져요.",
	"Every matching run of three, forward or backward along a row, column or diagonal, scores 1. Your condition doubles that score.":
		"가로, 세로, 대각선으로 패턴과 맞는 3칸 줄이 있으면, 정방향이든 역방향이든 줄마다 1점이에요. 조건을 채우면 점수가 2배가 돼요.",
	"This edition keeps the 5 × 5 grid and 30-coin budget, starts with a center animal, and uses six auctions. It simplifies the show’s card-drawing and tie procedures.":
		"이 에디션은 5 × 5 판과 코인 30개 예산을 그대로 쓰고, 가운데 칸에 동물 한 마리를 놓고 시작해 경매를 6번 해요. 방송의 카드 뽑기와 동점 처리 절차는 단순하게 줄였어요.",
	"Keeps secret patterns, lower-total pack auctions and placement order; six rounds with a seeded center and explicit house tie rules.":
		"비밀 패턴, 합계가 낮은 꾸러미가 이기는 경매, 놓는 순서 정하기는 그대로예요. 6라운드이고 가운데 칸을 미리 채우며, 동점은 명시된 하우스 룰로 정해요.",

	// zoo: animals and table text.
	Snake: "뱀",
	Lion: "사자",
	Parrot: "앵무새",
	Monkey: "원숭이",
	Elephant: "코끼리",
	"{#n}. Snake": "{n}. 뱀",
	"{#n}. Lion": "{n}. 사자",
	"{#n}. Parrot": "{n}. 앵무새",
	"{#n}. Monkey": "{n}. 원숭이",
	"{#n}. Elephant": "{n}. 코끼리",
	Auction: "경매",
	Pack: "꾸러미",
	"Pack {box}": "꾸러미 {box}",
	"Pack {box}: {list}.": "꾸러미 {box}: {list}.",
	"Arrange the pack": "꾸러미 배치",
	"Bid for a pack": "꾸러미 입찰",
	"Choose the order for the winning pack.": "이긴 꾸러미를 놓을 순서를 정하세요.",
	"The lower-total pack wins. Its highest bidder places it.":
		"입찰 합계가 낮은 꾸러미가 이겨요. 그 꾸러미의 최고 입찰자가 동물을 놓아요.",
	"Pattern points": "패턴 점수",
	"Your secret pattern": "내 비밀 패턴",
	"Double points when the first outnumbers the second": "첫째 동물이 둘째보다 많으면 점수 2배",
	"Your coins": "내 코인",
	"{#n} available": "사용 가능 {n}",
	"Your pattern: {list}.": "내 패턴: {list}.",
	"Double points if {more} outnumber {fewer}.": "점수 2배 조건: {more} 수가 {fewer} 수보다 많을 것.",
	"Coins: {list}.": "코인: {list}.",
	"Mage {#n}: {animal} first.": "마법사 {n}: 첫 동물 {animal}.",
	"Mage {#n}: {animal} first, bid sealed.": "마법사 {n}: 첫 동물 {animal}, 입찰 봉인함.",
	"{box}: bid {#n}": "{box}: {n} 입찰",
	"Place in shown order": "보이는 순서대로 놓기",
	"Choose a pack and bid": "꾸러미와 입찰액을 고르세요",
	"Seal bid": "입찰 봉인하기",
	"Choose all four animals in placement order": "동물 4마리를 놓을 순서대로 모두 고르세요",
	"Place animals": "동물 놓기",
	"Mage {#n} placed {list}.": "마법사 {n}의 배치: {list}.",
	"Round {#round}: A {#a}, B {#b}. Mage {#n} arranges pack {box}.":
		"{round}라운드: A {a}, B {b}. 마법사 {n}: 꾸러미 {box} 배치.",
	"Arrange the winning pack.": "이긴 꾸러미를 배치하세요.",
	"Bid on pack A or B.": "꾸러미 A나 B에 입찰하세요.",
	"Your bid is already sealed.": "입찰을 이미 봉인했어요.",
	"Enter a pack and bid, such as A:3.": "꾸러미와 입찰액을 A:3처럼 입력하세요.",

	// dice-poker: rules and edition note.
	"House rules: Dice Poker was announced for the Season 1 final but never played, so the show’s exact rules are unavailable.":
		"하우스 룰: 주사위 포커는 시즌 1 결승 게임으로 예고됐지만 실제로 진행되지 않아, 방송의 정확한 규칙은 알 수 없어요.",
	"Each mage rolls five six-sided dice and may reroll any chosen dice up to two times. Hold when ready; everyone reveals together.":
		"마법사마다 6면 주사위 5개를 굴리고, 고른 주사위를 두 번까지 다시 굴릴 수 있어요. 준비되면 패를 확정하세요. 모두 함께 공개해요.",
	"Hands rank: five of a kind, four of a kind, full house, straight, three of a kind, two pairs, pair, high dice. Higher grouped faces break ties; a 2–6 straight beats 1–5.":
		"패 순위: 파이브 카드, 포 카드, 풀 하우스, 스트레이트, 트리플, 투 페어, 원 페어, 하이 다이스. 같은 패끼리는 묶인 눈이 높은 쪽이 이기고, 2–6 스트레이트가 1–5를 이겨요.",
	"The best hand earns 1 point; tied best hands each score. Most points after five rounds wins. This edition has no betting.":
		"가장 좋은 패가 1점을 얻고, 동점이면 모두 1점씩 받아요. 5라운드 뒤 점수가 가장 높은 마법사가 이겨요. 이 에디션에는 베팅이 없어요.",
	"HOUSE RULES. Announced but never played on screen. Standard five-dice poker with two rerolls, five rounds and no betting; official show rules are unknown.":
		"하우스 룰. 예고만 되고 방송에서는 진행되지 않았어요. 주사위 5개, 다시 굴리기 2번, 5라운드, 베팅 없는 표준 주사위 포커예요. 방송의 공식 규칙은 알려지지 않았어요.",

	// dice-poker: table text.
	"Roll and keep": "굴리고 남기기",
	"Keep matching faces or chase a straight.": "같은 눈을 남기거나 스트레이트를 노려 보세요.",
	"Unplayed show final: this is a standard dice-poker house variant.":
		"방송에서 진행되지 않은 결승 게임이라, 표준 주사위 포커를 하우스 룰로 옮겼어요.",
	"Your rerolls: {#n}.": "남은 다시 굴리기: {n}번.",
	"Mage {#n}: held.": "마법사 {n}: 패 확정.",
	"Mage {#n}: rolling.": "마법사 {n}: 굴리는 중.",
	"+1 point": "+1점",
	"Hold hand": "패 확정하기",
	"Choose dice to reroll": "다시 굴릴 주사위를 고르세요",
	"Reroll selected dice": "고른 주사위 다시 굴리기",
	"Die {#n}: {#face}": "주사위 {n}: {face}",
	"Round {#round}: {hands}.": "{round}라운드: {hands}.",
	// Five number holes, not one open hole: an open one would swallow the next mage's hand too.
	"mage {#n} [{#a},{#b},{#c},{#d},{#e}]": "마법사 {n} [{a},{b},{c},{d},{e}]",
	"mage {#n} [{#a},{#b},{#c},{#d},{#e}] +1": "마법사 {n} [{a},{b},{c},{d},{e}] +1",
	"Your hand is already held.": "패를 이미 확정했어요.",
	"Both rerolls have been used. Hold your hand.": "다시 굴리기를 두 번 다 썼어요. 패를 확정하세요.",
	"Reroll dice or hold your hand.": "주사위를 다시 굴리거나 패를 확정하세요.",
}
