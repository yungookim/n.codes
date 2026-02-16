
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/api" | "/api/generate" | "/api/generate/stream" | "/api/jobs" | "/api/jobs/[jobId]" | "/api/tickets" | "/api/tickets/[id]" | "/api/tickets/[id]/comments" | "/tickets" | "/tickets/[id]";
		RouteParams(): {
			"/api/jobs/[jobId]": { jobId: string };
			"/api/tickets/[id]": { id: string };
			"/api/tickets/[id]/comments": { id: string };
			"/tickets/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { jobId?: string; id?: string };
			"/api": { jobId?: string; id?: string };
			"/api/generate": Record<string, never>;
			"/api/generate/stream": Record<string, never>;
			"/api/jobs": { jobId?: string };
			"/api/jobs/[jobId]": { jobId: string };
			"/api/tickets": { id?: string };
			"/api/tickets/[id]": { id: string };
			"/api/tickets/[id]/comments": { id: string };
			"/tickets": { id?: string };
			"/tickets/[id]": { id: string }
		};
		Pathname(): "/" | "/api/generate" | "/api/generate/stream" | `/api/jobs/${string}` & {} | "/api/tickets" | `/api/tickets/${string}` & {} | `/api/tickets/${string}/comments` & {} | "/tickets" | `/tickets/${string}` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/n.codes.capabilities.json" | "/ncodes-widget.js" | "/ncodes-widget.js.map" | string & {};
	}
}