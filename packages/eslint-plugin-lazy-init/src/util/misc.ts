/**
 * Upper cases the first character or the string
 */
export function upperCaseFirst(str: string): string {
   return str[0]!.toUpperCase() + str.slice(1)
}
