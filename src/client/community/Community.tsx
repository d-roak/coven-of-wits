import { GithubLogoIcon } from "@phosphor-icons/react"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { communityConfig, GITHUB_REPOSITORY } from "../../shared/community"
import { useLang } from "../i18n"

interface CommunityState {
	githubUrl: string | null
	feedbackEnabled: boolean
	loading: boolean
}
const defaultGithubUrl = `https://github.com/${GITHUB_REPOSITORY}`
const CommunityContext = createContext<CommunityState>({
	githubUrl: defaultGithubUrl,
	feedbackEnabled: false,
	loading: true,
})
export function CommunityProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<CommunityState>({
		githubUrl: defaultGithubUrl,
		feedbackEnabled: false,
		loading: true,
	})
	useEffect(() => {
		let active = true
		const abort = new AbortController()
		const timer = setTimeout(() => abort.abort(), 8000)
		fetch("/api/community", { signal: abort.signal, credentials: "same-origin" })
			.then(
				async (response) => {
					if (!response.ok) throw new Error("Community settings unavailable")
					const config = communityConfig.parse(await response.json())
					if (config.githubUrl && !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(config.githubUrl))
						throw new Error("Invalid repository URL")
					active && setState({ ...config, loading: false })
				},
				() => active && setState({ githubUrl: defaultGithubUrl, feedbackEnabled: false, loading: false }),
			)
			.catch(() => active && setState({ githubUrl: defaultGithubUrl, feedbackEnabled: false, loading: false }))
			.finally(() => clearTimeout(timer))
		return () => {
			active = false
			clearTimeout(timer)
			abort.abort()
		}
	}, [])
	return <CommunityContext.Provider value={state}>{children}</CommunityContext.Provider>
}
export const useCommunity = () => useContext(CommunityContext)
export function GitHubButton() {
	const { githubUrl } = useCommunity()
	const { lang } = useLang()
	return githubUrl ? (
		<a
			className="btn is-ghost github-button"
			href={githubUrl}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={lang === "ko" ? "GitHub 저장소 열기" : "Open GitHub repository"}
		>
			<GithubLogoIcon weight="fill" />
			<span>GitHub</span>
		</a>
	) : (
		<button
			className="btn is-ghost github-button"
			disabled
			title={lang === "ko" ? "GitHub 링크가 아직 설정되지 않았어요." : "The GitHub link is not configured yet."}
		>
			<GithubLogoIcon weight="fill" />
			<span>GitHub</span>
		</button>
	)
}
