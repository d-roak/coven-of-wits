import type { Dictionary } from "../engineText"

export const seasonOnePuzzles: Dictionary = {
	// Round counters and words several of these games share.
	Round: "라운드",
	Turn: "턴",
	Question: "질문",
	"End attempt": "도전 끝내기",
	"Attempt ended.": "도전을 끝냈어요.",

	// Move rejections from the helpers these engines share (seasonOneSupport).
	"Choose one of: {actions}.": "다음 중에서 고르세요: {actions}.",
	"Enter a whole number.": "정수를 입력하세요.",
	"Enter a number from {#min} to {#max}.": "{min}에서 {max} 사이의 숫자를 입력하세요.",
	"Enter {#length} comma-separated numbers.": "쉼표로 구분한 숫자 {length}개를 입력하세요.",
	"This action does not take a value.": "이 행동에는 값을 넣을 수 없어요.",
	"There is no such seat.": "그런 자리는 없어요.",

	// Cooperative Puzzle
	"A solo adaptation of the rotating cooperative silhouette puzzle from The Devil’s Plan.":
		"데블스 플랜의 회전 협동 실루엣 퍼즐을 혼자 풀도록 각색했어요.",
	"Cover the 4 × 4 seal with four T-shaped pieces. Rotate a piece, then select its top-left bounding corner.":
		"T자 조각 네 개로 4 × 4 봉인을 덮으세요. 조각을 돌린 뒤, 조각을 감싸는 사각형의 왼쪽 위 칸을 고르세요.",
	"Pieces must stay inside the seal and cannot overlap. Undo a placement when you need space.":
		"조각은 봉인 밖으로 나가거나 서로 겹칠 수 없어요. 자리가 필요하면 놓은 조각을 되돌리세요.",
	"This edition uses one complete tiling puzzle, with no carousel or timer.":
		"이 에디션은 판 전체를 채우는 퍼즐 하나만 쓰고, 회전판과 타이머는 없어요.",
	"Solo T-tetromino silhouette puzzle with rotation and undo; one board, no carousel or timer.":
		"회전과 되돌리기가 있는 1인용 T 테트로미노 실루엣 퍼즐. 판은 하나이고 회전판과 타이머는 없어요.",
	"Fit the runes": "룬 맞추기",
	"Seal complete": "봉인 완성",
	"Cover every square with the four T-shaped pieces.": "T자 조각 네 개로 모든 칸을 덮으세요.",
	"Runes placed": "놓은 룬",
	"Current rune": "지금 놓을 룬",
	"{#n} pieces remain. Rotation: {#r}°.": "남은 조각 {n}개. 회전: {r}°.",
	"Place rune": "룬 놓기",
	"Rune {#n}": "룬 {n}",
	"Rotate rune": "룬 돌리기",
	"Undo placement": "놓은 룬 되돌리기",
	"Rune {#n} covers squares {cells}.": "룬 {n}: {cells}번 칸을 덮었어요.",
	"All four runes fit.": "룬 네 개가 모두 들어맞았어요.",
	"Place a piece before undoing.": "되돌리려면 먼저 조각을 놓으세요.",
	"Choose rotate, place, undo or give-up.": "돌리기, 놓기, 되돌리기, 포기 중에서 고르세요.",
	"That rune overlaps a piece or leaves the seal.": "그 룬은 다른 조각과 겹치거나 봉인 밖으로 나가요.",

	// Fragments of Memory
	"A solo version of the show’s scene-memory prize match.": "방송의 장면 기억 상금 매치를 혼자 하도록 만들었어요.",
	"Study the 4 × 4 apothecary shelf, then hide it. Answer five questions about item positions.":
		"4 × 4 약제상 선반을 외운 뒤 가리세요. 물건의 위치를 묻는 질문 다섯 개에 답하세요.",
	"One wrong answer ends the trial. This edition uses an arcana shelf, five questions, and a manual study phase instead of the hospital photograph and team relay.":
		"한 번 틀리면 시험이 끝나요. 이 에디션은 병원 사진과 팀 릴레이 대신 비전 선반, 질문 다섯 개, 직접 끝내는 암기 단계를 써요.",
	"Solo arcana-shelf memory with five spatial questions; replaces the photograph, ten questions and cooperative relay.":
		"위치 질문 다섯 개가 나오는 1인용 비전 선반 기억 게임. 사진, 질문 열 개, 협동 릴레이를 대신해요.",
	"Study the shelves": "선반 외우기",
	"Answer from memory": "기억으로 답하기",
	"Remember each object’s position.": "물건마다 놓인 자리를 기억하세요.",
	"What was in row {#r}, column {#c}?": "{r}행 {c}열에 무엇이 있었나요?",
	"Answers remembered": "맞힌 답",
	"Hide shelves": "선반 가리기",
	"Question {#n}: row {#r}, column {#c} held {item}.": "질문 {n}: {r}행 {c}열 = {item}.",
	"Every detail remembered.": "하나도 빠짐없이 기억했어요.",
	"The answer was {item}.": "정답: {item}.",
	"Hide the shelf before answering.": "답하기 전에 선반을 가리세요.",
	"Silver moth": "은빛 나방",
	"Green vial": "초록 약병",
	"Red candle": "빨간 양초",
	"Black cat": "검은 고양이",
	"Blue feather": "파란 깃털",
	"Copper key": "구리 열쇠",
	"White teacup": "하얀 찻잔",
	"Rose quartz": "장미 수정",
	"Oak wand": "참나무 지팡이",
	"Wax seal": "밀랍 인장",
	"Moon pendant": "달 펜던트",
	"Open book": "펼친 책",
	Acorn: "도토리",
	"Star chart": "별자리표",
	Bell: "종",
	"Purple mushroom": "보라 버섯",

	// Word Tower (the animal names players spell stay English, see keep.ts)
	"A solo adaptation of the cooperative Word Tower prize match.": "협동 상금 매치 워드 타워를 혼자 풀도록 각색했어요.",
	"Make exactly three animal names using every letter once. Each word must be in the displayed animal list.":
		"모든 글자를 한 번씩 써서 영어 동물 이름을 정확히 세 개 만드세요. 단어는 화면의 동물 목록에 있어야 해요.",
	"Letters are physical tiles: a word cannot use more copies of a letter than remain. You may undo the last word.":
		"글자는 실물 타일이에요. 남은 개수보다 많이 쓸 수 없어요. 마지막 단어는 되돌릴 수 있어요.",
	"The original relay and timer are replaced by a three-word letter puzzle.":
		"원작의 릴레이와 타이머 대신 단어 세 개짜리 글자 퍼즐로 바꿨어요.",
	"Solo three-word animal puzzle with a finite letter bank and listed dictionary; no timed relay or physical stacking.":
		"정해진 글자 타일과 공개된 단어 목록으로 푸는 1인용 동물 단어 세 개 퍼즐. 시간제한 릴레이와 실물 쌓기는 없어요.",
	"Build the towers": "탑 쌓기",
	"Use every letter in exactly three animal names.": "모든 글자를 써서 영어 동물 이름을 정확히 세 개 만드세요.",
	"Allowed animals: {words}.": "쓸 수 있는 동물: {words}.",
	"Built: none.": "쌓은 단어: 없음.",
	"Built: {words}.": "쌓은 단어: {words}.",
	"Words built": "쌓은 단어",
	"Tower {#n}": "탑 {n}",
	"Build an animal name": "동물 이름 만들기",
	"Undo word": "단어 되돌리기",
	"Tower {#n}: {word}.": "탑 {n}: {word}.",
	"Every letter placed.": "모든 글자를 썼어요.",
	"One solution: {words}.": "정답 예시: {words}.",
	"Build a word before undoing.": "되돌리려면 먼저 단어를 만드세요.",
	"Choose word, undo or give-up.": "단어 만들기, 되돌리기, 포기 중에서 고르세요.",
	"Choose an animal from the displayed list.": "화면의 목록에 있는 동물을 고르세요.",
	"Each animal name may be used once.": "동물 이름은 한 번씩만 쓸 수 있어요.",
	"No {letter} tile remains.": "남은 {letter} 타일이 없어요.",

	// Scale Game
	"A solo deduction bench based on the show’s cooperative scales.":
		"방송의 협동 저울 게임을 바탕으로 한 1인용 추리 실험대예요.",
	"Five stone types A–E weigh distinct whole numbers from 1 to 20 grams. A weighs 1 gram.":
		"돌 다섯 종류 A–E의 무게는 1–20그램 사이의 서로 다른 정수예요. A는 1그램이에요.",
	"Place stones on the two pans to compare their weight. Each pan may hold up to 20 stones; identical stacks cannot be compared.":
		"두 접시에 돌을 올려 무게를 비교하세요. 접시 하나에 돌을 20개까지 올릴 수 있고, 구성이 같은 더미끼리는 비교할 수 없어요.",
	"You have 20 comparisons. Find a genuine balance, then guess all five weights in A–E order.":
		"비교는 20번 할 수 있어요. 실제로 수평을 한 번 맞춘 뒤, 다섯 무게를 A–E 순서로 맞히세요.",
	"This edition supplies unlimited calibration stones and one scale instead of the show’s separate rooms and limited cubes.":
		"이 에디션은 방송의 분리된 방과 개수 제한 큐브 대신 무제한 측정용 돌과 저울 하나를 써요.",
	"Solo scale with unlimited calibration cubes, one known 1 g weight and 20 comparisons; replaces separate rooms and cube limits.":
		"무제한 측정용 큐브, 1 g으로 알려진 돌 하나, 비교 20번으로 푸는 1인용 저울. 분리된 방과 큐브 제한을 대신해요.",
	"Compare the stones": "돌 비교하기",
	"Name the weights": "무게 맞히기",
	"A weighs 1 g. Deduce B, C, D and E.": "A는 1 g이에요. B, C, D, E의 무게를 추리하세요.",
	"{#n} comparisons remain.": "남은 비교 {n}번.",
	"A genuine balance has been found.": "수평을 맞춘 적이 있어요.",
	"Find a balance before the final answer.": "최종 답을 내기 전에 수평을 한 번 맞추세요.",
	Comparisons: "비교 횟수",
	"{letter} · unknown": "{letter} · 무게 모름",
	"Stone weights in grams": "돌 무게 (그램)",
	"Seal weights": "무게 봉인",
	"{letter} weight": "{letter} 무게",
	"Guess weights": "무게 맞히기",
	"Weigh stones": "돌 달기",
	"Weights: {list}.": "무게: {list}.",
	"Choose weigh or guess.": "돌 달기와 무게 맞히기 중에서 고르세요.",
	"All 20 comparisons have been used.": "비교 20번을 모두 썼어요.",
	"Choose Guess weights first.": "먼저 ‘무게 맞히기’를 고르세요.",
	"Choose Weigh stones first.": "먼저 ‘돌 달기’를 고르세요.",
	"Use A–E on each side of =, with 1–20 stones per pan.": "= 양쪽에 A–E를 쓰고, 접시마다 돌을 1–20개 올리세요.",
	"Compare different stacks.": "구성이 다른 더미끼리 비교하세요.",

	// Montage
	"A solo adaptation of the face-recognition prize match.": "얼굴 알아보기 상금 매치를 혼자 하도록 각색했어요.",
	"Each portrait shows a familiar, cloak color and sigil. All three details must match for a repeat.":
		"초상화마다 사역마, 망토 색, 인장이 그려져 있어요. 세 가지가 모두 같아야 다시 나온 초상화예요.",
	"Choose New face to advance, or Seen before when the portrait repeats. Missing a repeat ends the trial.":
		"처음 보는 초상화면 ‘새 얼굴’로 넘기고, 다시 나온 초상화면 ‘본 적 있음’을 고르세요. 다시 나온 초상화를 놓치면 시험이 끝나요.",
	"A false repeat costs 1 error. The 11th error ends the trial. Find the repeat in all five rounds to win.":
		"처음 보는 초상화를 본 적 있다고 하면 실수 1회예요. 11번째 실수에서 시험이 끝나요. 다섯 라운드 모두 다시 나온 초상화를 찾으면 이겨요.",
	"This edition uses illustrated arcana portraits and manual advance instead of photographs shown for three seconds.":
		"이 에디션은 3초씩 보여 주는 사진 대신 비전 초상화 그림을 쓰고, 직접 넘기며 진행해요.",
	"Solo five-round portrait memory using familiar/cloak/sigil descriptions and manual advance, replacing timed photographs and buzzers.":
		"사역마, 망토, 인장으로 구분하는 1인용 5라운드 초상화 기억 게임. 직접 넘기며 진행하고, 시간제한 사진과 버저를 대신해요.",
	"Spot the portrait": "초상화 알아보기",
	"Does every detail match a portrait from this round?": "이번 라운드에 나온 초상화와 모든 부분이 같은가요?",
	"Rounds cleared": "통과한 라운드",
	"False alarms: {#n} of {#max} allowed.": "오인: {n}회 (최대 {max}회 허용).",
	"New face": "새 얼굴",
	"Seen before": "본 적 있음",
	"Round {#n}: repeat found.": "{n}라운드: 다시 나온 초상화를 찾았어요.",
	"Five repeats found.": "다시 나온 초상화 다섯 개를 모두 찾았어요.",
	"The memory trial ended.": "기억 시험이 끝났어요.",
	"Choose new or seen.": "새 얼굴과 본 적 있음 중에서 고르세요.",
	"{animal} / {color} hood / {sigil}": "{animal} / {color} 두건 / {sigil}",
	Fox: "여우",
	Owl: "올빼미",
	Moth: "나방",
	Cat: "고양이",
	Hare: "산토끼",
	Lamb: "어린 양",
	crescent: "초승달",
	star: "별",
	eye: "눈",

	// Laying Grass
	"A compact adaptation of the show’s polyomino territory match on a shared 10 × 10 garden.":
		"방송의 폴리오미노 영토 매치를 함께 쓰는 10 × 10 정원으로 줄여 각색했어요.",
	"Place the next patch beside your territory. Rotate it as needed. Patches may not overlap, leave the garden, or touch a rival along an edge.":
		"다음 조각을 내 영토 옆에 놓으세요. 필요하면 돌리세요. 조각은 겹치거나 정원 밖으로 나갈 수 없고, 상대 영토와 변이 맞닿아도 안 돼요.",
	"Spend an exchange ticket to swap the next patch with one of the four following patches. One swap is allowed per turn.":
		"교환권을 쓰면 다음 조각을 그 뒤 네 조각 중 하나와 바꿀 수 있어요. 교환은 한 턴에 한 번이에요.",
	"Surround a well on all four sides to claim it and earn an exchange ticket. Well squares cannot be covered directly.":
		"우물의 네 변을 모두 둘러싸면 우물을 차지하고 교환권을 얻어요. 우물 칸을 조각으로 직접 덮을 수는 없어요.",
	"After eight patches per mage, the largest completely filled square wins. Pass only when the current patch cannot fit in any rotation.":
		"마법사마다 조각 여덟 개를 받은 뒤, 빈칸 없이 채운 가장 큰 정사각형을 가진 쪽이 이겨요. 지금 조각이 어느 방향으로도 들어가지 않을 때만 패스할 수 있어요.",
	"This edition reduces the board and tile deck, scores square side length, and replaces robbery/stone powers with exchange wells.":
		"이 에디션은 판과 타일 더미를 줄이고, 정사각형 한 변의 길이로 점수를 매기며, 강탈과 돌 능력 대신 교환 우물을 써요.",
	"Shared 10×10 polyomino territory, eight patches per mage, largest-square score; exchange wells replace robbery and stone powers.":
		"함께 쓰는 10×10 폴리오미노 영토, 마법사당 조각 여덟 개, 가장 큰 정사각형으로 점수 계산. 강탈과 돌 능력 대신 교환 우물을 써요.",
	"Grow your garden": "정원 가꾸기",
	"The gardens are measured by their largest filled square.": "정원마다 빈칸 없이 채운 가장 큰 정사각형을 재요.",
	"Mage {#n} places {shape}.": "마법사 {n} 차례: {shape} 놓기.",
	"Largest square": "가장 큰 정사각형",
	"Current patch": "지금 조각",
	"Next patches": "다음 조각",
	"{#n}. {shape}": "{n}. {shape}",
	"{#n} patches remain. Your exchange tickets: {#tickets}.": "남은 조각 {n}개. 내 교환권: {tickets}장.",
	"Plant patch": "조각 심기",
	Well: "우물",
	"Rotate patch": "조각 돌리기",
	"Swap for {shape}": "교환: {shape}",
	"Pass patch": "조각 패스",
	"Mage {#n} passed an unplaceable patch.": "마법사 {n}: 놓을 수 없는 조각을 패스했어요.",
	"Mage {#n} planted {shape}.": "마법사 {n}: {shape} 심기.",
	"Mage {#n} planted {shape} and claimed a well.": "마법사 {n}: {shape} 심기, 우물 차지.",
	"No exchange is available this turn.": "이번 턴에는 교환할 수 없어요.",
	"The current patch still fits. Rotate it or place it.": "지금 조각을 아직 놓을 수 있어요. 돌리거나 놓으세요.",
	"Choose rotate, exchange, place or pass.": "돌리기, 교환, 놓기, 패스 중에서 고르세요.",
	"Place beside your garden without touching a rival or covering a well.":
		"상대 영토에 닿거나 우물을 덮지 않게 내 정원 옆에 놓으세요.",
	Branch: "가지",
	Corner: "모퉁이",
	Square: "정사각형",
	"T-rune": "T자 룬",
	Crook: "갈고리",
	Stair: "계단",

	// Four-Player Three in a Row
	"Four mages each have five stones on a shared 4 × 4 board.":
		"마법사 넷이 함께 쓰는 4 × 4 판에서 돌을 다섯 개씩 가져요.",
	"Place a stack of one, two or three reserve stones, or move one exposed stone to an orthogonally adjacent square. A stack may never exceed three stones.":
		"예비 돌 한 개에서 세 개를 한 더미로 놓거나, 맨 위에 드러난 내 돌 하나를 상하좌우로 붙은 칸으로 옮기세요. 한 더미는 돌 세 개를 넘을 수 없어요.",
	"Only the top stone counts. Three visible stones of your color in a horizontal, vertical or diagonal line win.":
		"맨 위의 돌만 쳐요. 보이는 내 색 돌 세 개가 가로, 세로, 대각선으로 한 줄이 되면 이겨요.",
	"This edition is a four-way contest. It removes the show’s hidden fourth-player identity and four-game cooperative mission. A simultaneous line shares victory; 160 turns without a winner draw.":
		"이 에디션은 넷이 각자 겨뤄요. 방송의 숨겨진 네 번째 플레이어 정체와 네 판짜리 협동 미션은 뺐어요. 줄이 동시에 완성되면 공동 우승이고, 160턴 동안 승자가 없으면 무승부예요.",
	"Four-way stacking contest with five stones per mage; omits hidden fourth-player identity and cooperative four-match mission; 160-turn draw cap.":
		"마법사마다 돌 다섯 개로 넷이 각자 겨루는 쌓기 대결. 숨겨진 네 번째 플레이어 정체와 네 판짜리 협동 미션은 뺐고, 160턴이 지나면 무승부예요.",
	"Stack the crests": "문장 쌓기",
	"Choose the destination for the selected stones.": "고른 돌을 놓을 칸을 고르세요.",
	"Mage {#n} chooses reserve stones or an exposed stone.": "마법사 {n} 차례: 예비 돌이나 드러난 돌 고르기.",
	"Reserve stones": "예비 돌",
	"Your reserve": "내 예비 돌",
	"{#n} stones": "돌 {n}개",
	"Only the top stone counts toward a line.": "줄을 만들 때는 맨 위의 돌만 쳐요.",
	"Your reserve: {#n}.": "내 예비 돌: {n}개.",
	"Place stones": "돌 놓기",
	"Cancel selection": "선택 취소",
	"Place {#n} stone": "돌 {n}개 놓기",
	"Place {#n} stones": "돌 {n}개 놓기",
	"Pass turn": "턴 넘기기",
	"Mage {#n} passed.": "마법사 {n}: 패스.",
	"Mage {#n} placed {#count} stone(s) on square {#to}.": "마법사 {n}: {to}번 칸에 돌 {count}개 놓기.",
	"Mage {#n} moved a stone from square {#from} to {#to}.":
		"마법사 {n}: 돌 하나를 {from}번 칸에서 {to}번 칸으로 옮기기.",
	"Select stones before cancelling.": "취소하려면 먼저 돌을 고르세요.",
	"Place or cancel the selected stones first.": "고른 돌을 먼저 놓거나 취소하세요.",
	"You do not have that many reserve stones.": "예비 돌이 그만큼 없어요.",
	"No stack has room for that many stones.": "그만큼 올릴 자리가 있는 더미가 없어요.",
	"Select an exposed stone of your color with an open neighbour.":
		"옆에 자리가 있는, 맨 위에 드러난 내 색 돌을 고르세요.",
	"You still have a legal move.": "아직 둘 수 있는 수가 있어요.",
	"Choose reserve stones or an exposed stone first.": "먼저 예비 돌이나 드러난 돌을 고르세요.",
	"Choose an adjacent destination with space, or a valid reserve placement.":
		"자리가 있는 옆 칸이나 예비 돌을 놓을 수 있는 칸을 고르세요.",

	// Blind Gomoku
	"A memory duel based on the show’s secret-chamber challenge.": "방송의 비밀의 방 도전을 바탕으로 한 기억력 결투예요.",
	"Take turns placing one stone on an empty point. Make five or more of your stones in a straight line.":
		"번갈아 빈 점에 돌을 하나씩 놓으세요. 내 돌 다섯 개 이상을 일직선으로 이으세요.",
	"Only the latest stone shows its owner. Older stones are sealed, so remember who placed them. All stones reveal when the duel ends.":
		"가장 최근에 놓은 돌만 주인이 보여요. 그 전의 돌은 봉인되니 누가 놓았는지 기억하세요. 결투가 끝나면 모든 돌이 공개돼요.",
	"This edition uses a 9 × 9 board, automatic line checking and a casual bot that sees the same sealed board. It has no secret-room entry puzzle or Piece wager.":
		"이 에디션은 9 × 9 판을 쓰고 줄 완성을 자동으로 확인해요. 봇도 같은 봉인된 판을 보며 가볍게 둬요. 비밀의 방 입장 퍼즐과 피스 내기는 없어요.",
	"9×9 duel with sealed owners, latest-stone visibility and automatic five-in-a-row checks; no entry-code puzzle or Piece wager.":
		"9×9 결투. 돌 주인은 봉인되고 가장 최근 돌만 보이며, 오목 완성은 자동으로 확인해요. 입장 암호 퍼즐과 피스 내기는 없어요.",
	"Remember the stones": "돌 기억하기",
	"The seals open.": "봉인이 풀려요.",
	"Mage {#n} places a stone.": "마법사 {n} 차례: 돌 놓기.",
	"Stones placed": "놓은 돌",
	"Only the latest stone reveals its owner during play.": "게임 중에는 가장 최근에 놓은 돌만 주인이 보여요.",
	"{#n} stones placed. All owners revealed.": "놓은 돌 {n}개. 모든 주인이 공개됐어요.",
	"{#n} stones placed. Earlier owners remain sealed.": "놓은 돌 {n}개. 이전 돌의 주인은 봉인돼 있어요.",
	"Place stone": "돌 놓기",
	Sealed: "봉인",
	"Place a stone on an empty point.": "빈 점에 돌을 놓으세요.",
	"That point already holds a stone.": "그 점에는 이미 돌이 있어요.",
}
