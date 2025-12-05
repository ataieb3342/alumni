import { transporter } from './config'

interface AccountValidatedNotification {
  firstName: string
  lastName: string
  email: string
}

export async function sendUserAccountValidated(userData: AccountValidatedNotification) {
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
