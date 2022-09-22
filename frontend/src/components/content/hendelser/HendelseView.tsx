import React from 'react'
import {
    AktivitetsloggContext,
    useAktivitetslogg, useAktivitetsloggV2,
    useArbeidsgiver,
    useForkastetVedtaksperiode,
    usePerson,
    useUtbetaling,
    useVedtak,
} from '../../../state/contexts'
import { ContentView } from '../../../state/state'
import { Hendelser } from './Hendelser'
import { ContentCategory } from '../ContentCategory'
import {Aktivitetslogg, AktivitetsloggV2, Hendelsekontekst, Kontekst} from '../../../state/model'
import {AktivitetDto, KontekstMapV2Dto, PersonDto} from '../../../state/dto'
import parseISO from 'date-fns/parseISO'
import compareAsc from 'date-fns/compareAsc'
import { hasValue } from '../../../utils'

const Person = React.memo(() => {
    const aktivitetslogg = useAktivitetslogg()
    return <Hendelser hendelser={aktivitetslogg.kontekster.filter((it) => it.erHendelsekontekst)} />
})
Person.displayName = 'HendelseView.Person'

const Arbeidsgiver = React.memo(() => {
    const aktivitetslogg = useAktivitetslogg()
    const arbeidsgiver = useArbeidsgiver()
    const hendelser = hendelserAssosiertMedKontekst(
        aktivitetslogg,
        (kontekst) =>
            (!!kontekst.kontekstMap.organisasjonsnummer &&
                kontekst.kontekstMap.organisasjonsnummer === arbeidsgiver.organisasjonsnummer) ??
            false
    )

    return <Hendelser hendelser={hendelser} />
})
Arbeidsgiver.displayName = 'HendelseView.Arbeidsgiver'

const Vedtaksperiode = React.memo(() => {
    const vedtaksperiode = useVedtak()
    const aktivitetslogg = useAktivitetslogg()
    const hendelser = hendelserAssosiertMedKontekst(
        aktivitetslogg,
        (kontekst) =>
            (!!kontekst.kontekstMap.vedtaksperiodeId && kontekst.kontekstMap.vedtaksperiodeId === vedtaksperiode.id) ??
            false
    )

    return <Hendelser hendelser={hendelser} />
})
Vedtaksperiode.displayName = 'HendelseView.Vedtaksperiode'

const ForkastetVedtaksperiode = React.memo(() => {
    const vedtaksperiode = useForkastetVedtaksperiode()
    const aktivitetslogg = useAktivitetslogg()

    const hendelser = hendelserAssosiertMedKontekst(
        aktivitetslogg,
        (kontekst) =>
            (!!kontekst.kontekstMap.vedtaksperiodeId && kontekst.kontekstMap.vedtaksperiodeId === vedtaksperiode.id) ??
            false
    )

    return <Hendelser hendelser={hendelser} />
})
Vedtaksperiode.displayName = 'HendelseView.ForkastetVedtaksperiode'

const Utbetaling = React.memo(() => {
    const utbetaling = useUtbetaling()
    const aktivitetslogg = useAktivitetslogg()

    const hendelser = hendelserAssosiertMedKontekst(
        aktivitetslogg,
        (kontekst) =>
            (!!kontekst.kontekstMap.utbetalingId && kontekst.kontekstMap.utbetalingId === utbetaling.id) ?? false
    )

    return <Hendelser hendelser={hendelser} />
})
Vedtaksperiode.displayName = 'HendelseView.Utbetaling'

export const HendelseView = React.memo(() => {
    const person = usePerson()
    const aktivitetslogg: Aktivitetslogg = React.useMemo(() => aktivitetsloggFraPerson(person), [person])
    // todo: ta i bruk
    const aktivitetsloggv2: AktivitetsloggV2 = React.useMemo(() => aktivitetsloggV2FraPerson(person), [person])
    return (
        <AktivitetsloggContext.Provider value={aktivitetslogg}>
            <ContentCategory
                displayName={ContentView.Hendelser}
                {...{ Person, Arbeidsgiver, Vedtaksperiode, ForkastetVedtaksperiode, Utbetaling }}
            />
        </AktivitetsloggContext.Provider>
    )
})

Hendelser.displayName = 'HendelseView'

function aktivitetsloggFraPerson(person: PersonDto): Aktivitetslogg {
    const alleAktiviteter = person.aktivitetslogg.aktiviteter
    const kontekstDtoer = person.aktivitetslogg.kontekster

    const kontekster = kontekstDtoer.map((kontekstDto, index): Kontekst => {
        const aktiviteter = alleAktiviteter.filter((aktivitet) => aktivitet.kontekster.includes(index))
        const opprettet =
            aktiviteter
                .map((it) => parseISO(it.tidsstempel))
                .sort(compareAsc)
                .find(hasValue) ?? parseISO('1900-01-01')
        const harError = !!aktiviteter.find((it) => it.alvorlighetsgrad == 'ERROR')
        const harWarning = !!aktiviteter.find((it) => it.alvorlighetsgrad == 'WARN')
        return {
            kontekstType: kontekstDto.kontekstType,
            kontekstMap: kontekstDto.kontekstMap,
            aktiviteter,
            id: index,
            erHendelsekontekst: !!kontekstDto.kontekstMap.meldingsreferanseId,
            opprettet,
            harError,
            harWarning,
        }
    })

    return {
        aktiviteter: alleAktiviteter,
        kontekster,
    }
}

function aktivitetsloggV2FraPerson(person: PersonDto): AktivitetsloggV2 {
    let alleAktiviteter = person.aktivitetsloggV2?.aktiviteter ?? [];
    let hendelsekontekster: { detaljer: KontekstMapV2Dto, kontekstType: string }[] = []
    alleAktiviteter
        .flatMap((it) => Object.keys(it.kontekster).map((kontekstType) => {
            return {
                "kontekstType": kontekstType,
                "detaljer": it.kontekster[kontekstType]
            }
        }))
        .filter((it) =>  !!it.detaljer.meldingsreferanseId)
        .forEach((kontekst) => {
            if (!!hendelsekontekster.find((it) => it.detaljer.meldingsreferanseId == kontekst.detaljer.meldingsreferanseId)) {
                hendelsekontekster.push(kontekst)
            }
        })
    return {
        aktiviteter: alleAktiviteter,
        hendelsekontekster: hendelsekontekster.map((it) => {
            const aktiviteter = alleAktiviteter.filter((aktivitet) => aktivitet.kontekster.hasOwnProperty(it.kontekstType)
                && aktivitet.kontekster[it.kontekstType].meldingsreferanseId == it.detaljer.meldingsreferanseId)
            const opprettet =
                aktiviteter
                    .map((it) => parseISO(it.tidsstempel))
                    .sort(compareAsc)
                    .find(hasValue) ?? parseISO('1900-01-01')
            const harError = !!aktiviteter.find((it) => it.nivå == 'FUNKSJONELL_FEIL')
            const harWarning = !!aktiviteter.find((it) => it.nivå == 'VARSEL')
            return {
                kontekstType: it.kontekstType,
                kontekstMap: it.detaljer,
                aktiviteter,
                id: 0, // TODO: fjerne?
                erHendelsekontekst: true,
                opprettet,
                harError,
                harWarning,
            }
        })
    }
}

const hendelserAssosiertMedKontekst = (
    aktivitetslogg: Aktivitetslogg,
    kontekstErInteressant: (kontekst: Kontekst) => boolean
): Kontekst[] => {
    const interessanteKontekster = aktivitetslogg.kontekster.filter(kontekstErInteressant).map((it) => it.id)

    const harInteressantKontekst = (aktivitet: AktivitetDto) =>
        aktivitet.kontekster.some((id) => interessanteKontekster.includes(id))

    return aktivitetslogg.kontekster
        .filter((kontekst) => kontekst.erHendelsekontekst)
        .filter((hendelseKontekst) => hendelseKontekst.aktiviteter.some(harInteressantKontekst))
}
