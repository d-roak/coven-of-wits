import type { Lang } from "../i18n"

const en = {
	share: "Share",
	shareGame: "Share game",
	shareResult: "Share result",
	invite: "Invite friends",
	close: "Close sharing",
	panelTitle: "Pass it around",
	inviteTitle: "Gather your circle",
	publicNote: "Share a game link. Your table and private choices stay here.",
	inviteNote: "Anyone with this invitation can join your room while seats are open.",
	composerNote: "Choose where to share. You can review before posting.",
	preview: "Message preview",
	link: "Share link",
	copyLink: "Copy link",
	copied: "Link copied.",
	copyFailed: "Copy was blocked. Select the link and copy it manually.",
	native: "More sharing options",
	nativeFailed: "Device sharing is unavailable. Choose a destination or copy the link below.",
	shared: "Share sheet completed.",
	homeMessage: "Gather by the candles and play at Coven of Wits.",
	gameMessage: "Play {game} at Coven of Wits.",
	inviteMessage: "Join my {game} table at Coven of Wits.",
	win: "I won {game} at Coven of Wits.",
	draw: "I tied a game of {game} at Coven of Wits.",
	finished: "I played {game} at Coven of Wits.",
	solved: "I solved {game} at Coven of Wits.",
	unsolved: "I tried {game} at Coven of Wits. Can you solve it?",
}

const ko: Record<keyof typeof en, string> = {
	share: "공유",
	shareGame: "게임 공유",
	shareResult: "결과 공유",
	invite: "친구 초대",
	close: "공유 창 닫기",
	panelTitle: "함께 즐겨요",
	inviteTitle: "친구를 초대하세요",
	publicNote: "게임 링크를 공유합니다. 현재 테이블과 비밀 선택은 공개되지 않아요.",
	inviteNote: "빈자리가 있으면 이 초대 링크를 받은 누구나 방에 들어올 수 있어요.",
	composerNote: "공유할 곳을 고르세요. 게시 전에 내용을 확인할 수 있어요.",
	preview: "메시지 미리 보기",
	link: "공유 링크",
	copyLink: "링크 복사",
	copied: "링크를 복사했어요.",
	copyFailed: "복사가 차단됐어요. 아래 링크를 선택해 직접 복사해 주세요.",
	native: "다른 앱으로 공유",
	nativeFailed: "기기에서 공유할 수 없어요. 아래에서 공유할 곳을 고르거나 링크를 복사해 주세요.",
	shared: "공유 창을 마쳤어요.",
	homeMessage: "촛불 곁에 모여 Coven of Wits에서 함께 게임을 즐겨요.",
	gameMessage: "Coven of Wits에서 {game} 게임을 즐겨요.",
	inviteMessage: "Coven of Wits의 {game} 테이블에 초대합니다.",
	win: "Coven of Wits에서 {game} 게임을 이겼어요.",
	draw: "Coven of Wits의 {game} 게임에서 비겼어요.",
	finished: "Coven of Wits에서 {game} 게임을 즐겼어요.",
	solved: "Coven of Wits에서 {game} 퍼즐을 풀었어요.",
	unsolved: "Coven of Wits에서 {game} 퍼즐에 도전했어요. 풀 수 있나요?",
}

export type CommunityTextKey = keyof typeof en
export function communityText(lang: Lang, key: CommunityTextKey, game = ""): string {
	return (lang === "ko" ? ko : en)[key].replace("{game}", () => game)
}
