import type { Chapter, Meta } from './book.svelte';

export const SEED_META: Meta = {
	title: 'Farvel, skærm',
	subtitle: 'Hvordan kunstig intelligens muliggør en tilbagevenden til den virkelige verden',
	author: 'Simon Moe',
	html: [
		'<p>Denne bog er en praktisk anvisning til hvordan kunstig intelligens kan udnyttes til at bringe den samarbejdende og fordybende skole tilbage til fremtiden. Gennem helt konkrete greb på tværs af fag, klasser og insitutioner, vil jeg vise hvordan den virkelige verden – du ved, den hvor vi ser hinanden i øjnene, bruger vores umage til at tegne, diskutere, sammensætte og konkretisere læringsmål – kommer tilbage i de danske gymnasier med fornyet kraft og potentiale.</p>',
		'<p>Men først skal vi afsætte tid til at aflive nogle antagelser, og se på nogle benspænd.</p>'
	].join('')
};

export const SEED_CHAPTERS: Chapter[] = [
	{
		id: 'myterne-foerst',
		order: 1,
		title: 'Myterne først',
		html: [
			'<h3>Kunstig intelligens fratager os kreativitet</h3>',
			'<p><br></p>',
			'<h3>Kunstig intelligens foregår ved en skærm</h3>',
			'<p>Nej. Det er en software som endelig tilbyder interaktionsformer løsrevet fra den individuelle computer. Den kan og bør benyttes i teams, og helst helt uden skærm. Tag dig et øjeblik til at tæne over dette: hvis kunstig intelligens kan se skærmen og gøre de ting som traditionelt var nødvendige at DU gjorde for at realisere noget digitalt. Behøver du så se på skærmen overhovedet? Eller kunne det tænkes, at du faktisk kunne fravende dig den allestedsnærværende skærm og vende tilbage til det du fungerer bedst i: papiret, tucherne, blokken, mødebordet, øjenkontakten og fordybelsen der ligger i de elementer dit sanseapparat er udviklet til at fungere i.</p>',
			'<h3>Kunstig intelligens er et personligt redskab</h3>',
			'<p>Kunstig intelligens er ikke et personligt redskab. Lige nu benyttes det som sådan på samme måde som motorvejenes bredde blev afgjort af afstanden mellem hestevognens hjul. Vi vid ikke bedre eller andet, end at bruge den som en indivuduel software gennem personlige devices – mobilttelefoner og computere. Det er imidlertid en helt unødvendig tilgang, og jeg vi argumentere for at personlige computere og mobiltelefoner i det store hele, ikke længere er nødvendige i en moderne dansk skole. Kunstig intelligens indvarsler en skoleform, hvor computeren bruges som platform for samarbejde og individuel fordybelse, i langt de fleste tilfælde vil det give mest mening at skærmen er et modalt redskab til display og gruppeinteraktioner.</p>',
			'<h3>Kunstig intelligens er snyd</h3>',
			'<p>Kunstig intelligens er ikke snyd, men den form for skolegang hvor eleven formatterer svar på bekendtgjorte sandheder, er ikke længere nødvendig. I fremtidens skole kan vi tillade eleven at være nysgerrig, kritisk og skabende, og i stedet for at evaluere paratviden, kan vi fokusere på evnen til at udvikle og bruge de egenskaber i et fagligt rum og fællesskab.</p>'
		].join('')
	}
];
