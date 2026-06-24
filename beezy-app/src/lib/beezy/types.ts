/** A person on an event's split list. */
export interface Participant {
	id: string;
	name: string;
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

export type SubState = DetailSubState | PayEventSubState | PayActivitySubState;

export interface NewEventSheetState {
	type: 'new-event';
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
}

/** Minimal activity fields needed for settlement math. */
export type ActivityLike = Pick<Activity, 'price' | 'paidById' | 'settled'>;

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
}
