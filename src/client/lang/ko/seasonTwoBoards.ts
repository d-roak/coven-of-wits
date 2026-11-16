import type { Dictionary } from "../engineText"

export const seasonTwoBoards: Dictionary = {
	// Shared by these boards: step prompts, square labels, round labels.
	"Choose an action": "행동을 고르세요",
	"Choose a square": "칸을 고르세요",
	"Choose a destination": "도착할 칸을 고르세요",
	"Square {#n}": "{n}번 칸",
	"Move to {#n}": "{n}번 칸으로 이동",
	"Your square: {#n}": "내 위치: {n}번 칸",
	Move: "이동",
	Cycle: "사이클",
	Turn: "턴",
	empty: "비어 있음",

	// Crooked Cops
	"Hidden pursuit": "숨은 추격",
	"Investigate {#n}": "{n}번 칸 조사",
	"Arrest at {#n}": "{n}번 칸에서 체포",
	Arrest: "체포",
	"Your role: {role}": "내 역할: {role}",
	Thief: "도둑",
	"Crooked warden": "부패한 경비",
	"Honest warden": "정직한 경비",
	"Relics stolen: {#n} / {#m}": "훔친 유물: {n} / {m}",
	"No investigation yet.": "아직 조사하지 않았어요.",
	"Fresh trail at {#n}.": "{n}번 칸에 방금 지나간 흔적이 있어요.",
	"No thief at {#n}.": "{n}번 칸에 도둑이 없어요.",
	"No crooked warden": "부패한 경비 없음",
	"Crooked ally: Mage {#n}": "부패한 동료: 마법사 {n}",
	"A relic vanished at {#n}.": "{n}번 칸에서 유물이 사라졌어요.",
	"The thief moved unseen.": "도둑이 몰래 움직였어요.",
	"Mage {#n} moved to {#a}.": "마법사 {n}: {a}번 칸으로 이동.",
	"Mage {#n} investigated privately.": "마법사 {n}: 비공개 조사.",
	"The thief was caught.": "도둑이 잡혔어요.",
	"Mage {#n} made an unsuccessful arrest.": "마법사 {n}: 체포 실패.",
	"{#n} Relic": "{n} 유물",
	"{#n} Relic {rest}": "{n} 유물 {rest}",
	"A compact pursuit adaptation on a 5×5 grove. Mage 1 is the thief; at tables of 4 or 5, one other mage is secretly crooked. Honest wardens win together.":
		"5×5 숲에서 벌이는 간단한 추격전이에요. 마법사 1이 도둑이고, 4~5인 테이블에서는 다른 마법사 한 명이 몰래 부패한 경비가 됩니다. 정직한 경비들은 함께 승리해요.",
	"The thief’s position is hidden and they collect relics by landing on marked squares. Steal 3 relics or evade capture for 12 table cycles to win.":
		"도둑의 위치는 숨겨져 있고, 표시된 칸에 들어가면 유물을 얻어요. 유물 3개를 훔치거나 테이블이 12바퀴 도는 동안 잡히지 않으면 도둑이 이깁니다.",
	"On your turn, move one square, investigate your square or a neighbour, or attempt an arrest there. Investigations are private. Honest arrest on the thief’s square wins immediately; a crooked arrest fails.":
		"내 턴에는 한 칸 이동하거나, 내 칸 또는 이웃 칸을 조사하거나, 그곳에서 체포를 시도하세요. 조사 결과는 나만 봅니다. 정직한 경비가 도둑이 있는 칸에서 체포하면 바로 승리하고, 부패한 경비의 체포는 실패해요.",
	"The thief knows the crooked warden. The crooked warden shares the thief’s win. This edition has one thief, one action per turn, a new map, and no accusation phase or team radio.":
		"도둑은 부패한 경비가 누구인지 알아요. 부패한 경비는 도둑과 함께 승리합니다. 이 에디션은 도둑 한 명, 턴당 행동 하나, 새 지도를 쓰며 고발 단계와 팀 무전이 없어요.",
	"3–5 mages, one thief, up to one crooked warden, a 5×5 map and one action per turn; no team radios or accusations.":
		"마법사 3–5명, 도둑 한 명, 부패한 경비 최대 한 명, 5×5 지도, 턴당 행동 하나. 팀 무전과 고발은 없어요.",

	// Halloween Monster
	"Choose an attack": "공격을 고르세요",
	"Mage {#n} acts": "마법사 {n} 차례",
	"Coven average": "모임 평균",
	"Individual points: {list}": "개인 점수: {list}",
	"Covens: mages 1–2 and 3–4 share their average; mage 5 plays alone.":
		"모임: 마법사 1–2와 3–4는 평균 점수를 나눠 가져요. 마법사 5는 혼자 플레이합니다.",
	Monsters: "몬스터",
	"Your weapons": "내 무기",
	dagger: "단검",
	grenade: "수류탄",
	poison: "독",
	"{weapon} against monster {#n}": "몬스터 {n}에 {weapon} 사용",
	"Choose a weapon": "무기를 고르세요",
	"Choose a monster": "몬스터를 고르세요",
	"Monster {#n} · {#h}/{#m}": "몬스터 {n} · {h}/{m}",
	"Monster {#n}: defeated": "몬스터 {n}: 처치됨",
	"Monster {#n}: {#h}/{#m} health": "몬스터 {n}: 체력 {h}/{m}",
	"Monster {#n}: {#h}/{#m} health · poison from Mage {#k}": "몬스터 {n}: 체력 {h}/{m} · 마법사 {k}의 독",
	"Mage {#n} used {weapon} on monster {#t}: {#h}/{#m} health.": "마법사 {n}: 몬스터 {t}에 {weapon} 사용, 체력 {h}/{m}.",
	"Mage {#n} used {weapon} on monster {#t}: {#h}/{#m} health; Mage {#k} gained {#p} points.":
		"마법사 {n}: 몬스터 {t}에 {weapon} 사용, 체력 {h}/{m}. 마법사 {k} +{p}점.",
	"Poison from Mage {#k} reduced monster {#t} to {#h}/{#m}.": "마법사 {k}의 독: 몬스터 {t} 체력 {h}/{m}.",
	"Poison from Mage {#k} reduced monster {#t} to {#h}/{#m}; Mage {#w} gained {#p} points.":
		"마법사 {k}의 독: 몬스터 {t} 체력 {h}/{m}. 마법사 {w} +{p}점.",
	"A compact combat adaptation with 5 monsters and fixed pairs: mages 1–2 and 3–4 are covens; an unpaired mage plays alone.":
		"몬스터 5마리와 고정된 짝으로 벌이는 간단한 전투예요. 마법사 1–2와 3–4가 각각 모임이고, 짝이 없는 마법사는 혼자 플레이합니다.",
	"Choose a living monster and weapon. Dagger deals 3 and is reusable; grenade deals 6 once; poison deals 1 now and 1 at the end of every table cycle. A newer poison replaces its owner.":
		"살아 있는 몬스터와 무기를 고르세요. 단검은 피해 3을 주고 계속 쓸 수 있어요. 수류탄은 피해 6을 주고 한 번만 씁니다. 독은 바로 피해 1을 주고, 테이블이 한 바퀴 돌 때마다 1씩 더 줘요. 새 독을 쓰면 독의 주인이 바뀝니다.",
	"The killing blow earns the monster’s starting health in points. Poison kills credit the poison’s owner. Covens share the average of their members’ points.":
		"마지막 일격을 가하면 몬스터의 처음 체력만큼 점수를 얻어요. 독으로 쓰러지면 독의 주인이 점수를 받습니다. 모임은 구성원 점수의 평균을 나눠 가져요.",
	"The highest coven average wins after every monster dies or 60 turns. This edition reveals health, auto-assigns alliances, and omits weapon trading, delayed explosives and player attacks.":
		"모든 몬스터가 쓰러지거나 60턴이 지나면 평균이 가장 높은 모임이 이겨요. 이 에디션은 체력을 공개하고 동맹을 자동으로 정하며, 무기 거래, 지연 폭발물, 플레이어 공격은 없습니다.",
	"Five monsters, three weapon types, visible health and fixed two-mage covens; no trading or player attacks.":
		"몬스터 다섯 마리, 무기 세 종류, 공개된 체력, 고정된 2인 모임. 거래와 플레이어 공격은 없어요.",

	// Treasure Island
	"Bid for arrows": "화살 입찰",
	"Explore the island": "섬 탐험",
	"Bid {#n} chips for arrows": "화살에 칩 {n}개 입찰",
	"Chips to spend for arrows": "화살에 쓸 칩",
	"End exploration": "탐험 끝내기",
	"Follow arrow to {#n}": "화살을 따라 {n}번 칸으로",
	"Follow arrow": "화살 따라가기",
	"Your chips: {#n}": "내 칩: {n}",
	"Your arrows: {#n}": "내 화살: {n}",
	"Your opened boxes: ": "내가 연 상자: 없음",
	"Your opened boxes: {list}": "내가 연 상자: {list}",
	"Box {#n}: treasure row {#r}.": "상자 {n}: 보물은 {r}번째 가로줄에 있어요.",
	"Box {#n}: treasure column {#c}.": "상자 {n}: 보물은 {c}번째 세로줄에 있어요.",
	"Your supplies": "내 물자",
	"{#n} arrows": "화살 {n}개",
	"{#n} Rock": "{n} 바위",
	"{#n} Box": "{n} 상자",
	"{#n} Box {rest}": "{n} 상자 {rest}",
	"Cycle {#n}: arrow awards {list}.": "{n}사이클 화살 배분: {list}.",
	"Mage {#n}: {#k}": "마법사 {n}: {k}",
	"Mage {#n} ended exploration.": "마법사 {n}: 탐험 종료.",
	"Mage {#n} followed an arrow to {#a}.": "마법사 {n}: 화살을 따라 {a}번 칸으로 이동.",
	"Mage {#n} opened box {#a}.": "마법사 {n}: {a}번 상자 개봉.",
	"The treasure was found.": "보물을 찾았어요.",
	"A 5×5 adaptation with 4 clue boxes and 4 auction/exploration cycles. Each mage has 20 auction chips; bids spend chips even when they lose.":
		"단서 상자 4개가 놓인 5×5 판에서 경매와 탐험을 4사이클 진행해요. 마법사마다 경매 칩 20개를 가지며, 입찰한 칩은 져도 사라집니다.",
	"The highest bidders receive 8 arrows each; everyone else receives 4. Spend one arrow per orthogonal step. Rock squares cannot be entered.":
		"가장 높게 입찰한 마법사는 화살 8개를, 나머지는 4개를 받아요. 가로나 세로로 한 칸 갈 때마다 화살 1개를 씁니다. 바위 칸에는 들어갈 수 없어요.",
	"Reaching a new box reveals a clue privately. Its first visitor gains 3 points, later visitors 1; revisiting your own box scores nothing.":
		"새 상자에 도착하면 나만 보는 단서가 열려요. 처음 도착한 마법사는 3점, 그 뒤에 온 마법사는 1점을 얻고, 이미 연 상자를 다시 찾으면 점수가 없습니다.",
	"The treasure box adds 10 points and ends the game. Otherwise most points after 4 explorations wins.":
		"보물 상자를 열면 10점을 더 얻고 게임이 끝나요. 아니면 탐험 4번을 마친 뒤 점수가 가장 높은 마법사가 이깁니다.",
	"This edition keeps routes between cycles and uses single-step arrows. It omits the show’s 3D placements, borrowing and piece purchases.":
		"이 에디션은 사이클이 바뀌어도 위치를 유지하고 한 칸짜리 화살을 써요. 방송의 3D 배치, 대출, 조각 구매는 없습니다.",
	"Four auction/exploration cycles on a 5×5 map with single-step arrows, four clue boxes and persistent routes.":
		"5×5 지도에서 경매와 탐험 4사이클. 한 칸짜리 화살, 단서 상자 4개, 사이클 사이에 유지되는 위치.",

	// Balance Mancala
	"Sow clockwise": "시계 방향으로 뿌리기",
	"Balance score": "균형 점수",
	"Sow pit {#p}; Mage {#n} scores {colour}": "{p}번 구덩이 뿌리기 · 마법사 {n} {colour} 득점",
	"Mage {#n} gained {#k} {colour} points.": "마법사 {n}: {colour} +{k}점.",
	"Mage {#n} colours": "마법사 {n} 색깔",
	"ember: {#n}": "불씨: {n}",
	"brook: {#n}": "시내: {n}",
	"moss: {#n}": "이끼: {n}",
	"Choose a pit": "구덩이를 고르세요",
	"Pit {#n}": "{n}번 구덩이",
	"Choose the last counter": "마지막에 놓을 말을 고르세요",
	"Choose the scoring colour": "점수를 받을 색깔을 고르세요",
	"{#n} Angel: {tokens}": "{n} 천사: {tokens}",
	"{#n} Devil: {tokens}": "{n} 악마: {tokens}",
	"{#n} ember: {tokens}": "{n} 불씨: {tokens}",
	"{#n} brook: {tokens}": "{n} 시내: {tokens}",
	"{#n} moss: {tokens}": "{n} 이끼: {tokens}",
	"A 2–5 mage adaptation with 14 pits: 4 each in 3 colours, an angel pit and a devil pit. Each mage has 4 counters placed automatically.":
		"마법사 2–5명이 구덩이 14개로 플레이해요. 세 가지 색깔 구덩이가 4개씩, 천사 구덩이와 악마 구덩이가 하나씩 있습니다. 마법사마다 말 4개가 자동으로 놓여요.",
	"Choose a pit containing your counter. Pick which owner’s counter lands last; all other counters are sown in their current order, one per pit clockwise.":
		"내 말이 들어 있는 구덩이를 고르세요. 누구의 말을 마지막에 놓을지 정하면, 나머지 말은 지금 순서대로 시계 방향으로 구덩이마다 하나씩 뿌려집니다.",
	"The last counter’s owner gains points equal to the destination’s counter count. Coloured pits score their colour; angel scores their lowest colour, devil their highest. The mover chooses among tied colours.":
		"마지막 말의 주인은 도착한 구덩이에 있는 말 개수만큼 점수를 얻어요. 색깔 구덩이는 그 색깔 점수가, 천사는 가장 낮은 색깔이, 악마는 가장 높은 색깔이 오릅니다. 동점인 색깔은 수를 둔 마법사가 골라요.",
	"The game ends when any colour reaches 30, or after 100 turns. Final score = twice your lowest colour minus your highest colour.":
		"어느 색깔이든 30점에 닿거나 100턴이 지나면 게임이 끝나요. 최종 점수 = 가장 낮은 색깔 × 2 − 가장 높은 색깔.",
	"This edition automates initial placement, fixes the order before the last counter, and omits the show’s piece penalties.":
		"이 에디션은 처음 배치를 자동으로 하고 마지막 말 앞의 순서를 고정하며, 방송의 말 벌점은 없어요.",
	"2–5 seats, automatic counter placement and a 100-turn cap. Retains angel/minimum, devil/maximum and twice-minimum-minus-maximum scoring.":
		"2–5인, 말 자동 배치, 최대 100턴. 천사/최저, 악마/최고 규칙과 최저 × 2 − 최고 점수 계산은 그대로예요.",

	// Wall Go and Wall Go II (one engine)
	"Move or break": "이동 또는 벽 부수기",
	"Build a wall": "벽 세우기",
	"Break a wall": "벽 부수기",
	"Move a familiar": "사역마 이동",
	"Move familiar": "사역마 이동",
	Territory: "영역",
	"Turn {#n} · Mage {#m}": "{n}턴 · 마법사 {m}",
	"Your wall breaks: {#n}": "남은 벽 부수기: {n}",
	"Walls: {#n}": "벽: {n}",
	"Build wall toward square {#n}": "{n}번 칸 쪽에 벽 세우기",
	"Move familiar {#i} to {#n}": "사역마 {i}: {n}번 칸으로 이동",
	"Stay with familiar {#i} to {#n}": "사역마 {i}: {n}번 칸에 머무르기",
	"Break wall {#a}–{#b}": "{a}–{b} 사이 벽 부수기",
	"Choose your familiar": "사역마를 고르세요",
	"Familiar {#i} · square {#n}": "사역마 {i} · {n}번 칸",
	"Choose an edge": "벽 자리를 고르세요",
	"Between {#a} and {#b}": "{a}번과 {b}번 사이",
	"Mage {#n} moved familiar {#i} from {#a} to {#b}.": "마법사 {n}: 사역마 {i} 이동, {a}번 → {b}번 칸.",
	"Mage {#n} built a wall between {#a} and {#b}.": "마법사 {n}: {a}번과 {b}번 사이에 벽을 세움.",
	"Mage {#n} broke the wall between {#a} and {#b}.": "마법사 {n}: {a}번과 {b}번 사이의 벽을 부숨.",
	"A 2–5 mage adaptation of the Season 2 territory game.": "시즌 2의 영역 게임을 마법사 2–5명용으로 각색했어요.",
	"Each mage controls 2 familiars on a {#w}×{#h} board. Move up to {#s} orthogonal steps without crossing walls or occupied squares, then build a wall beside that familiar. Staying is allowed.":
		"마법사마다 {w}×{h} 판에서 사역마 2마리를 움직여요. 벽이나 다른 말이 있는 칸을 지나지 않고 가로세로로 최대 {s}칸 이동한 다음, 그 사역마 옆에 벽을 세웁니다. 제자리에 머물러도 돼요.",
	"Instead, spend one of {#n} wall-break charges to remove a wall beside either familiar. Breaking ends your turn.":
		"이동하는 대신 벽 부수기 {n}회 중 하나를 써서 내 사역마 옆의 벽을 없앨 수 있어요. 벽을 부수면 턴이 끝납니다.",
	"The game ends when every occupied territory contains only one mage, or after 80 turns. Unclaimed land scores nothing; contested land at the limit splits evenly between its occupants. Most territory wins.":
		"사역마가 있는 모든 영역에 마법사가 한 명씩만 남거나 80턴이 지나면 게임이 끝나요. 주인 없는 땅은 점수가 없고, 턴 제한까지 다투던 땅은 그 안의 마법사들이 똑같이 나눕니다. 영역이 가장 넓은 마법사가 이겨요.",
	"This edition assigns starting positions, permits staying, uses a turn limit, and omits the show’s rematch ladder and clock.":
		"이 에디션은 시작 위치를 정해 주고 제자리 머무르기를 허용하며 턴 제한을 써요. 방송의 재대결 사다리와 시계는 없습니다.",
	"7×7 arena at 2–5 seats, fixed starting positions, optional staying and an 80-turn limit; contested land splits at the limit.":
		"2–5인용 7×7 판, 고정된 시작 위치, 제자리 머무르기 허용, 80턴 제한. 턴 제한까지 다투던 땅은 나눠 가져요.",
	"HOUSE VARIANT: Wall Go II has been named in Season 3, but its complete rules have not been verified. This is an original playable variant, not the show's confirmed rules.":
		"하우스 룰: 벽 바둑 II는 시즌 3에서 이름만 공개됐고 전체 규칙은 확인되지 않았어요. 방송의 확정 규칙이 아니라 직접 만든 변형입니다.",
	"This edition uses a 5×5 board, movement up to 3 spaces, and 2 wall breaks per mage. The smaller board and longer movement create earlier territorial contests.":
		"이 에디션은 5×5 판, 최대 3칸 이동, 마법사당 벽 부수기 2회를 써요. 판이 작고 이동이 길어서 영역 다툼이 더 일찍 벌어집니다.",
	"HOUSE VARIANT. Full show rules remain unverified. Original 5×5 arena with movement 3 and 2 wall breaks; shares Wall Go's territory engine.":
		"하우스 룰. 방송의 전체 규칙은 확인되지 않았어요. 직접 만든 5×5 판에 이동 3칸, 벽 부수기 2회를 쓰며, 벽 바둑과 같은 영역 규칙으로 돌아갑니다.",

	// Bagh Chal
	"Place goats; move tigers": "염소는 놓고, 호랑이는 이동",
	"Move along the lines": "선을 따라 이동",
	"Goats surround; tigers capture": "염소는 포위하고, 호랑이는 잡아요",
	"Goats waiting: {#n}": "대기 중인 염소: {n}",
	"Goats captured: {#n} / {#m}": "잡힌 염소: {n} / {m}",
	"Mage 1: goats · Mage 2: tigers": "마법사 1: 염소 · 마법사 2: 호랑이",
	"Diagonals connect alternating intersections.": "대각선은 한 칸 건너 하나씩 교차점을 이어요.",
	"Place goat on {#n}": "{n}번에 염소 놓기",
	"Move goat {#a} to {#b}": "염소 이동: {a}번 → {b}번",
	"Move tiger {#a} to {#b}": "호랑이 이동: {a}번 → {b}번",
	"Leap {#a} over {#b} to {#c}": "{a}번에서 {b}번을 뛰어넘어 {c}번으로",
	"Mage {#n}: Place goat on {#a}.": "마법사 {n}: {a}번에 염소를 놓음.",
	"Mage {#n}: Move goat {#a} to {#b}.": "마법사 {n}: 염소 이동, {a}번 → {b}번.",
	"Mage {#n}: Move tiger {#a} to {#b}.": "마법사 {n}: 호랑이 이동, {a}번 → {b}번.",
	"Mage {#n}: Leap {#a} over {#b} to {#c}.": "마법사 {n}: {a}번에서 {b}번을 뛰어넘어 {c}번으로.",
	"Choose a piece": "말을 고르세요",
	"Capture at {#n}": "뛰어넘어 {n}번으로",
	"Goat reserve": "남은 염소",
	"Unplaced goat": "아직 놓지 않은 염소",
	"Place goat": "염소 놓기",
	"{#n} Tiger": "{n} 호랑이",
	"{#n} Goat": "{n} 염소",
	"A single-board adaptation of the final. Mage 1 controls goats, Mage 2 tigers; local rematches rotate your seat.":
		"결승전 게임을 판 하나로 각색했어요. 마법사 1이 염소를, 마법사 2가 호랑이를 맡고, 다시 하면 자리가 바뀝니다.",
	"Goats place 20 pieces one at a time, then slide along the board’s lines. Tigers begin in the corners and move along the same lines.":
		"염소는 20마리를 한 번에 하나씩 놓은 다음, 판의 선을 따라 움직여요. 호랑이는 네 모서리에서 시작해 같은 선을 따라 움직입니다.",
	"A tiger captures by leaping one adjacent goat into an empty point beyond. Diagonal lines exist only at alternating intersections.":
		"호랑이는 바로 옆 염소 하나를 뛰어넘어 그 너머 빈 자리에 내려앉으면 염소를 잡아요. 대각선은 한 칸 건너 하나씩 있는 교차점에만 있습니다.",
	"Tigers win after capturing 5 goats. Goats win when all tigers are blocked. After 120 moves, the game draws.":
		"호랑이는 염소 5마리를 잡으면 이겨요. 염소는 호랑이를 모두 움직이지 못하게 막으면 이깁니다. 120수가 지나면 무승부예요.",
	"The show used two mirrored boards at once; this edition uses one and has no enforced deadline.":
		"방송에서는 마주 보는 판 두 개를 동시에 썼지만, 이 에디션은 판 하나를 쓰고 시간 제한이 없어요.",
	"One 5×5 tiger-and-goat board rather than two mirrored boards; draws after 120 moves.":
		"마주 보는 판 두 개 대신 5×5 호랑이와 염소 판 하나. 120수가 지나면 무승부예요.",
}
