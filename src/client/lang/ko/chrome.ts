import type { Dictionary } from "../engineText"

/** The shared interface around every game: trial controls, table tools, the waiting room, refusals. */
export const chrome: Dictionary = {
	// Trial board and its controls.
	"Game board": "게임판",
	"{label}, position {#n}": "{label}, {n}번 위치",
	"Select a highlighted position to preview your move.": "강조된 위치를 눌러 수를 미리 보세요.",
	"Position {#n} selected. You can choose another before confirming.":
		"{n}번 위치 선택됨. 확정하기 전에 다른 위치로 바꿀 수 있어요.",
	"Clear preview": "미리보기 지우기",
	"Choose {#n}. Selected: {#picked}.": "{n}개를 고르세요. 선택: {picked}개.",
	"Choose {#min}–{#max}. Selected: {#picked}.": "{min}–{max}개를 고르세요. 선택: {picked}개.",
	"Selection order matters.": "고른 순서가 반영돼요.",
	"Selected pieces": "고른 항목",
	"Remove {label}, selection {#n}": "{label} 빼기, {n}번째 선택",
	"Confirm selection": "선택 확정",
	"Clear selection": "선택 지우기",
	"Tap letters to build your word.": "글자를 눌러 단어를 만드세요.",
	"Add {letter}, tile {#n}": "{letter} 추가, {n}번 타일",
	"Remove last letter": "마지막 글자 지우기",
	"Send answer": "답 보내기",
	"Game history": "게임 기록",

	// Step-by-step move builder and forms.
	"Build your move": "수 만들기",
	"Selected steps": "고른 단계",
	"Review your move": "수를 확인하세요",
	"Confirm move": "수 확정",
	"Back one step": "한 단계 뒤로",
	"Choose an option": "선택하세요",
	"Lower {label}": "{label} 낮추기",
	"Raise {label}": "{label} 올리기",

	// Scale pans.
	"Build a comparison": "비교할 추 올리기",
	"Choose a pan, then add weights": "접시를 고른 다음 추를 올리세요",
	"Left pan": "왼쪽 접시",
	"Right pan": "오른쪽 접시",
	"Remove {label} from left pan": "왼쪽 접시에서 {label} 빼기",
	"Remove {label} from right pan": "오른쪽 접시에서 {label} 빼기",
	"{#n} / {#max} weights": "추 {n} / {max}개",
	"Add {label}": "{label} 추가",
	"Weigh the pans": "무게 재기",

	"A solid pile of cubes. Count each cube, including hidden cubes. Use Turn pile to see another side.":
		"빈틈없이 쌓인 큐브 더미입니다. 가려진 큐브까지 모두 세어 보세요. ‘더미 돌리기’로 다른 면을 볼 수 있어요.",

	// Table chat.
	"Table talk": "테이블 채팅",
	"Everyone at this table can read these messages.": "이 테이블에 앉은 모두가 메시지를 볼 수 있어요.",
	"Table messages": "테이블 메시지",
	"Message the table": "테이블에 메시지 보내기",
	"Send message": "메시지 보내기",

	// Clocks and pace targets.
	"Game clocks": "게임 시계",
	"turn overtime": "턴 초과",
	"turn remaining": "턴 남은 시간",
	"turn elapsed": "턴 경과 시간",
	"round overtime": "라운드 초과",
	"round remaining": "라운드 남은 시간",
	"round elapsed": "라운드 경과 시간",
	"game overtime": "게임 초과",
	"game remaining": "게임 남은 시간",
	"game elapsed": "게임 경과 시간",
	"Targets show overtime. Play continues when a clock reaches zero.":
		"목표를 넘기면 초과 시간이 표시돼요. 시계가 0이 되어도 게임은 계속됩니다.",
	"Turn target": "턴 목표",
	"Round target": "라운드 목표",
	"Game target": "게임 목표",
	"Elapsed only": "경과 시간만",
	"{#n} seconds": "{n}초",
	"{#n} minutes": "{n}분",
	"Game and round clocks continue between turns. Online clocks share the server’s start times; pace targets are personal.":
		"게임 시계와 라운드 시계는 턴 사이에도 멈추지 않아요. 온라인에서는 서버의 시작 시각을 함께 쓰고, 속도 목표는 나에게만 적용돼요.",

	// History.
	"Completed a move.": "수를 두었어요.",

	// Home.
	"The grove": "숲",

	// Waiting room.
	"That did not work": "문제가 생겼어요",
	"Opening the circle": "모임을 여는 중",
	host: "방장",
	"Open seat": "빈 자리",
	"Needs {#n} more mage to begin.": "시작하려면 마법사 {n}명이 더 필요해요.",
	"Needs {#n} more mages to begin.": "시작하려면 마법사 {n}명이 더 필요해요.",
	"Enough mages are here. Start now, or wait for a full table.":
		"인원이 충분해요. 지금 시작하거나 자리가 다 찰 때까지 기다리세요.",
	"Waiting for {name} to start, or for the table to fill.": "{name} 님이 시작하거나 자리가 다 차기를 기다리는 중.",
	"Start game": "게임 시작",
	"Link copied": "링크 복사됨",
	"Copy invite link": "초대 링크 복사",

	// Session labels and notices, written in the session hooks and shown by the table.
	"Play again": "다시 하기",
	"New puzzle": "새 퍼즐",
	"Waiting for the others ({#n} of {#total})": "다른 마법사들을 기다리는 중 ({n}/{total})",
	"Accept rematch": "재대결 수락",
	"Ask for a rematch": "재대결 신청",
	"Your rival left the circle.": "상대가 모임을 떠났어요.",
	"A mage left the circle. The game is called off.": "마법사 한 명이 모임을 떠나 게임이 취소됐어요.",
	"Lost the connection to the server.": "서버와 연결이 끊겼어요.",
	"Could not reach the server.": "서버에 연결하지 못했어요.",

	// Errors the server sends (src/server/lobby.ts).
	"No such online game. Known: {games}.": "온라인으로 할 수 없는 게임이에요. 가능한 게임: {games}.",
	"The grove is full. Try again in a minute.": "숲이 가득 찼어요. 잠시 후 다시 시도하세요.",
	"Message is not JSON.": "메시지가 JSON 형식이 아니에요.",
	"Message does not match the protocol.": "메시지가 프로토콜과 맞지 않아요.",
	"Join an active table before sending a message.": "진행 중인 테이블에 들어간 뒤 메시지를 보내세요.",
	"You are already in a room.": "이미 방에 들어와 있어요.",
	"No room with code {code}.": "코드 {code} 방을 찾을 수 없어요.",
	"That game has already started.": "이미 시작한 게임이에요.",
	"There is no table waiting to start.": "시작을 기다리는 테이블이 없어요.",
	"Only the host can start the game.": "방장만 게임을 시작할 수 있어요.",
	"{game} needs at least {#n} mages.": "{game}: 마법사가 {n}명 이상 필요해요.",
	"There is no game in progress.": "진행 중인 게임이 없어요.",
	"It is not your turn.": "당신 차례가 아니에요.",
	"There is no finished game to replay.": "다시 할 수 있는 끝난 게임이 없어요.",

	// Refused moves every game shares (src/shared/game.ts, seasonOneSupport.ts, seasonTwoCommon.ts).
	// seasonOnePuzzles.ts and seasonTwoBoards.ts hold the rest: merge() allows one translation per template.
	"That is not a move this game understands.": "이 게임에서 쓸 수 없는 수예요.",
	"This trial has ended. Start another game.": "이 게임은 끝났어요. 새 게임을 시작하세요.",
	"Wait for your turn.": "당신 차례를 기다리세요.",
	"Choose one of the available actions.": "가능한 행동 중 하나를 고르세요.",
	"Select the required cards before playing.": "필요한 카드를 먼저 고른 뒤 내세요.",
	"Choose {#n} different available cards.": "쓸 수 있는 서로 다른 카드 {n}장을 고르세요.",
	"Enter {#n} comma-separated numbers.": "쉼표로 구분한 숫자 {n}개를 입력하세요.",
	"Choose items from the selection.": "선택지에 있는 항목을 고르세요.",
	"Choose the required number of distinct items.": "서로 다른 항목을 정해진 개수만큼 고르세요.",
	"This action does not take a value.": "이 행동에는 값을 넣을 수 없어요.",
	"There is no such seat.": "그런 자리는 없어요.",
}
