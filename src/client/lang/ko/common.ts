import type { Dictionary } from "../engineText"

/** Words every engine shares. Game files add their own sentences on top. */
export const common: Dictionary = {
	"Mage {#n}": "마법사 {n}",
	"Seat {#n}": "{n}번 자리",
	You: "나",
	"Round {#n}": "{n}라운드",
	"Position {#n}": "{n}번 위치",
	Empty: "빈칸",
	Skip: "건너뛰기",

	// Suits and court ranks, as the cards draw them.
	"{rank} leaves": "잎 {rank}",
	"{rank} flames": "불꽃 {rank}",
	"{rank} moons": "달 {rank}",
	"{rank} stars": "별 {rank}",
	leaves: "잎",
	flames: "불꽃",
	moons: "달",
	stars: "별",

	// Seat and tile colours.
	ember: "불씨",
	brook: "시내",
	violet: "보라",
	gold: "금",
	moss: "이끼",
	ivory: "상아",
	red: "빨강",
	green: "초록",
	blue: "파랑",
	wild: "와일드",
}
