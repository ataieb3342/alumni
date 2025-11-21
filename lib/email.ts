import nodemailer from 'nodemailer'

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // true pour 465, false pour les autres ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

interface NewUserNotification {
  firstName: string
  lastName: string
  email: string
  userType: string
  userId: string
}

export async function sendAdminNotificationEmail(userData: NewUserNotification) {
  const { firstName, lastName, email, userType, userId } = userData
  const sanityUrl = `${process.env.SANITY_STUDIO_URL || 'https://mon-site.sanity.studio'}/structure/user;${userId}`

  const userTypeLabels: Record<string, string> = {
    lyceen: 'Lycéen',
    bts: 'BTS',
    prepa: 'Prépa',
    alumni: 'Ancien élève',
    staff: 'Personnel',
  }

  const mailOptions = {
    from: `"Association VH Besançon" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: 'Nouvelle demande d\'inscription - Action requise',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #1e3a8a;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 30px;
              border: 1px solid #e5e7eb;
            }
            .info-box {
              background-color: white;
              padding: 15px;
              border-left: 4px solid #1e3a8a;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #1e3a8a;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nouvelle demande d'inscription</h1>
            </div>
            <div class="content">
              <p>Bonjour,</p>
              <p>Une nouvelle demande d'inscription a été soumise et attend validation :</p>

              <div class="info-box">
                <p><strong>Nom :</strong> ${firstName} ${lastName}</p>
                <p><strong>Email :</strong> ${email}</p>
                <p><strong>Type de membre :</strong> ${userTypeLabels[userType] || userType}</p>
              </div>

              <p>Pour valider ou rejeter cette inscription, connectez-vous à Sanity Studio :</p>

              <div style="text-align: center;">
                <a href="${sanityUrl}" class="button">Voir le profil sur Sanity</a>
              </div>

              <p><strong>Actions à effectuer dans Sanity :</strong></p>
              <ol>
                <li>Vérifiez les informations du profil</li>
                <li>Changez le statut du compte de "En attente de validation" à "Actif"</li>
                <li>L'utilisateur pourra alors se connecter</li>
              </ol>
            </div>
            <div class="footer">
              <p>Association VH Besançon - Système de gestion</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Nouvelle demande d'inscription

      Une nouvelle demande d'inscription attend validation :

      Nom : ${firstName} ${lastName}
      Email : ${email}
      Type de membre : ${userTypeLabels[userType] || userType}

      Pour valider cette inscription :
      1. Connectez-vous à Sanity Studio : ${sanityUrl}
      2. Vérifiez les informations
      3. Changez le statut du compte à "Actif"
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email admin:', error)
    return { success: false, error }
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reinitialiser-mot-de-passe?token=${token}`

  const mailOptions = {
    from: `"Association VH Besançon" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #1e3a8a;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 30px;
              border: 1px solid #e5e7eb;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #1e3a8a;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Réinitialisation de mot de passe</h1>
            </div>
            <div class="content">
              <p>Bonjour,</p>
              <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte Association VH Besançon.</p>
              <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button" style="display: inline-block; padding: 12px 24px; background-color: #1e3a8a; color: #ffffff !important; text-decoration: none; border-radius: 5px; margin: 20px 0;">Réinitialiser mon mot de passe</a>
              </div>
              <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; color: #1e3a8a;">${resetUrl}</p>
              <p><strong>Ce lien expirera dans 1 heure.</strong></p>
              <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.</p>
            </div>
            <div class="footer">
              <p>Association VH Besançon</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Réinitialisation de mot de passe

      Vous avez demandé à réinitialiser votre mot de passe.

      Cliquez sur ce lien pour créer un nouveau mot de passe :
      ${resetUrl}

      Ce lien expirera dans 1 heure.

      Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error)
    return { success: false, error }
  }
}
