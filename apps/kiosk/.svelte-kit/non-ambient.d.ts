
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
		RouteId(): "/" | "/gate" | "/gate/[gate_id]" | "/gate/[gate_id]/payment" | "/gate/[gate_id]/success" | "/setup" | "/sim";
		RouteParams(): {
			"/gate/[gate_id]": { gate_id: string };
			"/gate/[gate_id]/payment": { gate_id: string };
			"/gate/[gate_id]/success": { gate_id: string }
		};
		LayoutParams(): {
			"/": { gate_id?: string };
			"/gate": { gate_id?: string };
			"/gate/[gate_id]": { gate_id: string };
			"/gate/[gate_id]/payment": { gate_id: string };
			"/gate/[gate_id]/success": { gate_id: string };
			"/setup": Record<string, never>;
			"/sim": Record<string, never>
		};
		Pathname(): "/" | `/gate/${string}` & {} | `/gate/${string}/payment` & {} | `/gate/${string}/success` & {} | "/setup" | "/sim";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}