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

interface AccountValidatedNotification {
  firstName: string
  lastName: string
  email: string
}

export async function sendAccountValidatedEmail(userData: AccountValidatedNotification) {
  const { firstName, lastName, email } = userData
  const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/connexion`

  const mailOptions = {
    from: `"Association VH Besançon" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Votre compte a été validé !',
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
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .emoji {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .content {
              background-color: #f9fafb;
              padding: 30px;
              border: 1px solid #e5e7eb;
            }
            .success-box {
              background-color: #ecfdf5;
              border-left: 4px solid #10b981;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .button {
              display: inline-block;
              padding: 14px 28px;
              background-color: #10b981;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
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
              <div class="emoji">🎉</div>
              <h1 style="margin: 0;">Bienvenue dans la communauté !</h1>
            </div>
            <div class="content">
              <p>Bonjour ${firstName},</p>

              <div class="success-box">
                <p style="margin: 0; color: #047857; font-size: 16px;">
                  <strong>Bonne nouvelle !</strong> Votre compte VH Besançon Alumni a été validé par notre équipe.
                </p>
              </div>

              <p>Vous pouvez maintenant vous connecter et accéder à toutes les fonctionnalités de la plateforme :</p>

              <ul>
                <li><strong>Annuaire</strong> - Retrouvez vos camarades et développez votre réseau</li>
                <li><strong>Offres</strong> - Consultez les opportunités de stages et d'emplois</li>
                <li><strong>Événements</strong> - Participez à nos rencontres et activités</li>
                <li><strong>Profil</strong> - Complétez votre parcours et partagez votre expérience</li>
              </ul>

              <div style="text-align: center;">
                <a href="${loginUrl}" class="button" style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: #ffffff !important; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">Se connecter maintenant</a>
              </div>

              <p>Si le bouton ne fonctionne pas, copiez ce lien : <a href="${loginUrl}" style="color: #667eea;">${loginUrl}</a></p>

              <p style="margin-top: 30px;">Bienvenue dans la famille VH Besançon Alumni ! 🎓</p>
            </div>
            <div class="footer">
              <p>Association VH Besançon Alumni</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p><a href="mailto:contact@vh-besancon-alumni.fr" style="color: #6b7280;">contact@vh-besancon-alumni.fr</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Bienvenue dans la communauté VH Besançon Alumni !

      Bonjour ${firstName},

      Bonne nouvelle ! Votre compte a été validé par notre équipe.

      Vous pouvez maintenant vous connecter et accéder à toutes les fonctionnalités :
      - Annuaire - Retrouvez vos camarades
      - Offres - Consultez les opportunités
      - Événements - Participez à nos activités
      - Profil - Partagez votre expérience

      Connectez-vous maintenant : ${loginUrl}

      Bienvenue dans la famille VH Besançon Alumni !

      ---
      Association VH Besançon Alumni
      contact@vh-besancon-alumni.fr
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de validation:', error)
    return { success: false, error }
  }
}
