import type { Dictionary } from "../engineText"

/** The eleven games with hand-written boards: what their engines say, then what their boards say. */
export const classics: Dictionary = {
	// Shared by several of these games. "It is not your turn.", "Wait for your turn." and
	// "There is no such seat." live in chrome.ts.
	"The game is over.": "게임이 끝났어요.",
	"This is a solo puzzle.": "혼자 하는 퍼즐이에요.",
	"Mage {#n}: {#k}": "마법사 {n}: {k}",
	"Round {#n} of {#total}": "{n}/{total}라운드",
	"{#a} of {#b}": "{a}/{b}",
	"Row {#n}": "{n}행",
	"column {#n}": "{n}열",
	"Card {#n}": "카드 {n}",
	"Score: {#n}": "점수: {n}",
	Scores: "점수",
	Undo: "되돌리기",
	Back: "뒤로",
	empty: "비어 있음",

	// Nine Men's Morris
	"A two-player adaptation of the board game featured in The Devil’s Plan. Each mage begins with 9 stones.":
		"데블스 플랜에 나온 보드게임을 2인용으로 옮겼어요. 마법사마다 돌 9개로 시작해요.",
	"Take turns placing a stone on an empty point. A line of 3 connected stones is a mill: remove one rival stone.":
		"번갈아 빈 점에 돌을 하나씩 놓아요. 이어진 돌 3개가 한 줄을 이루면 밀이에요. 밀을 만들면 상대 돌 하나를 떼어 내요.",
	"Stones in a mill are protected unless every rival stone belongs to a mill. One new mill grants one capture, even when two lines form at once.":
		"밀에 속한 돌은 보호돼요. 상대 돌이 전부 밀에 속해 있을 때만 뗄 수 있어요. 한 번에 두 줄이 생겨도 떼어 내는 돌은 하나예요.",
	"After placing your 9 stones, move a stone along a line to a neighbouring empty point. With only 3 stones, you may fly to any empty point.":
		"돌 9개를 다 놓으면 돌 하나를 선을 따라 이웃한 빈 점으로 옮겨요. 돌이 3개만 남으면 어느 빈 점으로든 날아갈 수 있어요.",
	"A mage loses when they have placed all stones and have fewer than 3 left, or cannot move.":
		"돌을 다 놓은 뒤 3개 미만으로 남거나, 움직일 수 없게 된 마법사가 져요.",
	"This version draws after the same position occurs 3 times or after 80 turns without a capture or placement. It has no show tournament or clock.":
		"이 버전은 같은 배치가 3번 나오거나, 돌을 떼거나 놓는 일 없이 80턴이 지나면 비겨요. 방송의 토너먼트와 제한 시간은 없어요.",
	"One classic duel, including flying at 3 stones and repetition draws.":
		"정통 1대1 대결. 돌 3개일 때의 날기와 반복 무승부 포함.",
	"The game is over. Start another game.": "게임이 끝났어요. 새 게임을 시작하세요.",
	"Choose an exposed rival stone, or a stone in a mill if none are exposed.":
		"밀 밖에 있는 상대 돌을 고르세요. 그런 돌이 없으면 밀 안의 돌을 고르세요.",
	"Choose a legal empty point for this phase.": "이 단계에서 둘 수 있는 빈 점을 고르세요.",
	"Mage {#n} captured the stone at point {#p}.": "마법사 {n}: {p}번 점의 돌을 떼어 냄.",
	"Mage {#n} placed a stone at point {#p}.": "마법사 {n}: {p}번 점에 돌을 놓음.",
	"Mage {#n} moved from point {#a} to {#b}.": "마법사 {n}: 돌 이동, {a}번 → {b}번 점.",
	"Mage {#n} formed a mill and may capture.": "마법사 {n}: 밀 완성, 돌 하나를 뗄 수 있어요.",
	"Capture a rival stone": "상대 돌 떼어 내기",
	"Place a stone": "돌 놓기",
	"Fly to any empty point": "아무 빈 점으로 날기",
	"Slide along a line": "선을 따라 옮기기",
	"Circle closed": "대결이 끝났어요",
	"{#a} to place, {#b} on board": "놓을 돌 {a}개, 판 위 {b}개",
	"all placed": "모두 놓음",
	"Nine Men's Morris board": "나인 멘스 모리스 판",
	"Point {#n}, empty": "{n}번 점, 비어 있음",
	"Point {#n}, your stone": "{n}번 점, 내 돌",
	"Point {#n}, {name}’s stone": "{n}번 점, {name}의 돌",
	"Choose a marked destination, or select another stone.": "표시된 도착점을 고르거나 다른 돌을 선택하세요.",
	"A mill grants one capture. Protected stones stay unless all are protected.":
		"밀 하나로 돌 하나를 떼어 내요. 보호된 돌은 모든 돌이 보호된 경우에만 뗄 수 있어요.",
	"Three stones on a connected line form a mill.": "이어진 한 줄에 돌 3개를 놓으면 밀이에요.",

	// Hexagon
	"A solo adaptation of the memory game from The Devil’s Plan. Study the 19 numbers, then hide them when ready. The pace clocks do not enforce a deadline.":
		"데블스 플랜의 기억력 게임을 1인용으로 옮겼어요. 숫자 19개를 외운 뒤 준비되면 숨기세요. 속도 시계가 0이 되어도 게임은 끝나지 않아요.",
	"Select 3 neighbouring hexes in a straight line whose hidden numbers add to the target. Order does not matter.":
		"숨겨진 숫자의 합이 목표와 같아지도록, 일직선으로 이웃한 육각 칸 3개를 고르세요. 순서는 상관없어요.",
	"Find every matching line. A new correct line earns 1 point. A wrong or repeated line costs 1 point and 1 of your 3 chances.":
		"조건에 맞는 줄을 모두 찾으세요. 새로 맞힌 줄은 1점이에요. 틀리거나 이미 찾은 줄을 고르면 1점과 기회 3번 중 1번을 잃어요.",
	"Find all the lines before your third mistake to solve the puzzle. The numbers return when the puzzle ends.":
		"세 번째 실수 전에 모든 줄을 찾으면 퍼즐을 풀어요. 퍼즐이 끝나면 숫자가 다시 나타나요.",
	"Solo recall puzzle with a manual study phase, contiguous straight triples, and 3 mistakes allowed.":
		"1인용 기억 퍼즐. 암기 단계는 직접 끝내고, 일직선으로 이어진 세 칸을 찾으며, 실수는 3번까지 허용.",
	"The puzzle is over. Start another to play again.": "퍼즐이 끝났어요. 다시 하려면 새 퍼즐을 시작하세요.",
	"The numbers are already hidden.": "숫자는 이미 숨겨져 있어요.",
	"Hide the numbers before tracing a sum.": "합을 잇기 전에 숫자를 먼저 숨기세요.",
	"The numbers were hidden. The recall phase began.": "숫자를 숨겼어요. 기억 단계가 시작됐어요.",
	"Traced {cells}: {score} point.": "{cells} 이음: {score}점.",
	"Numbers revealed: {numbers}.": "숫자 공개: {numbers}.",
	"Commit the numbers to memory": "숫자를 외우세요",
	"Trace a sum of {#n}": "합 {n} 잇기",
	"The target appears once you hide the numbers.": "숫자를 숨기면 목표가 나타나요.",
	"{#n} lines left": "남은 줄 {n}개",
	"{#n} chances left": "남은 기회 {n}번",
	"Memory hexagon": "기억의 육각판",
	"Hide numbers": "숫자 숨기기",
	"You already traced this line. Choose another.": "이미 이은 줄이에요. 다른 줄을 고르세요.",
	"{#n} of 3 chosen": "3개 중 {n}개 선택",
	"Choose the first hex. The next choices will follow a straight line.":
		"첫 육각 칸을 고르세요. 다음 칸은 일직선으로 이어져요.",
	"Undo hex": "칸 되돌리기",
	"Trace sum": "합 잇기",

	// Equation Hi-Lo
	"A five-round adaptation of The Devil’s Plan. This version has no wagers or special operator cards.":
		"데블스 플랜의 게임을 5라운드로 옮겼어요. 이 버전에는 베팅과 특수 연산자 카드가 없어요.",
	"You receive four number cards from 0 to 10. Every hand includes a nonzero card.":
		"0부터 10까지의 숫자 카드 4장을 받아요. 0이 아닌 카드가 반드시 한 장은 들어 있어요.",
	"Arrange all four cards once, with +, − and ÷ each used once. Division happens first; division by zero is forbidden.":
		"카드 4장을 모두 한 번씩 배열하고 +, −, ÷를 한 번씩 써요. 나눗셈을 먼저 계산하고, 0으로는 나눌 수 없어요.",
	"Choose low (closest to 1) or high (closest to 20), then seal your equation. Other mages cannot see it yet.":
		"로우(1에 가장 가깝게)나 하이(20에 가장 가깝게)를 고른 뒤 등식을 봉인하세요. 다른 마법사는 아직 볼 수 없어요.",
	"Everyone reveals together. The closest equation in each lane earns 1 point. Tied mages each earn 1 point.":
		"모두 동시에 공개해요. 목표마다 가장 가까운 등식이 1점을 얻어요. 동률이면 각자 1점을 얻어요.",
	"Most points after five rounds wins. Equal scores across the whole table are a draw.":
		"5라운드 뒤 점수가 가장 높은 마법사가 이겨요. 모두 점수가 같으면 비겨요.",
	"Five simultaneous rounds. Uses +, − and ÷; no wagering or special operators.":
		"동시에 진행하는 5라운드. +, −, ÷ 사용. 베팅과 특수 연산자 없음.",
	"The fifth round has ended.": "5라운드가 끝났어요.",
	"Your equation is already sealed.": "등식은 이미 봉인됐어요.",
	"Division by zero is forbidden. Move a nonzero card after ÷.":
		"0으로는 나눌 수 없어요. ÷ 뒤에 0이 아닌 카드를 놓으세요.",
	"Mage {#n} sealed an equation.": "마법사 {n}: 등식 봉인.",
	"Round {#r} · Mage {#n}: {sum}, target {#t}, {gain} point.": "{r}라운드 · 마법사 {n}: {sum}, 목표 {t}, {gain}점.",
	"Sealed for {#n}. Waiting for the other mages.": "목표 {n}, 봉인 완료. 다른 마법사를 기다리고 있어요.",
	"Division by zero. Change the cards or operators so a nonzero card follows ÷.":
		"0으로 나누고 있어요. ÷ 뒤에 0이 아닌 카드가 오도록 카드나 연산자를 바꾸세요.",
	"Use each card and operator once. Division happens first.":
		"카드와 연산자를 각각 한 번씩 쓰세요. 나눗셈을 먼저 계산해요.",
	"Equation steps": "등식 단계",
	"1. Number cards": "1. 숫자 카드",
	"2. Operators": "2. 연산자",
	"3. Target": "3. 목표",
	"Choose number card {#n} of 4": "숫자 카드 고르기 (4장 중 {n}번째)",
	"Add number {#n}, card {#c}": "숫자 {n} 추가, 카드 {c}",
	"Undo card": "카드 되돌리기",
	"Choose operators": "연산자 고르기",
	"Choose operator {#n} of 3": "연산자 고르기 (3개 중 {n}번째)",
	addition: "덧셈",
	subtraction: "뺄셈",
	division: "나눗셈",
	"Undo operator": "연산자 되돌리기",
	"Choose target": "목표 고르기",
	"Choose your target": "목표를 고르세요",
	"Aim for {#n}": "목표 {n}",
	"{#n} away": "{n} 차이",
	"Seal equation": "등식 봉인",
	"Clear spell": "주문 지우기",
	"Closest to 1 or 20": "1이나 20에 가장 가깝게",
	"Final score": "최종 점수",
	Composing: "작성 중",
	"Round history": "라운드 기록",
	"Revealed rounds": "공개된 라운드",
	"target {#n}": "목표 {n}",

	// Knight's Tour
	"Tap any square to place the knight.": "아무 칸이나 눌러 나이트를 놓으세요.",
	"It moves like a chess knight: two squares one way, one square sideways.":
		"체스의 나이트처럼 움직여요. 한 방향으로 두 칸, 옆으로 한 칸.",
	"A square can be visited only once.": "한 칸은 한 번만 지날 수 있어요.",
	"Visit all {#n} squares to finish the tour. Undo as often as you need.":
		"{n}칸을 모두 지나면 여행 완성이에요. 되돌리기는 몇 번이든 쓸 수 있어요.",
	"A 6×6 solo board with undo. The show also used larger boards and a timer.":
		"되돌리기가 있는 6×6 1인용 판. 방송에서는 더 큰 판과 타이머도 썼어요.",
	"The tour is complete.": "여행이 끝났어요.",
	"There is nothing to undo.": "되돌릴 수가 없어요.",
	"The knight cannot reach that square.": "나이트가 갈 수 없는 칸이에요.",
	"step {#n}": "{n}번째 걸음",
	"Tap any square to set the knight down.": "아무 칸이나 눌러 나이트를 내려놓으세요.",
	"Dead end. Undo a step or two.": "막다른 길이에요. 한두 걸음 되돌리세요.",
	"Move two squares one way, then one sideways. Glowing squares are reachable.":
		"한 방향으로 두 칸, 옆으로 한 칸 움직여요. 빛나는 칸으로 갈 수 있어요.",

	// Rune Drop
	"Take turns dropping one orb into any column that has room.": "번갈아 빈자리가 있는 열에 구슬을 하나씩 떨어뜨려요.",
	"An orb falls to the lowest empty hole.": "구슬은 가장 아래 빈 구멍까지 떨어져요.",
	"Line up four of your orbs across, down or diagonally to win.":
		"내 구슬 4개를 가로, 세로, 대각선 중 한 줄로 이으면 이겨요.",
	"A full slab with no line is a draw.": "줄이 없는 채로 석판이 가득 차면 비겨요.",
	"That column is full.": "그 열은 가득 찼어요.",
	"Dropped an orb in column {#c}, row {#r}.": "{c}열 {r}행에 구슬을 떨어뜨렸어요.",
	"Drop an orb in column {#n}": "{n}열에 구슬 떨어뜨리기",
	"Choose a column to preview your orb.": "열을 고르면 구슬이 놓일 자리를 미리 볼 수 있어요.",
	"Column {#n} selected.": "{n}열 선택됨.",
	"Drop orb": "구슬 떨어뜨리기",

	// Turncoat
	"Place a disc so that a straight run of rival discs sits between it and another of yours.":
		"새로 놓는 돌과 내 다른 돌 사이에 상대 돌이 일직선으로 끼이도록 돌을 놓으세요.",
	"Every trapped disc flips to your colour.": "사이에 낀 돌은 모두 내 색으로 뒤집혀요.",
	"If you have no such move your turn is skipped.": "그렇게 둘 곳이 없으면 턴을 건너뛰어요.",
	"When nobody can move, the side with more discs wins.": "아무도 둘 수 없게 되면 돌이 더 많은 쪽이 이겨요.",
	"That disc would not trap anything.": "그 자리에서는 아무 돌도 가둘 수 없어요.",
	"Placed a disc at row {#r}, column {#c}; turned {#n} rival discs.":
		"{r}행 {c}열에 돌을 놓아 상대 돌 {n}개를 뒤집었어요.",
	"The rival has no legal move; this mage plays again.": "상대가 둘 곳이 없어 이 마법사가 한 번 더 둬요.",
	yours: "내 돌",
	rival: "상대 돌",
	"Choose a square to preview the flips.": "칸을 고르면 뒤집힐 돌을 미리 볼 수 있어요.",
	"{#n} disc will turn.": "돌 {n}개가 뒤집혀요.",
	"{#n} discs will turn.": "돌 {n}개가 뒤집혀요.",
	"Place disc": "돌 놓기",

	// Mind Auction
	"Every mage holds cards 1 to {#n}. Prize cards 1 to {#m} come up in random order.":
		"마법사마다 1부터 {n}까지의 카드를 들고 있어요. 1부터 {m}까지의 상품 카드가 무작위 순서로 나와요.",
	"Each round everyone picks a card in secret. The single highest card takes the prize as points.":
		"라운드마다 모두 몰래 카드 한 장을 골라요. 혼자 가장 높은 카드를 낸 마법사가 상품을 점수로 가져가요.",
	"A played card is gone for good.": "한 번 낸 카드는 다시 쓸 수 없어요.",
	"If the highest cards tie, nobody scores and the prize rolls into the next round.":
		"가장 높은 카드가 겹치면 아무도 점수를 얻지 못하고 상품은 다음 라운드로 넘어가요.",
	"Most points after the last prize wins.": "마지막 상품까지 끝난 뒤 점수가 가장 높은 마법사가 이겨요.",
	"The auction is over.": "경매가 끝났어요.",
	"You no longer hold that card.": "그 카드는 이미 썼어요.",
	"Sealed a bid.": "입찰을 봉인했어요.",
	"Bids revealed: {bids}.": "입찰 공개: {bids}.",
	"The highest bids tied; {#p} points rolled over.": "최고 입찰이 겹쳐 {p}점이 다음 라운드로 넘어갔어요.",
	"Mage {#n} won {#p} points.": "마법사 {n}: {p}점 획득.",
	"The top bids tied. {#p} points roll over.": "최고 입찰이 겹쳤어요. {p}점이 다음 라운드로 넘어가요.",
	"{name} took {#p} with a {#b}.": "{name}: 카드 {b}, {p}점 획득.",
	"Cards {name} still holds": "{name}: 남은 카드",
	"Prize: {#n} points": "상품: {n}점",
	"Last prize": "지난 상품",
	"No prizes left": "남은 상품 없음",
	"{#a} prize + {#b} rolled over": "상품 {a} + 이월 {b}",
	"Prize, {#n} left": "상품, {n}개 남음",
	"{name} has bid": "{name}: 입찰 완료",
	"Lift a card, then seal it. Nobody sees it until everyone has bid.":
		"카드를 들어 올린 뒤 봉인하세요. 모두 입찰하기 전에는 아무도 볼 수 없어요.",
	"Your {#n} is sealed. Waiting for the other bids.": "{n} 봉인 완료. 다른 입찰을 기다리고 있어요.",
	"Lift a card to bid": "입찰할 카드를 들어 올리세요",
	"Seal the {#n}": "{n} 봉인",

	// Liar's Bones
	"Each mage rolls {#n} bones and keeps them hidden.": "마법사마다 주사위 {n}개를 굴려 숨겨 둬요.",
	"On your turn, bid how many bones of one face lie on the whole table, yours and everyone else's.":
		"내 턴에는 내 것과 남의 것을 합쳐, 테이블 전체에 어떤 눈의 주사위가 몇 개 있는지 입찰해요.",
	"Each bid must be higher: more bones, or the same number with a higher face.":
		"입찰은 앞선 것보다 높아야 해요. 개수를 늘리거나, 같은 개수에 더 높은 눈을 부르세요.",
	"Or call the last bid a lie. All bones are shown.":
		"아니면 마지막 입찰을 거짓이라고 선언하세요. 모든 주사위가 공개돼요.",
	"If the bid holds, the caller loses a bone. If not, the bidder does. Everyone rerolls.":
		"입찰이 맞으면 선언한 쪽이, 틀리면 입찰한 쪽이 주사위 하나를 잃어요. 그런 다음 모두 다시 굴려요.",
	"The last mage with a bone wins.": "마지막까지 주사위가 남은 마법사가 이겨요.",
	"There are not that many bones on the table.": "테이블에 주사위가 그만큼 없어요.",
	"A bid must beat the one before it.": "앞선 입찰보다 높게 불러야 해요.",
	"There is no bid to call yet.": "아직 거짓이라고 선언할 입찰이 없어요.",
	"Bid {#c} bones showing {#f}.": "입찰: 눈 {f} 주사위 {c}개.",
	"Called Mage {#n}'s bid of {#c} bones showing {#f}.": "거짓 선언: 마법사 {n}의 입찰, 눈 {f} 주사위 {c}개.",
	"Revealed bones: {bones}.": "공개된 주사위: {bones}.",
	"Mage {#n}: out": "마법사 {n}: 탈락",
	"The table held {#a} matching bones; Mage {#n} lost a bone.":
		"테이블에 맞는 주사위는 {a}개. 마법사 {n}: 주사위 하나를 잃음.",
	"Raise the claim or challenge it.": "입찰을 올리거나 거짓인지 의심하세요.",
	"Raise bid": "입찰 올리기",
	"Challenge bid": "입찰 의심하기",
	"How many bones": "주사위 개수",
	"Fewer bones": "주사위 줄이기",
	"Bones in your bid": "입찰할 주사위 개수",
	"More bones": "주사위 늘리기",
	"Choose face": "눈 고르기",
	"Showing which face": "주사위 눈",
	"Face in your bid": "입찰할 눈",
	"Raise the count, or keep it and choose a higher face.": "개수를 올리거나, 그대로 두고 더 높은 눈을 고르세요.",
	"Review bid": "입찰 확인",
	Bid: "입찰",
	"Place bid": "입찰하기",
	Challenge: "의심",
	"All bones will be revealed. The wrong mage loses one bone.":
		"모든 주사위가 공개돼요. 틀린 마법사가 주사위 하나를 잃어요.",
	"Call the lie": "거짓 선언",
	Out: "탈락",
	// Two halves of one line: "<caller> called the bid of 3 × <die> by <bidder>."
	"called the bid of": "거짓 선언:",
	by: "· 입찰자",
	"The table held {#n}. Bone lost:": "테이블에는 {n}개. 주사위를 잃은 쪽:",
	"{#c} bones showing {#f}": "눈 {f} 주사위 {c}개",
	"No bid yet. {name} to open.": "아직 입찰이 없어요. 첫 입찰: {name}.",
	"{#n} bones on the table.": "테이블 위 주사위 {n}개.",
	"Hidden bone": "가려진 주사위",
	"Bone showing {#n}": "눈 {n} 주사위",

	// Lone Spark
	"Each round every mage secretly picks a spark from 1 to {#n}.":
		"라운드마다 모든 마법사가 1부터 {n}까지의 불꽃 중 하나를 몰래 골라요.",
	"Sparks picked by more than one mage fizzle.": "둘 이상이 고른 불꽃은 꺼져요.",
	"The lowest spark left standing wins the round and scores its own number.":
		"남은 불꽃 중 가장 낮은 것이 라운드를 이기고 그 숫자만큼 점수를 얻어요.",
	"So a 1 wins most often but pays least. If every spark fizzles, nobody scores.":
		"그래서 1은 가장 자주 이기지만 점수는 가장 적어요. 불꽃이 모두 꺼지면 아무도 점수를 얻지 못해요.",
	"Most points after {#n} rounds wins.": "{n}라운드 뒤 점수가 가장 높은 마법사가 이겨요.",
	"Your pick is already sealed.": "선택은 이미 봉인됐어요.",
	"Locked a spark.": "불꽃을 확정했어요.",
	"Sparks revealed: {sparks}.": "불꽃 공개: {sparks}.",
	"Every spark fizzled; nobody scored.": "불꽃이 모두 꺼져 아무도 점수를 얻지 못했어요.",
	"Mage {#n} held the lowest lone spark and scored {#p} points.":
		"마법사 {n}: 홀로 남은 가장 낮은 불꽃으로 {p}점 획득.",
	"Every spark fizzled. Nobody scores.": "불꽃이 모두 꺼졌어요. 아무도 점수를 얻지 못해요.",
	"{name} held the lone {#n} and scored it.": "{name}: 홀로 남은 불꽃 {n}, {n}점 획득.",
	"{name} has picked": "{name}: 선택 완료",
	"Lift a spark, then lock it in. The lowest one nobody else picked scores.":
		"불꽃을 들어 올린 뒤 확정하세요. 아무와도 겹치지 않은 가장 낮은 불꽃이 점수를 얻어요.",
	"Spark {#n}": "불꽃 {n}",
	"Your {#n} is locked. Waiting for the other sparks.": "{n} 확정. 다른 불꽃을 기다리고 있어요.",
	"Lift a spark to pick": "고를 불꽃을 들어 올리세요",
	"Lock in the {#n}": "{n} 확정",
	"Past rounds": "지난 라운드",

	// Last Candle
	"On your turn pick one row and snuff as many of its candles as you like, at least one.":
		"내 턴에 한 줄을 골라 그 줄의 촛불을 원하는 만큼 꺼요. 적어도 하나는 꺼야 해요.",
	"Tap a candle to snuff it and every candle to its right.": "촛불을 누르면 그 촛불과 오른쪽의 촛불이 모두 꺼져요.",
	"Whoever snuffs the very last candle wins.": "마지막 촛불을 끄는 쪽이 이겨요.",
	"There is no such row.": "그런 줄은 없어요.",
	"That row does not have that many candles left.": "그 줄에는 촛불이 그만큼 남아 있지 않아요.",
	"Snuffed {#n} candles in row {#r}; {#left} remain in that row.":
		"{r}번 줄에서 촛불 {n}개를 껐어요. 그 줄에 {left}개 남았어요.",
	"Row {#r}: snuff {#n}": "{r}번 줄: {n}개 끄기",
	"Row {#r}: snuffed candle": "{r}번 줄: 꺼진 촛불",
	"Snuff {#n} in row {#r}.": "{r}번 줄에서 {n}개를 꺼요.",
	"Choose a candle to mark it and every lit one to its right.":
		"촛불을 고르면 그 촛불과 오른쪽의 켜진 촛불이 모두 표시돼요.",
	"Snuff candles": "촛불 끄기",

	// Rune Cipher
	"The seal hides {#s} runes drawn from {#k} kinds. A rune can repeat.":
		"봉인에는 {k}종류 중에서 뽑은 룬 {s}개가 숨어 있어요. 같은 룬이 여러 번 나올 수 있어요.",
	"Cast a guess. A gold pip means a rune is right and in the right slot.":
		"추측을 시전하세요. 금색 점은 룬과 자리가 모두 맞았다는 뜻이에요.",
	"A pale pip means a rune is in the code but in a different slot.":
		"옅은 점은 룬이 암호에 있지만 자리가 다르다는 뜻이에요.",
	"Find the full code within {#n} casts.": "시전 {n}번 안에 암호 전체를 찾으세요.",
	"The cipher is settled.": "암호 풀이가 끝났어요.",
	"Cast {#n}: {#e} runes in the right place, {#m} in a different place.":
		"{n}번째 시전: 제자리 룬 {e}개, 다른 자리 {m}개.",
	"The seal holds {#n} runes": "봉인 속 룬 {n}개",
	"Filled mark: right rune and place. Hollow mark: right rune, different place.":
		"채워진 표시: 룬과 자리 모두 맞음. 빈 표시: 룬은 맞고 자리가 다름.",
	"Edit rune {#n}": "{n}번 룬 바꾸기",
	"{#n} in place": "제자리 {n}개",
	"{#n} misplaced": "다른 자리 {n}개",
	"Choose runes in order. Tap a filled slot to change it.": "룬을 순서대로 고르세요. 채운 칸을 누르면 바꿀 수 있어요.",
	"Choose a replacement for slot {#n}.": "{n}번 칸에 넣을 룬을 고르세요.",
	// "Add {label}" is in chrome.ts.
	"Set {rune}": "{rune} 넣기",
	"Remove last rune": "마지막 룬 지우기",
	Cast: "시전",
	Thorn: "가시",
	Gift: "선물",
	Arrow: "화살",
	Need: "결핍",
	Seed: "씨앗",
	Elk: "엘크",
}
