export interface ResumeSection {
	title: string;
	subtitle?: string;
	lines: string[];
}

/** Condensed from static/files/resume.html, one card per "stage". */
export const RESUME_SECTIONS: ResumeSection[] = [
	{
		title: 'JACOB ZOHDI',
		subtitle: 'Software Engineer · Brooklyn, NY',
		lines: ['jzohdi@gmail.com', 'github.com/jzohdi']
	},
	{
		title: 'TECHNICAL SKILLS',
		lines: [
			'Expert: Java, TypeScript, JavaScript, SQL, React',
			'Proficient: Node.js, Python, AWS, GraphQL, Kafka',
			'Hobbyist: PHP, Rust, C#, C, Compilers'
		]
	},
	{
		title: 'STUDIO ZOHDI, LLC',
		subtitle: 'Freelance Software Engineer · 2025 – Current',
		lines: [
			'stopnasdaqchinafraud.com — tracks Nasdaq-based stock pump-and-dump schemes, featured in federal hearings by the SEC',
			'stockpromotiontracker.com — lets users analyze stock promotions in real time'
		]
	},
	{
		title: 'J.P. MORGAN',
		subtitle: 'Software Engineer · Palo Alto, CA · 2022 – 2025',
		lines: [
			'Lead developer of client onboarding APIs for Embedded Payments — scaled from dozens to millions of clients',
			'Optimized client creation time from 9s to 3.2s with parallelization, caching, and process simplifications',
			'Built a virus-scanning sidecar for KYC document flows, safely handling 5,000 documents a day'
		]
	},
	{
		title: 'J.P. MORGAN',
		subtitle: 'More highlights',
		lines: [
			'Led WePay\u2019s multi-year v2 \u2192 v3 API migration, improving success rates from <50% to 99%',
			'Resolved data-race bugs in a risk service processing 1M events/day — success rate 85% \u2192 99.7%',
			'Unblocked $10M+ in TPV by extending the KYC framework to new company types'
		]
	},
	{
		title: 'INTERNSHIPS',
		lines: [
			'Nuage (Bordeaux, France · 2020) — built a compiler turning GraphQL schemas into React Admin dashboards',
			'DocuSign (Chicago, IL · 2019) — built the proof of concept for the DocuSign\u2013Microsoft Dynamics integration, later shipped to production'
		]
	},
	{
		title: 'PROJECTS',
		lines: [
			'Healing Connections — interactive therapy tools serving 10k requests/month · playtherapyapps.com',
			'react-draw — open-source SVG drawing library with a plugin architecture, under 25 KB · jzohdi.github.io/reactdraw',
			'Sightread — in-browser piano practice app, rewrote the renderer with Canvas · sightread.dev'
		]
	},
	{
		title: 'EDUCATION',
		subtitle: 'University of Maryland — College Park, MD',
		lines: ['BS Computer Science · 2018 – 2022', 'Major GPA 3.8']
	}
];
