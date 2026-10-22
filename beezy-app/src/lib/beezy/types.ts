/** A person on an event's split list. */
export interface Participant {
	id: string;
	name: string;
	/** Optional 11-digit GCash number shown on receipts as "{name}'s gcash". */
	gcash?: string;
}

/** A trip or gathering that groups participants and expenses. */
export interface Event {
	id: string;
	title: string;
	budget: number;
	createdAt: string;
	participants: Participant[];
}

/** A single expense logged against an event. */
export interface Activity {
	id: string;
	eventId: string;
	name: string;
	price: number;
	paidById: string;
	paidByName: string;
	createdAt: string;
	updatedAt: string;
	settled?: boolean;
	/**
	 * Participant ids this expense is split among (payer included).
	 * Omit or leave empty to split equally with everyone on the event.
	 */
	splitWithIds?: string[];
}

/** Persisted app data (events, activities, and store creation timestamp). */
export interface Store {
	events: Event[];
	activities: Activity[];
	created: number;
}

export type TabId = 'events' | 'activities' | 'payment';

export interface DetailSubState {
	type: 'detail';
	id: string;
}

export interface PayEventSubState {
	type: 'pay-event';
	id: string;
}

export interface PayActivitySubState {
	type: 'pay-activity';
	eventId: string;
	activityId: string;
}

/** Combined receipt for every expense one person covered on a trip. */
export interface PayPersonSubState {
	type: 'pay-person';
	eventId: string;
	paidById: string;
}

export type SubState = DetailSubState | PayEventSubState | PayActivitySubState | PayPersonSubState;

/** How Payment groups receipts on a trip's settle screen. */
export type PayReceiptMode = 'expense' | 'person';

export interface NewEventSheetState {
	type: 'new-event';
	/** When set, the sheet edits this trip instead of creating one. */
	id?: string | null;
}

export interface ActivitySheetState {
	type: 'activity';
	id: string | null;
	eventId: string | null;
}

export interface AboutSheetState {
	type: 'about';
}

export type SheetState = NewEventSheetState | ActivitySheetState | AboutSheetState;

/** In-memory or session-persisted navigation state. */
export interface ViewState {
	tab: TabId;
	sub: SubState | null;
	sheet: SheetState | null;
	menu: boolean;
	/** When true, fully settled trips are hidden on the Events list. */
	hideDone: boolean;
	/** Payment settle screen: one receipt per expense, or one per person who paid. */
	payReceiptMode: PayReceiptMode;
}

/** Minimal activity fields needed for settlement math. */
export type ActivityLike = Pick<Activity, 'price' | 'paidById' | 'settled' | 'splitWithIds'>;

/** Per-participant balance row from equal-split tally. */
export interface TallyRow {
	id: string;
	name: string;
	paid: number;
	share: number;
	balance: number;
}

/** Equal-split settlement totals and per-participant balances. */
export interface TallyResult {
	total: number;
	n: number;
	share: number;
	rows: TallyRow[];
}

/** Full event tally including the activity list used in the calculation. */
export type EventTallyResult = TallyResult & { activities: ActivityLike[] };

/** Per-expense breakdown: payer and what each other member owes. */
export interface ActivityBreakdown {
	total: number;
	n: number;
	share: number;
	payer: Participant | null;
	others: Participant[];
	/** People this expense is split among (payer included). */
	splitters: Participant[];
	/** True when the split is the full event participant list. */
	splitEveryone: boolean;
	/** Amount friends still owe the payer (excludes the payer's own share). */
	collectTotal: number;
	/** Who-paid only: outstanding expenses use different split sets. */
	splitMixed?: boolean;
}

/** Combined equal-split of every expense one person paid. */
export interface PayerBundleResult<T extends ActivityLike = ActivityLike> extends ActivityBreakdown {
	activities: T[];
	settled: boolean;
}
