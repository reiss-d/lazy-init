import { lzc } from 'lazy-init'

export default function Layout({ children }: {
   children: React.ReactNode
}) {
   return (
      <html lang={lzc({ lang: 'en' }).lang}>
         <body>{children}</body>
      </html>
   )
}
