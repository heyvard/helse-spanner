import {AktivitetDto, AktivitetV2Dto, KontekstMapDto, KontekstMapV2Dto} from './dto'

export type Aktivitetslogg = {
    aktiviteter: AktivitetDto[]
    kontekster: Kontekst[]
}
export type AktivitetsloggV2 = {
    aktiviteter: AktivitetV2Dto[],
    hendelsekontekster: Hendelsekontekst[]
}

export type Kontekst = {
    kontekstType: string
    kontekstMap: KontekstMapDto
    aktiviteter: AktivitetDto[]
    id: number
    erHendelsekontekst: boolean
    opprettet: Date
    harError: Boolean
    harWarning: Boolean
}

export type Hendelsekontekst = {
    kontekstType: string
    kontekstMap: KontekstMapV2Dto
    aktiviteter: AktivitetV2Dto[]
    id: number
    erHendelsekontekst: boolean
    opprettet: Date
    harError: Boolean
    harWarning: Boolean
}
