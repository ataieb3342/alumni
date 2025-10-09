// app/auth/layout.tsx
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}