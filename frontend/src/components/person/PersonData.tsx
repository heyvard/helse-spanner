import React from 'react'
import { useQuery } from 'react-query'
import { personRequestFactory, useBackend } from '../../external/backend'
import classNames from 'classnames'
import styles from './Person.module.css'
import { backendFeil, finnesIkke, httpFeil } from '../../external/feil'
import { PersonView } from './PersonView'
import { PersonContext } from '../../state/contexts'

export type FetchPersonProps = {
    personId: string
}

const Feilmelding = React.memo(({ feil }: { feil: any }) => {
    let feiltekst, ikon

    if (feil instanceof httpFeil) {
        feiltekst = `Fikk ikke kontakt med server: ${feil.message}`
        ikon = '✂️🔌'
    } else if (feil instanceof finnesIkke) {
        feiltekst = `Personen finnes ikke i spleis.` + (!!feil.feilId ? ` FeilId: ${feil.feilId}` : '')
        ikon = '🤷'
    } else if (feil instanceof backendFeil) {
        feiltekst = `Feil fra backend. Status: ${feil.status}` + (!!feil.feilId ? ` FeilId: ${feil.feilId}` : '')
        ikon = '😢'
    } else {
        feiltekst = `Noe gikk galt: ${feil.message}`
        ikon = '☠️'
    }
    return (
        <div className={classNames(styles.FeilMelding)} data-testid="feil-melding">
            <span className={styles.FeilIkon}>{ikon}</span>
            {feiltekst}
        </div>
    )
})
Feilmelding.displayName="Feilmelding"

const Spinner = React.memo(() => (
    <div style={{padding: "10em"}}><div className={styles.Spinner} data-testid="spinner" />️</div>
))
Spinner.displayName="Spinner"

export const PersonData = React.memo((props: FetchPersonProps) => {
    const backend = useBackend()
    try {
        const request = personRequestFactory(props.personId, backend)
        const { isLoading, isError, data, error } = useQuery(['person', props.personId], request)
        if (isLoading) {
            return <Spinner />
        }
        if (isError) {
            return <Feilmelding feil={error} />
        }
        return (
            <PersonContext.Provider value={data}>
                <PersonView />
            </PersonContext.Provider>
        )
    } catch (error) {
        return <Feilmelding feil={error} />
    }
})
PersonData.displayName="PersonData"
