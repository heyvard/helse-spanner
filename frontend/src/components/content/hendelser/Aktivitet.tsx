import React from "react";
import {AktivitetDto} from "../../../state/dto";
import styles from "./Aktivitet.module.css";
import classNames from "classnames";

type AktivitetViewProps = {
    aktivitet: AktivitetDto
}
export const Aktivitet: React.FC<AktivitetViewProps> = React.memo(({aktivitet}: { aktivitet: AktivitetDto }) => {
    const isWarning = aktivitet.alvorlighetsgrad == "WARN"
    return <div className={styles.AktivitetView}>
        <span className={classNames(styles.HeaderLinje, isWarning && styles.Warning)}>
            <bdi className={styles.AktivitetViewAlvorlighetsgradLabel}>{aktivitet.alvorlighetsgrad}</bdi>
            <bdi className={styles.AktivitetViewMeldingText}>{aktivitet.melding}</bdi>
        </span>
    </div>
})