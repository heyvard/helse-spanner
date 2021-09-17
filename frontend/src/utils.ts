export const mapNotUndefined = <T, Y>(array: T[], mapping: (kontekst: T, index: number) => Y | undefined): Y[] => {
    return array
        .map((element, index): [T, number] => ([element, index]))
        .map(([element, index]) => mapping(element, index))
        .filter(y => y != undefined) as Y[]
}

//https://stackoverflow.com/questions/2559318/how-to-check-for-an-undefined-or-null-variable-in-javascript
export const hasValue = (it: any) =>
     it != null