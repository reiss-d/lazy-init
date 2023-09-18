import { lz } from 'lazy-init'

export default function Layout({ children }: {
   children: React.ReactNode
}) {
   return (
      <html lang={lz({ lang: 'en' }).lang}>
         <body>{children}</body>
      </html>
   )
}
