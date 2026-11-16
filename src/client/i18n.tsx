import { GlobeIcon } from "@phosphor-icons/react"
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import type { AnyGame } from "../shared/game"
import { translator } from "./lang/engineText"
import { ko as koGameText } from "./lang/ko"

// Two languages, chosen from the globe in the top right corner.
// What is translated: the grove (home), the table frame, and every game's name and blurb.
// What is not yet: text the game engines write (prompts, clues, logs, rules). It arrives from the
// server as finished English sentences, so translating it means changing the engines' view shape.

export const LANGS = ["en", "ko"] as const
export type Lang = (typeof LANGS)[number]
const LANG_KEY = "coven.lang"

const en = {
	"lang.label": "Language",
	"lang.en": "English",
	"lang.ko": "한국어",

	"home.kicker": "A little magic. A battle of wits.",
	"home.tagline": "Gather by the candles. Play a clever hand, test your memory, and outwit your fellow mages.",
	"home.choose": "Choose a game",
	"home.seat": "There’s a seat for you.",
	"home.seatNote": "Play bots, or invite your coven.",
	"home.name": "Your mage name",
	"home.code": "Room code",
	"home.codeHint": "Enter the 4 letters your friend sent",
	"home.join": "Join room",
	"home.footer": "May your guesses be good and your candles last.",
	"home.allShelves": "All shelves",
	"home.games": "{n} games",
	"home.game": "1 game",

	"shelf.devils": "The Devil’s Plan",
	"shelf.devils.note": "{n} playable trials from the Netflix show.",
	"shelf.circles": "Circles",
	"shelf.circles.note": "Two to five mages around one table. Bluff, bid and second-guess.",
	"shelf.duels": "Duels",
	"shelf.duels.note": "Two mages, one board, nothing hidden.",
	"shelf.solo": "Solo puzzles",
	"shelf.solo.note": "No rival, no clock.",

	"catalog.filter": "Filter by season",
	"catalog.all": "All seasons",
	"catalog.season": "Season {n}",
	"catalog.find": "Find a game",
	"catalog.search": "Search names or mechanics",
	"catalog.showing": "Showing {n} of {total} games",
	"catalog.none": "No games match. Clear the search or choose another season.",
	"catalog.reset": "Show all games",
	"catalog.note":
		"Independent browser adaptations. Edition notes explain changes to the show’s format. Season 3 covers the games identified in episodes 1–5, released November 10, 2026.",

	"card.solo": "Solo ritual",
	"card.mages": "{n} mages",
	"card.magesRange": "{min} to {max} mages",
	"card.house": "House rules",
	"card.edition": "Season {n} · {kind} match · Edition notes",
	"card.reference": "Read rule reference",
	"card.start": "Start puzzle",
	"card.bots": "Play bots",
	"card.tableOf": "Table of",
	"card.quick": "Quick match",
	"card.private": "Private room",

	"table.leave": "Leave",
	"table.restart": "Restart",
	"table.you": "(you)",
	"table.back": "Back to the grove",
	"table.rules": "How to play",
	"status.solved": "Solved.",
	"status.failed": "Not this time.",
	"status.nobody": "Nobody wins.",
	"status.draw": "A draw.",
	"status.youShare": "You share the win.",
	"status.youWin": "You win.",
	"status.wins": "{names} wins.",
	"status.win": "{names} win.",
	"status.and": " and ",
	"status.yourMove": "Your move.",
	"status.waitingFor": "Waiting for {name}.",
	"status.waiting": "Waiting for the others.",

	"clock.turn": "Turn",
	"clock.round": "Round {n}",
	"clock.game": "Game",
	"clock.overtime": "Overtime",
	"clock.remaining": "Remaining",
	"clock.elapsed": "Elapsed",
	"clock.pace": "Set your pace",

	"trial.you": "You",
	"trial.seat": "Seat {n}",
	"trial.scores": "Scores",
	"trial.facts": "Clues and table details",
	"trial.recent": "Recent events",
	"trial.allEvents": "Read all {n} events",
	"trial.of": "{label} {current} of {total}",
	"trial.round": "{label} {current}",
	"round.Round": "Round",
	"round.Auction": "Auction",
	"round.Hand": "Hand",
	"round.Cycle": "Cycle",
	"round.Trial": "Trial",
	"round.Draft": "Draft",
	"round.Showdown": "Showdown",
	"round.Roll": "Roll",
	"round.Turn": "Turn",
	"round.Board": "Board",
	"round.Question": "Question",
	"round.Initial": "Initial",
	"kind.Main": "Main",
	"kind.Prize": "Prize",
	"kind.Prison": "Prison",
	"kind.Final": "Final",
	"kind.Secret": "Secret",
	"history.title": "Action history · {n} moves",
	"history.titleOne": "Action history · 1 move",
	"history.note": "Move order and revealed events. Hidden cards and memory-study faces are not recorded.",
	"history.show": "Show round",
	"history.all": "All rounds",
	"history.empty": "Make a move to begin the history.",
} as const
export type TextKey = keyof typeof en

// Typed against the English keys: a string added there and forgotten here fails the build.
const ko: Record<TextKey, string> = {
	"lang.label": "언어",
	"lang.en": "English",
	"lang.ko": "한국어",

	"home.kicker": "작은 마법, 그리고 두뇌 싸움.",
	"home.tagline": "촛불 곁으로 모이세요. 영리하게 패를 내고, 기억력을 시험하고, 동료 마법사들을 따돌려 보세요.",
	"home.choose": "게임 고르기",
	"home.seat": "당신의 자리가 있어요.",
	"home.seatNote": "봇과 겨루거나 친구들을 초대하세요.",
	"home.name": "마법사 이름",
	"home.code": "방 코드",
	"home.codeHint": "친구가 보낸 네 글자를 입력하세요",
	"home.join": "방 들어가기",
	"home.footer": "추리는 맞아떨어지고 촛불은 오래 타오르기를.",
	"home.allShelves": "전체 선반",
	"home.games": "게임 {n}개",
	"home.game": "게임 1개",

	"shelf.devils": "데블스 플랜",
	"shelf.devils.note": "넷플릭스 예능에 나온 게임 {n}개를 직접 해 볼 수 있어요.",
	"shelf.circles": "모임",
	"shelf.circles.note": "둘에서 다섯 명이 한 테이블에. 블러핑하고, 입찰하고, 수를 읽으세요.",
	"shelf.duels": "결투",
	"shelf.duels.note": "마법사 둘, 판 하나, 숨기는 것 없이.",
	"shelf.solo": "혼자 푸는 퍼즐",
	"shelf.solo.note": "상대도 시계도 없어요.",

	"catalog.filter": "시즌별로 보기",
	"catalog.all": "전체 시즌",
	"catalog.season": "시즌 {n}",
	"catalog.find": "게임 찾기",
	"catalog.search": "이름이나 방식으로 검색",
	"catalog.showing": "게임 {total}개 중 {n}개 표시",
	"catalog.none": "맞는 게임이 없어요. 검색어를 지우거나 다른 시즌을 골라 보세요.",
	"catalog.reset": "모든 게임 보기",
	"catalog.note":
		"방송과 무관하게 만든 브라우저용 각색입니다. 방송 형식과 달라진 점은 에디션 노트에 적혀 있어요. 시즌 3은 2026년 11월 10일 공개된 1–5화의 게임까지 담았습니다.",

	"card.solo": "혼자 하는 의식",
	"card.mages": "마법사 {n}명",
	"card.magesRange": "마법사 {min}–{max}명",
	"card.house": "하우스 룰",
	"card.edition": "시즌 {n} · {kind} 매치 · 에디션 노트",
	"card.reference": "규칙 출처 보기",
	"card.start": "퍼즐 시작",
	"card.bots": "봇과 대결",
	"card.tableOf": "인원",
	"card.quick": "빠른 매치",
	"card.private": "비공개 방",

	"table.leave": "나가기",
	"table.restart": "다시 시작",
	"table.you": "(나)",
	"table.back": "숲으로 돌아가기",
	"table.rules": "게임 방법",
	"status.solved": "풀었어요.",
	"status.failed": "이번엔 아쉽네요.",
	"status.nobody": "승자가 없어요.",
	"status.draw": "무승부.",
	"status.youShare": "공동 우승이에요.",
	"status.youWin": "이겼어요.",
	"status.wins": "{names} 승리.",
	"status.win": "{names} 승리.",
	"status.and": ", ",
	"status.yourMove": "당신 차례예요.",
	"status.waitingFor": "{name} 기다리는 중.",
	"status.waiting": "다른 마법사들을 기다리는 중.",

	"clock.turn": "턴",
	"clock.round": "{n}라운드",
	"clock.game": "게임",
	"clock.overtime": "초과",
	"clock.remaining": "남음",
	"clock.elapsed": "경과",
	"clock.pace": "속도 정하기",

	"trial.you": "나",
	"trial.seat": "{n}번 자리",
	"trial.scores": "점수",
	"trial.facts": "단서와 테이블 정보",
	"trial.recent": "최근 기록",
	"trial.allEvents": "기록 {n}개 모두 보기",
	"trial.of": "{label} {current} / {total}",
	"trial.round": "{label} {current}",
	"round.Round": "라운드",
	"round.Auction": "경매",
	"round.Hand": "핸드",
	"round.Cycle": "사이클",
	"round.Trial": "시험",
	"round.Draft": "드래프트",
	"round.Showdown": "쇼다운",
	"round.Roll": "굴림",
	"round.Turn": "턴",
	"round.Board": "보드",
	"round.Question": "질문",
	"round.Initial": "첫 글자",
	"kind.Main": "메인",
	"kind.Prize": "상금",
	"kind.Prison": "감옥",
	"kind.Final": "결승",
	"kind.Secret": "히든",
	"history.title": "진행 기록 · {n}수",
	"history.titleOne": "진행 기록 · 1수",
	"history.note": "수의 순서와 공개된 사건만 남습니다. 숨긴 카드와 암기 단계의 앞면은 기록하지 않아요.",
	"history.show": "라운드 선택",
	"history.all": "전체 라운드",
	"history.empty": "첫 수를 두면 기록이 시작됩니다.",
}
const TEXT: Record<Lang, Record<TextKey, string>> = { en, ko }

/** Korean name and blurb for every game, by id. i18n.test.ts fails if a game is missing. */
export const GAMES_KO: Record<string, { name: string; blurb: string }> = {
	"virus-game": { name: "바이러스 게임", blurb: "숨은 저주가 모임에 퍼집니다. 범인을 찾거나 치료제를 완성하세요." },
	"cooperative-puzzle": { name: "협동 퍼즐", blurb: "갈라진 룬 네 조각을 정사각형 인장에 맞춰 넣으세요." },
	"rules-race": { name: "규칙 레이스", blurb: "규칙에 내게 유리한 조항을 써넣고 숲을 먼저 빠져나가세요." },
	"fragments-of-memory": { name: "기억의 조각", blurb: "약제상의 선반을 살펴보고, 무엇이 어디 있었는지 떠올리세요." },
	"secret-number": { name: "시크릿 넘버", blurb: "수학 단서를 주고받아, 나조차 볼 수 없는 내 숫자를 알아내세요." },
	"word-tower": { name: "워드 타워", blurb: "함께 쓰는 글자 더미로 동물 이름 세 개를 만드세요." },
	zoo: { name: "동물원", blurb: "동물을 입찰로 데려와, 나만 아는 패턴대로 배치하세요." },
	"scale-game": { name: "저울 게임", blurb: "신비한 추의 균형을 맞춰 돌마다 무게를 추리하세요." },
	"laying-grass": { name: "잔디 깔기", blurb: "희한한 모양의 이끼 조각으로 정사각형 정원을 키우세요." },
	montage: { name: "몽타주", blurb: "사역마의 얼굴을 기억했다가, 같은 얼굴이 돌아오면 종을 울리세요." },
	"four-player-three-in-a-row": {
		name: "4인 3목",
		blurb: "상대 돌 위에 돌을 쌓아, 보이는 문장 세 개를 한 줄로 만드세요.",
	},
	"blind-gomoku": {
		name: "블라인드 오목",
		blurb: "다섯 개를 이으면 승리. 가려진 돌 중 어느 것이 내 것인지 기억하세요.",
	},
	"dice-poker": { name: "주사위 포커", blurb: "행운의 주사위는 남기고 나머지를 다시 굴려 더 센 패를 만드세요." },
	"crooked-cops": { name: "비리 경찰", blurb: "숨은 도둑의 흔적을 쫓으세요. 동료 경비 중 누군가는 거짓말을 합니다." },
	"remove-one": {
		name: "리무브 원",
		blurb: "카드 두 장을 보이고 한 장을 몰래 남기세요. 겹치지 않는 가장 낮은 수가 이깁니다.",
	},
	unknown: { name: "언노운", blurb: "색 주사위를 굴리고, 달라지는 것을 보며 숲의 숨은 법칙을 알아내세요." },
	"time-auction": { name: "시간 경매", blurb: "초를 아껴 쓰세요. 가장 오래 버틴 비밀 입찰만 점수를 얻습니다." },
	"halloween-monster": {
		name: "할로윈 몬스터",
		blurb: "무기를 고르고 마지막 일격의 때를 노리세요. 전리품은 함께 나눕니다.",
	},
	"sniper-holdem": { name: "스나이퍼 홀덤", blurb: "내 패를 읽고, 나를 이길 수 있는 족보를 저격해 금지하세요." },
	"treasure-island": { name: "보물섬", blurb: "화살을 입찰하고, 길을 따라가며, 묻힌 유물의 단서를 읽으세요." },
	"triple-dice": { name: "트리플 다이스", blurb: "주사위 셋을 고르고, 둘은 숨기고, 내 운을 예측하세요." },
	"balance-mancala": {
		name: "밸런스 만칼라",
		blurb: "돌을 시계 방향으로 뿌리세요. 높은 점수보다 고른 점수가 더 값집니다.",
	},
	"wall-go": { name: "벽 바둑", blurb: "사역마를 숲에서 움직이고 벽을 세워 영역을 차지하세요." },
	"doubt-and-bet": { name: "의심과 베팅", blurb: "색 선언을 올리거나, 칩을 걸고 블러핑을 밝혀내세요." },
	"equation-pyramid": {
		name: "수식 피라미드",
		blurb: "신비한 타일 세 개를 순서대로 읽어, 상대보다 먼저 목표 수를 만드세요.",
	},
	"big-or-small": { name: "빅 오어 스몰", blurb: "숫자를 숨기고 상대를 읽으세요. 딜러보다 높을지 낮을지에 겁니다." },
	"bagh-chal": { name: "바그 찰", blurb: "호랑이 네 마리가 사냥하고, 염소 스무 마리가 포위합니다." },
	"question-and-truth": {
		name: "질문과 진실",
		blurb: "질문을 사고, 진실한 단서를 모아, 숨은 숫자 여덟 개를 맞히세요.",
	},
	"find-the-key": { name: "열쇠 찾기", blurb: "잠긴 우물, 둥글게 놓인 그림들, 그리고 첫 글자에 숨은 메시지." },
	"count-the-cubes": { name: "큐브 세기", blurb: "밑에 가려진 것까지, 큐브를 전부 세어 보세요." },
	"count-the-rectangles": { name: "사각형 세기", blurb: "합이 목표 수가 되는 사각형은 몇 개일까요?" },
	"lay-the-grass": { name: "잔디 깔기 II", blurb: "값진 조각을 골라 가져오고, 정원이 차기 전에 자리를 찾으세요." },
	"memory-poker": { name: "기억 포커", blurb: "카드 16장을 기억하고, 2장을 골라 가장 센 패를 완성하세요." },
	"heavy-13": { name: "헤비 13", blurb: "비밀 무게를 쌓으세요. 받침대를 13으로 만드는 돌은 피해야 합니다." },
	"mystery-stock-market": {
		name: "미스터리 주식 시장",
		blurb: "가격의 패턴을 읽고, 숨은 규칙이 드러나기 전에 거래하세요.",
	},
	"russian-roulette": {
		name: "러시안 룰렛",
		blurb: "저주받은 약실을 추적하고, 크레딧을 써서 위험을 내 자리에서 밀어내세요.",
	},
	"wall-go-ii": { name: "벽 바둑 II", blurb: "더 멀리 움직이고, 벽을 부수고, 더 작은 정원을 둘러싸세요." },
	"nine-mens-morris": { name: "나인 멘스 모리스", blurb: "돌 셋을 엮어 밀을 만들고 상대의 진형을 무너뜨리세요." },
	hexagon: { name: "헥사곤", blurb: "숫자를 기억하고, 육각 칸을 따라 숨은 합을 찾아내세요." },
	"equation-hi-lo": {
		name: "수식 하이로우",
		blurb: "숫자 넷을 엮어 주문을 만드세요. 1이나 20을 노리고 함께 공개합니다.",
	},
	"rune-drop": { name: "룬 드롭", blurb: "석판에 구슬을 떨어뜨려 네 개를 한 줄로 이으면 이깁니다." },
	turncoat: { name: "변절자", blurb: "상대 돌을 내 돌 사이에 가두면 내 편으로 돌아섭니다." },
	"mind-auction": { name: "마음 경매", blurb: "상품마다 몰래 입찰하세요. 높은 카드는 제때 써야 합니다." },
	"liars-bones": {
		name: "거짓말쟁이의 주사위",
		blurb: "모두 몰래 굴립니다. 테이블 전체의 눈을 걸거나, 앞선 선언을 거짓이라 외치세요.",
	},
	"lone-spark": {
		name: "외톨이 불꽃",
		blurb: "모두 몰래 숫자를 고릅니다. 아무도 겹치지 않은 가장 낮은 수가 점수를 얻습니다.",
	},
	"last-candle": { name: "마지막 촛불", blurb: "한 번에 한 줄에서 촛불을 끄세요. 마지막 불꽃을 가져가면 이깁니다." },
	"knights-tour": { name: "나이트 투어", blurb: "나이트를 뛰게 해 모든 칸을 딱 한 번씩 밟으세요." },
	"rune-cipher": { name: "룬 암호", blurb: "룬 네 개로 봉인된 암호. 여덟 번 안에 풀어내세요." },
}

function storedLang(): Lang {
	try {
		const saved = localStorage.getItem(LANG_KEY)
		if (saved === "en" || saved === "ko") return saved
	} catch {
		// Storage can be blocked (private mode). The choice just will not persist.
	}
	return navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en"
}

const gameTextKo = translator(koGameText)

type Translate = (key: TextKey, values?: Record<string, string | number>) => string
interface LangState {
	lang: Lang
	setLang(lang: Lang): void
	t: Translate
	/**
	 * Translates a sentence a game engine wrote, or any English literal with an entry in lang/ko.
	 * Text with no entry comes back in English: the long tail of a 48-game catalog should read
	 * half-translated, not crash a table.
	 */
	tx(text: string): string
	/** A game's name and blurb in the current language. */
	game(game: AnyGame): { name: string; blurb: string }
}
const LangContext = createContext<LangState | null>(null)

export function translate(lang: Lang, key: TextKey, values: Record<string, string | number> = {}): string {
	const text = TEXT[lang][key]
	// Keys are typed, but one built from data can still be wrong at run time.
	if (text === undefined) throw new Error(`translate: no text for key "${key}"`)
	return text.replace(/\{(\w+)\}/g, (_, name: string) => {
		if (!(name in values)) throw new Error(`translate: "${key}" needs a value for {${name}}`)
		return String(values[name])
	})
}

export function LangProvider({ children }: { children: ReactNode }) {
	const [lang, setLangState] = useState(storedLang)
	useEffect(() => {
		// Screen readers and font fallback both key off this.
		document.documentElement.lang = lang
	}, [lang])
	const setLang = (next: Lang) => {
		setLangState(next)
		try {
			localStorage.setItem(LANG_KEY, next)
		} catch {
			// Same as storedLang: nothing to do if storage is blocked.
		}
	}
	const state: LangState = {
		lang,
		setLang,
		t: (key, values) => translate(lang, key, values),
		tx: lang === "ko" ? gameTextKo : (text) => text,
		game: (game) => {
			if (lang === "en") return game
			const found = GAMES_KO[game.id]
			if (!found) throw new Error(`No Korean name for game "${game.id}". Add one to GAMES_KO in src/client/i18n.tsx.`)
			return found
		},
	}
	return <LangContext.Provider value={state}>{children}</LangContext.Provider>
}

export function useLang(): LangState {
	const state = useContext(LangContext)
	if (!state) throw new Error("useLang: expected a LangProvider above this component")
	return state
}

/** Round flags, drawn on a 32-unit disc. */
function Flag({ lang }: { lang: Lang }) {
	const id = `flag-clip-${lang}`
	const trigram = (angle: number, broken: boolean[]) => (
		<g transform={`rotate(${angle} 16 16)`}>
			{broken.map((gap, i) => (
				<g key={i}>
					<rect x={24.2 + i * 1.7} y="12.8" width="1.1" height="6.4" fill="#1d1d1b" />
					{gap && <rect x={24.1 + i * 1.7} y="15.4" width="1.3" height="1.2" fill="#f4f4f2" />}
				</g>
			))}
		</g>
	)
	return (
		<svg className="flag" viewBox="0 0 32 32" aria-hidden="true">
			<clipPath id={id}>
				<circle cx="16" cy="16" r="16" />
			</clipPath>
			<g clipPath={`url(#${id})`}>
				{lang === "en" ? (
					<>
						<rect width="32" height="32" fill="#f4f4f2" />
						{[0, 2, 4, 6].map((stripe) => (
							<rect key={stripe} y={stripe * 4.57} width="32" height="4.57" fill="#c8402f" />
						))}
						<rect width="17" height="13.7" fill="#2b3f7e" />
						{[
							[3.5, 3],
							[8.5, 3],
							[13.5, 3],
							[6, 6.8],
							[11, 6.8],
							[3.5, 10.6],
							[8.5, 10.6],
							[13.5, 10.6],
						].map(([cx, cy]) => (
							<circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1" fill="#f4f4f2" />
						))}
					</>
				) : (
					<>
						<rect width="32" height="32" fill="#f4f4f2" />
						<circle cx="16" cy="16" r="6.5" fill="#2b3f7e" />
						<path fill="#c8402f" d="M9.5 16 A6.5 6.5 0 0 1 22.5 16 A3.25 3.25 0 0 0 16 16 A3.25 3.25 0 0 1 9.5 16 Z" />
						{trigram(214, [false, false, false])}
						{trigram(34, [true, true, true])}
						{trigram(-34, [true, false, true])}
						{trigram(146, [false, true, false])}
					</>
				)}
			</g>
			<circle className="flag-rim" cx="16" cy="16" r="15.25" />
		</svg>
	)
}

/** The globe in the top right corner. */
export function LanguageSwitch() {
	const { lang, setLang, t } = useLang()
	const [open, setOpen] = useState(false)
	const root = useRef<HTMLDivElement>(null)
	useEffect(() => {
		if (!open) return
		const close = (event: PointerEvent | KeyboardEvent) => {
			if (event instanceof KeyboardEvent ? event.key === "Escape" : !root.current?.contains(event.target as Node))
				setOpen(false)
		}
		document.addEventListener("pointerdown", close)
		document.addEventListener("keydown", close)
		return () => {
			document.removeEventListener("pointerdown", close)
			document.removeEventListener("keydown", close)
		}
	}, [open])
	return (
		<div className="lang-switch" ref={root}>
			<button
				className="lang-button"
				aria-haspopup="menu"
				aria-expanded={open}
				aria-label={`${t("lang.label")}: ${t(`lang.${lang}`)}`}
				onClick={() => setOpen(!open)}
			>
				<GlobeIcon weight="bold" />
			</button>
			{open && (
				<div className="lang-menu" role="menu" aria-label={t("lang.label")}>
					{LANGS.map((option) => (
						<button
							key={option}
							role="menuitemradio"
							aria-checked={option === lang}
							lang={option}
							onClick={() => {
								setLang(option)
								setOpen(false)
							}}
						>
							<Flag lang={option} />
							{t(`lang.${option}`)}
						</button>
					))}
				</div>
			)}
		</div>
	)
}
