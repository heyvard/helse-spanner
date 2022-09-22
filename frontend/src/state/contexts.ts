import { ArbeidsgiverDto, FokastetVedtaksperiodeDto, PersonDto, UtbetalingDto, VedtakDto } from './dto'
import React, { useMemo } from 'react'
import { useRecoilValue } from 'recoil'
import { selectedState } from './state'
import {Aktivitetslogg, AktivitetsloggV2} from './model'

//For å slippe defaultvalue til context.
//https://kentcdodds.com/blog/how-to-use-react-context-effectively
// @ts-ignore
export const createContext = <T>() => React.createContext<T | undefined>(undefined)
export const useContext = <T>(context: React.Context<T | undefined>) => {
    const ret = React.useContext(context)
    if (ret === undefined) {
        throw Error('Outside context')
    }
    return ret
}

export const PersonContext = createContext<PersonDto>()
export const ArbeidsgiverContext = createContext<ArbeidsgiverDto>()
export const VedtakContext = createContext<VedtakDto>()
export const ForkastetVedtaksperiodeContext = createContext<FokastetVedtaksperiodeDto>()
export const UtbetalingContext = createContext<UtbetalingDto>()

export const usePerson = () => useContext(PersonContext)
export const useArbeidsgiver = () => useContext(ArbeidsgiverContext)
export const useVedtak = () => useContext(VedtakContext)
export const useForkastetVedtaksperiode = () => useContext(ForkastetVedtaksperiodeContext)
export const useUtbetaling = () => useContext(UtbetalingContext)

export const AktivitetsloggContext = createContext<Aktivitetslogg>()
export const AktivitetsloggV2Context = createContext<AktivitetsloggV2>()
export const useAktivitetslogg = () => useContext(AktivitetsloggContext)
export const useAktivitetsloggV2 = () => useContext(AktivitetsloggV2Context)

export type Id = {
    arbeidsgiver?: string
    vedtaksperiode?: string
    forkastetVedtaksperiode?: string
    utbetaling?: string
}

export const useId = (): Id => {
    const arbeidsgiver = React.useContext(ArbeidsgiverContext)?.id
    const vedtaksperiode = React.useContext(VedtakContext)?.id
    const utbetaling = React.useContext(UtbetalingContext)?.id
    const forkastetVedtaksperiode = React.useContext(ForkastetVedtaksperiodeContext)?.id
    return useMemo(
        () => ({
            arbeidsgiver,
            vedtaksperiode,
            utbetaling,
            forkastetVedtaksperiode,
        }),
        [arbeidsgiver, vedtaksperiode, utbetaling, forkastetVedtaksperiode]
    )
}

const selectColors = ['LightBlue', 'DarkGray', 'DarkOrange', 'Turquoise', 'DarkSeaGreen', 'Orchid', 'Gold', 'LawnGreen']

export const idEqual = (a: Id, b: Id) =>
    a.arbeidsgiver === b.arbeidsgiver &&
    a.vedtaksperiode === b.vedtaksperiode &&
    a.utbetaling === b.utbetaling &&
    a.forkastetVedtaksperiode === b.forkastetVedtaksperiode

export const useIsSelected = () => {
    const selected = useRecoilValue(selectedState)
    const id = useId()
    const index = selected.findIndex((it) => idEqual(it, id))
    if (index == -1) return undefined
    else return selectColors[index % selectColors.length]
}

export const useIsOnlySelected = () => {
    const selected = useRecoilValue(selectedState)
    return selected.length > 1
}
