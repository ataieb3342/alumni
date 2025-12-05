import { NextRequest, NextResponse } from 'next/server'
import { serverClient } from '@/sanity/lib/server-client'
import { sendMarketingAlumniWelcome } from '@/lib/emails'

interface HelloAssoMember {
  firstName: string
  lastName: string
  email: string
  date: string
}

interface SanityUser {
  _id: string
  email: string
  firstName: string
  lastName: string
}

// Fonction pour obtenir un token d'accès HelloAsso
async function getHelloAssoAccessToken(): Promise<string> {
  const clientId = process.env.HELLOASSO_CLIENT_ID
  const clientSecret = process.env.HELLOASSO_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('HELLOASSO_CLIENT_ID ou HELLOASSO_CLIENT_SECRET manquant')
  }

  const response = await fetch('https://api.helloasso.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!response.ok) {
    throw new Error(`Erreur lors de l'authentification HelloAsso: ${response.statusText}`)
  }

  const data = await response.json()
  return data.access_token
}

// Fonction pour récupérer les adhérents HelloAsso récents (moins de 2 mois)
async function getRecentHelloAssoMembers(accessToken: string): Promise<HelloAssoMember[]> {
  const organizationSlug = process.env.HELLOASSO_ORGANIZATION_SLUG || 'vh-besancon-alumni'

  const twoMonthsAgo = new Date()
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
  const fromDate = twoMonthsAgo.toISOString()

  const members: HelloAssoMember[] = []
  let pageIndex = 1
  let hasMorePages = true

  while (hasMorePages) {
    const response = await fetch(
      `https://api.helloasso.com/v5/organizations/${organizationSlug}/orders?from=${fromDate}&pageSize=100&pageIndex=${pageIndex}&withDetails=true`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des commandes: ${response.statusText}`)
    }

    const data = await response.json()

    for (const order of data.data || []) {
      if (order.formType === 'Membership' && order.payer) {
        const orderDate = new Date(order.date)
        if (orderDate >= twoMonthsAgo) {
          members.push({
            firstName: order.payer.firstName,
            lastName: order.payer.lastName,
            email: order.payer.email,
            date: order.date,
          })
        }
      }
    }

    hasMorePages = data.pagination?.totalPages > pageIndex
    pageIndex++
  }

  return members
}

// Fonction pour normaliser les noms
function normalizeName(firstName: string, lastName: string): string {
  return (firstName + ' ' + lastName)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

// Fonction pour vérifier si un email a déjà été envoyé (via Sanity)
async function hasEmailBeenSent(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim()
  const result = await serverClient.fetch(
    `count(*[_type == "alumniEmailLog" && lower(email) == $email])`,
    { email: normalizedEmail }
  )
  return result > 0
}

// Fonction pour enregistrer l'envoi d'un email dans Sanity
async function logEmailSent(member: HelloAssoMember): Promise<void> {
  await serverClient.create({
    _type: 'alumniEmailLog',
    email: member.email,
    firstName: member.firstName,
    lastName: member.lastName,
    sentAt: new Date().toISOString(),
  })
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'autorisation via le secret Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Vérifier la configuration HelloAsso
    if (!process.env.HELLOASSO_CLIENT_ID || !process.env.HELLOASSO_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Configuration HelloAsso manquante' },
        { status: 500 }
      )
    }

    console.log('🔐 Authentification HelloAsso...')
    const accessToken = await getHelloAssoAccessToken()

    console.log('📋 Récupération des adhérents HelloAsso...')
    const helloAssoMembers = await getRecentHelloAssoMembers(accessToken)

    console.log('👥 Récupération des utilisateurs du site...')
    const sanityUsers = await serverClient.fetch<SanityUser[]>(
      `*[_type == "user"]{ _id, email, firstName, lastName }`
    )

    // Créer des maps pour la recherche rapide
    const sanityEmailsSet = new Set(
      sanityUsers.map(user => user.email.toLowerCase().trim())
    )

    const sanityNamesSet = new Set(
      sanityUsers.map(user => normalizeName(user.firstName, user.lastName))
    )

    // Identifier les adhérents manquants
    const missingMembers: HelloAssoMember[] = []

    for (const member of helloAssoMembers) {
      const emailNormalized = member.email.toLowerCase().trim()
      const nameNormalized = normalizeName(member.firstName, member.lastName)
      const nameReversed = normalizeName(member.lastName, member.firstName)

      const exists = sanityEmailsSet.has(emailNormalized) ||
                     sanityNamesSet.has(nameNormalized) ||
                     sanityNamesSet.has(nameReversed)

      const alreadySent = await hasEmailBeenSent(member.email)

      if (!exists && !alreadySent) {
        missingMembers.push(member)
      }
    }

    console.log(`📊 ${missingMembers.length} adhérents à contacter`)

    // Envoyer les emails
    let emailsSent = 0
    let emailsFailed = 0

    for (const member of missingMembers) {
      try {
        const result = await sendMarketingAlumniWelcome({
          email: member.email,
          firstName: member.firstName,
          lastName: member.lastName,
        })

        if (result.success) {
          await logEmailSent(member)
          emailsSent++
          console.log(`✅ Email envoyé à ${member.email}`)
        } else {
          emailsFailed++
          console.log(`❌ Échec de l'envoi à ${member.email}`)
        }

        // Délai pour éviter de surcharger le serveur email
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        emailsFailed++
        console.error(`❌ Erreur pour ${member.email}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Vérification des adhérents ALUMNI terminée',
      stats: {
        helloAssoMembers: helloAssoMembers.length,
        siteUsers: sanityUsers.length,
        missingMembers: missingMembers.length,
        emailsSent,
        emailsFailed,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erreur lors de la vérification des adhérents:', error)
    return NextResponse.json(
      {
        error: 'Erreur lors de la vérification des adhérents',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
