export type PersonDto = {
    arbeidsgivere: ArbeidsgiverDto[]
    aktørId: string
    fødselsnummer: string
    opprettet: string
    aktivitetslogg: AktivitetsloggDto
    aktivitetsloggV2?: AktivitetsloggV2Dto
    [x: string]: any
}

export type FeilDto = {
    error_id: string
    description?: string
    [x: string]: any
}

export type ArbeidsgiverDto = {
    id: string
    organisasjonsnummer: string
    vedtaksperioder: VedtakDto[]
    forkastede: FokastelseDto[]
    utbetalinger: UtbetalingDto[]
    [x: string]: any
}

export type VedtakDto = {
    tilstand: string
    fom: string
    tom: string
    id: string
    [x: string]: any
}

//Får forkastet vedtaksperiode oppgradert versjoner? Hvis ikke må forkastet vedtaksperiode være egen type ettersom den
//kan være på et eget format
export type FokastetVedtaksperiodeDto = {
    tilstand: string
    fom: string
    tom: string
    id: string
    [x: string]: any
}

export type FokastelseDto = {
    vedtaksperiode: FokastetVedtaksperiodeDto
    årsak: string
}

export type UtbetalingDto = {
    status: string
    fom: string
    tom: string
    id: string
    [x: string]: any
}

export interface AktivitetDto {
    kontekster: number[]
    alvorlighetsgrad: string
    aktivitet?: string
    melding: string
    detaljer: any
    tidsstempel: string
    behovtype?: string
    [x: string]: any
}

export type KontekstDto = {
    kontekstType: string
    kontekstMap: KontekstMapDto
}

export type KontekstMapDto = {
    meldingsreferanseId?: string
    vedtaksperiodeId?: string
    aktørId?: string
    fødselsnummer?: string
    organisasjonsnummer?: string
    tilstand?: string
    utbetalingId?: string
    [x: string]: any
}

export type AktivitetsloggDto = {
    aktiviteter: AktivitetDto[]
    kontekster: KontekstDto[]
}

export type AktivitetsloggV2Dto = {
    aktiviteter: AktivitetV2Dto[]
}
export interface AktivitetV2Dto {
    nivå: string
    melding: string
    tidsstempel: string
    kontekster: KonteksterDto
}

export type KonteksterDto = {
    [x: string]: KontekstMapV2Dto
}

export type KontekstMapV2Dto = {
    meldingsreferanseId?: string
    vedtaksperiodeId?: string
    aktørId?: string
    fødselsnummer?: string
    organisasjonsnummer?: string
    tilstand?: string
    utbetalingId?: string
    [x: string]: any
}

export type MeldingDto = {
    id: string
}
