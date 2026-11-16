import { useState } from "react"
import {
	EQUATION_OPERATORS,
	EQUATION_ROUNDS,
	type EquationHiLoMove,
	type EquationHiLoView,
	type EquationLane,
	type EquationOperator,
	equationValue,
} from "../../shared/games/equationHiLo"
import { useLang } from "../i18n"
import { type BoardProps, useLinger } from "./types"
import { Piece } from "./devils/Piece"

const symbol = (operator: EquationOperator) => (operator === "/" ? "÷" : operator === "-" ? "−" : "+")
const showValue = (value: number) => Number(value.toFixed(3)).toString()

function Expression({ numbers, operators }: { numbers: number[]; operators: EquationOperator[] }) {
	return (
		<span className="eq-expression">
			{Array.from({ length: 4 }, (_, index) => (
				<span className="eq-term" key={index}>
					{index > 0 && (
						<span className="eq-operator">{operators[index - 1] ? symbol(operators[index - 1]!) : "?"}</span>
					)}
					<span className="eq-number">{numbers[index] ?? "?"}</span>
				</span>
			))}
		</span>
	)
}

function EquationDraft({
	view,
	canAct,
	onMove,
}: Pick<BoardProps<EquationHiLoView, EquationHiLoMove>, "view" | "canAct" | "onMove">) {
	const { tx } = useLang()
	const [order, setOrder] = useState<number[]>([])
	const [operators, setOperators] = useState<EquationOperator[]>([])
	const [lane, setLane] = useState<EquationLane>("low")
	const [step, setStep] = useState<"numbers" | "operators" | "target">("numbers")
	const disabled = !canAct || view.myMove !== null
	const shown = view.myMove
	const shownNumbers = (shown?.order ?? order).map((index) => view.hand[index]!)
	const shownOperators = shown?.operators ?? operators
	const value = equationValue(shownNumbers, shownOperators)
	return (
		<div className="eq-draft">
			<div className="eq-preview" aria-live="polite">
				<Expression numbers={shownNumbers} operators={shownOperators} />
				<strong>= {value === null ? "?" : showValue(value)}</strong>
			</div>
			<p className="eq-hint">
				{tx(
					shown
						? `Sealed for ${shown.lane === "low" ? "1" : "20"}. Waiting for the other mages.`
						: order.length === 4 && operators.length === 3 && value === null
							? "Division by zero. Change the cards or operators so a nonzero card follows ÷."
							: "Use each card and operator once. Division happens first.",
				)}
			</p>
			{!shown && (
				<>
					<nav className="eq-actions" aria-label={tx("Equation steps")}>
						<button
							className={`btn ${step === "numbers" ? "" : "is-ghost"}`}
							disabled={disabled}
							aria-current={step === "numbers" ? "step" : undefined}
							onClick={() => setStep("numbers")}
						>
							{tx("1. Number cards")}
						</button>
						<button
							className={`btn ${step === "operators" ? "" : "is-ghost"}`}
							disabled={disabled || order.length !== 4}
							aria-current={step === "operators" ? "step" : undefined}
							onClick={() => setStep("operators")}
						>
							{tx("2. Operators")}
						</button>
						<button
							className={`btn ${step === "target" ? "" : "is-ghost"}`}
							disabled={disabled || value === null}
							aria-current={step === "target" ? "step" : undefined}
							onClick={() => setStep("target")}
						>
							{tx("3. Target")}
						</button>
					</nav>
					{step === "numbers" && (
						<fieldset className="eq-picker" disabled={disabled}>
							<legend>{tx(`Choose number card ${Math.min(order.length + 1, 4)} of 4`)}</legend>
							<div className="eq-cards">
								{view.hand.map((number, index) => (
									<button
										key={index}
										className={`piece-option ${order.includes(index) ? "is-selected" : ""}`}
										disabled={order.includes(index)}
										onClick={() => setOrder([...order, index])}
										aria-label={tx(`Add number ${number}, card ${index + 1}`)}
									>
										<Piece piece={{ kind: "card", rank: String(number) }} />
										<span>
											{tx(order.includes(index) ? `Position ${order.indexOf(index) + 1}` : `Card ${index + 1}`)}
										</span>
									</button>
								))}
							</div>
							<div className="eq-actions">
								<button
									className="btn is-ghost"
									disabled={order.length === 0}
									onClick={() => setOrder(order.slice(0, -1))}
								>
									{tx("Undo card")}
								</button>
								<button className="btn" disabled={order.length !== 4} onClick={() => setStep("operators")}>
									{tx("Choose operators")}
								</button>
							</div>
						</fieldset>
					)}
					{step === "operators" && (
						<fieldset className="eq-picker" disabled={disabled}>
							<legend>{tx(`Choose operator ${Math.min(operators.length + 1, 3)} of 3`)}</legend>
							<div className="eq-cards">
								{EQUATION_OPERATORS.map((operator) => (
									<button
										key={operator}
										className="piece-option"
										disabled={operators.includes(operator)}
										onClick={() => setOperators([...operators, operator])}
										aria-label={tx(
											`Add ${operator === "+" ? "addition" : operator === "-" ? "subtraction" : "division"}`,
										)}
									>
										<Piece piece={{ kind: "tile", text: symbol(operator) }} />
										<span>
											{operators.includes(operator)
												? tx(`Position ${operators.indexOf(operator) + 1}`)
												: symbol(operator)}
										</span>
									</button>
								))}
							</div>
							<div className="eq-actions">
								<button
									className="btn is-ghost"
									disabled={operators.length === 0}
									onClick={() => setOperators(operators.slice(0, -1))}
								>
									{tx("Undo operator")}
								</button>
								<button className="btn" disabled={value === null} onClick={() => setStep("target")}>
									{tx("Choose target")}
								</button>
							</div>
						</fieldset>
					)}
					{step === "target" && (
						<fieldset className="eq-picker" disabled={disabled}>
							<legend>{tx("Choose your target")}</legend>
							<div className="eq-lanes">
								{(["low", "high"] as const).map((choice) => (
									<button
										key={choice}
										className={`piece-option ${lane === choice ? "is-selected" : ""}`}
										aria-pressed={lane === choice}
										onClick={() => setLane(choice)}
									>
										<Piece
											piece={{
												kind: "token",
												icon: choice === "low" ? "moon" : "sun",
												text: choice === "low" ? "1" : "20",
											}}
										/>
										<span>{tx(`Aim for ${choice === "low" ? 1 : 20}`)}</span>
										<small>
											{value === null ? "" : tx(`${showValue(Math.abs(value - (choice === "low" ? 1 : 20)))} away`)}
										</small>
									</button>
								))}
							</div>
							<button className="btn" disabled={value === null} onClick={() => onMove({ order, operators, lane })}>
								{tx("Seal equation")}
							</button>
						</fieldset>
					)}
					<button
						className="btn is-ghost"
						disabled={disabled || (order.length === 0 && operators.length === 0)}
						onClick={() => {
							setOrder([])
							setOperators([])
							setStep("numbers")
						}}
					>
						{tx("Clear spell")}
					</button>
				</>
			)}
		</div>
	)
}

export function EquationHiLoBoard({
	view,
	seat,
	names,
	canAct,
	onMove,
}: BoardProps<EquationHiLoView, EquationHiLoMove>) {
	const { tx } = useLang()
	const label = (index: number) => (index === seat ? tx("You") : names[index]!)
	const revealing = useLinger(view.history.length, 2400)
	return (
		<div className="eq">
			<div className="eq-heading">
				<strong>{tx(`Round ${view.round} of ${EQUATION_ROUNDS}`)}</strong>
				<span>{tx("Closest to 1 or 20")}</span>
			</div>
			<div className="eq-scores" aria-label={tx("Scores")}>
				{names.map((name, index) => (
					<div className={`eq-score seat${index}`} key={index}>
						<span>{label(index)}</span>
						<strong>{view.scores[index]}</strong>
						<small>{tx(view.hand.length === 0 ? "Final score" : view.sealed[index] ? "Sealed" : "Composing")}</small>
					</div>
				))}
			</div>
			{view.hand.length > 0 && (
				<EquationDraft key={view.round} view={view} canAct={canAct && !revealing} onMove={onMove} />
			)}
			{view.history.length > 0 && (
				<section className="eq-reveal" aria-label={tx("Round history")}>
					<h3>{tx("Revealed rounds")}</h3>
					{view.history.map((round, roundIndex) => (
						<details key={roundIndex} open={roundIndex === view.history.length - 1}>
							<summary>{tx(`Round ${roundIndex + 1}`)}</summary>
							{round.map((result, index) => (
								<div className={`eq-result seat${index} ${result.won ? "is-winning" : ""}`} key={index}>
									<strong>
										{label(index)} {result.won ? "+1" : "+0"}
									</strong>
									<Expression numbers={result.numbers} operators={result.operators} />
									<span>
										= {showValue(result.value)} · {tx(`target ${result.lane === "low" ? 1 : 20}`)}
									</span>
								</div>
							))}
						</details>
					))}
				</section>
			)}
		</div>
	)
}
